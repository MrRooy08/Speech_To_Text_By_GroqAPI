"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Upload,
  Loader2,
  StopCircle,
  Volume2,
  FileAudio,
} from "lucide-react";
import TranscriptionResult from "./TranscriptionResult";
import AudioVisualize from "./AudioVisualize";
import { useHasBrowser } from "@/lib/useHasBrowser";

const ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4"];

const AudioUploader = () => {
  const hasBrowser = useHasBrowser();
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
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
  }, [hasBrowser]);

  const handleFileChange = (selectedFile: File) => {
    setError("");

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
    setFile(selectedFile);
    setAudioUrl(URL.createObjectURL(selectedFile));

    if (isRecording) {
      handleStopRecording();
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
    if (recognitionRef.current && !isRecording) {
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

  const handleSubmit = async () => {
    if (!file) return;

    setIsLoading(true);
    setError("");
    setTranscription("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
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

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50/80
        via-white to-purple-50/80 dark:from-gray-900 dark:via-gray-800
        dark:to-indigo-950 p-6"
    >
      <div className=" max-w-7xl mx-auto">
        {/** Header */}
        <div className="text-center mb-12">
          <h1
            className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600
                    bg-clip-text text-transparent mb-4"
          >
            Audio Transcription
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Transform your audio into text with professional accuracy.
          </p>
        </div>
        {/** Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/** Left column - Upload & Controls */}
          <div className="space-y-6">
            {/** Upload card */}
            <div className="relative group">
              <div
                className={`p-8 rounded-2xl backdrop-blur-xl
                            transition-all duration-300 
                                ${
                                  isRecording
                                    ? "bg-red-50/90 dark:bg-red-900/20 border-2 border-red-500 shadow-lg shawdow-red-500/20"
                                    : "bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 border border-gray-200 dark:border-gray-700"
                                }
                            `}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center space-y-6">
                  {/** Icon Container */}
                  <div
                    className={`p-4 rounded-full transition-transform duration-300 group-hover:scale-110'
                                ${
                                  isRecording
                                    ? "bg-red-100 dark:bg-red-900/50"
                                    : "bg-indigo-100 dark:bg-indigo-900/50"
                                }
                                `}
                  >
                    {isLoading ? (
                      <FileAudio className="w-8 h-8 text-red-600 dark:text-red-400" />
                    ) : (
                      <FileAudio className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  {/** Text */}
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      {isRecording ? "Recording..." : "Upload Audio File here"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isRecording
                        ? "Your audio is being captured...."
                        : "Or click to select a file"}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Supports MP3, WAV, M4A (max 25MB)
                    </p>
                  </div>
                  {/** Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) =>
                      e.target.files && handleFileChange(e.target.files[0])
                    }
                    accept={ALLOWED_TYPES.join(",")}
                    className="hidden"
                  />
                  {/** Upload Button */}
                  {!isRecording && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 font-medium text-white dark:text-gray-300 hover:bg-gray-100 hover:text-black dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Choose File
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/** Visualizer Card */}
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Audio Visualizer
                </h2>
              </div>
              <AudioVisualize
                audioUrl={audioUrl}
                mediaStream={mediaStream}
                isLive={isRecording}
              />
            </div>
            {/** Control Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={
                  handleSubmit
                }
                disabled={!file || isLoading || isRecording}
                className={`
                                    flex items-center gap-2 px-4 py-2 text-sm text-black rounded-lg transition-all
                                    ${
                                      !file || isLoading || isRecording
                                        ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-gray-600 cursor-not-allowed"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg "
                                    }
                                `}
              >
                {" "}
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Transcribe
                  </>
                )}
              </button>
              <button
                onClick={
                  isRecording ? handleStopRecording : handleStartRecording
                }
                disabled={!isSpeechSupported || isLoading}
                className={`py-4 px-6 rounded-xl text-white text-sm transition-all flex items-center justify-center gap-1
                  ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed" // Nếu đang tải, màu xám và không thể nhấn
                      : isRecording
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
              >
                {isRecording ? (
                  <>
                    <StopCircle className="w-5 h-5" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Record
                  </>
                )}
              </button>
              {/** Error Message **/}
              {error && (
                <div className="text-red-500 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
          {/** Right Column - Transcription */}
          <div className="relative">
            {transcription ? (
              <TranscriptionResult text={transcription} />
            ) : (
              <div
                className="h-full min-h-[400px] bg-white/3o dark:bg-gray-800/30 backdrop-blur-xl 
                                 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 flex items-center justify-center"
              >
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Your Transcription will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioUploader;
