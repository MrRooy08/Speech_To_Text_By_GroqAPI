import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, Upload } from "lucide-react";
import AudioVisualize from "./AudioVisualize";
import { useHasBrowser } from "@/lib/useHasBrowser";

interface SpeechToTextCommentProps {
  onSubmit: (comment: string) => void;
}

const ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4"];
const SpeechToTextComment: React.FC<SpeechToTextCommentProps> = ({
  onSubmit,
}) => {
  const hasBrowser = useHasBrowser();
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [resetTranscript, setResetTranscript] = useState (false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (hasBrowser) {
      const speechSupported =
        "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
      setIsSpeechSupported(speechSupported);
    }
  }, [hasBrowser]);

  useEffect(() => {
    if (!hasBrowser) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let finalTranscript = "";
      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + "";
          } else {
            interimTranscript += transcript + "";
          }
        }
        setTranscription(finalTranscript + interimTranscript);
      };
      recognition.onerror = (event: any) => {
        console.log("Speech recognition error", event.error);
        setError(`Speech recognition error. Please try again. ${event.error}`);
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [hasBrowser,resetTranscript]);

  const handleFileChange = async(selectedFile: File) => {
    setError("");
    if (!selectedFile) return;
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError(
        "Invalid file type. Please upload an audio file by MP3, WAV, or M4A."
      );
      return;
    }

    const maxSize = 25 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(
        "File size exceeds the limit of 25MB. Please upload a smaller file."
      );
      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioUrl(URL.createObjectURL(selectedFile));

    if (isRecording) {
      handleStopRecording();
    }


    setIsLoading(true);
    setError("");
    setTranscription("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      console.log("📥 Kết quả API:", data);
      if (!response.ok) {
        throw new Error(data.error?.message || " Failed to transcribe audio");
      }
      setTranscription(data.text);

    } catch (err) {
      setError(
        err instanceof Error ? err.message : " Failed to transcribe audio"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleStartRecording = async () => {
    if (recognitionRef.current) {
      // 🔹 Nếu đang ghi âm, dừng trước khi bắt đầu lại
      recognitionRef.current.stop();
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setMediaStream(stream);
        recognitionRef.current.start();
        setIsRecording(true); //dang ghi am
        setTranscription("");
        
      } catch (error) {
        console.error("Error starting recording", error);
        setError("Error starting recording. Please try again.");
    }
  };
  const handleStopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
      }
    }
  };

  const handleSubmit = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (transcription.trim()) {
      onSubmit(transcription);
      setTranscription("");
      setIsRecording(false);
      setResetTranscript((prev) =>!prev);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <div className="flex flex-col gap-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <div className="relative">
          <textarea
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            placeholder={
              isSpeechSupported
                ? "Start speaking or type your comment..."
                : "Speech recognition not supported. Please type your comment..."
            }
            className="w-full min-h-[120px] p-4 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) =>
                e.target.files && handleFileChange(e.target.files[0])
              }
              accept={ALLOWED_TYPES.join(",")}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecording }
              className="p-2 bg-purple-500 hover:bg-purple-600 rounded-full transition-colors
              disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5 text-white" />
            </button>
            {isSpeechSupported && (
              <button
                onClick={
                  isRecording ? handleStopRecording : handleStartRecording
                }
                className={`p-2 rounded-full transition-colors ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-white" />
                )}
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!transcription.trim() || isLoading}
              className="p-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        {isRecording && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">Recording...</span>
            </div>
            <AudioVisualize
              audioUrl={audioUrl}
              mediaStream={mediaStream}
              isLive={isRecording}
            />
          </div>
        )}
        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">
              Processing audio file...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechToTextComment;
