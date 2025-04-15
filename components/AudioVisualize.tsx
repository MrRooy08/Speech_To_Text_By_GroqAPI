"use client";

import { useEffect, useRef } from "react";
import { getAudioContext } from "@/lib/audioContext";
import { useHasBrowser } from "@/lib/useHasBrowser";    

interface AudioVisualizeProps {
    audioUrl: string | null;
    mediaStream: MediaStream | null;
    isLive: boolean;
}

const AudioVisualize = ({ 
    audioUrl,
    mediaStream, 
    isLive
}: AudioVisualizeProps) => {
    const hasBrowser = useHasBrowser();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const animationRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode>(null);
    const sourceRef = useRef <
    MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);

    // dung de tao moi 1 source am thanh moi 
    const audioUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!hasBrowser ) return; 

        const initializeAudioContext = async () => {
            const audioContext = await getAudioContext();
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const cleanup = () => {
                if(animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                }
                if (sourceRef.current) {
                    sourceRef.current.disconnect();
                    sourceRef.current = null;
                }

                if (analyserRef.current) {
                    analyserRef.current.disconnect();
                    analyserRef.current = null;
                }
            };

            if (isLive && mediaStream) {
                cleanup();

                try {
                    const source = audioContext.createMediaStreamSource(mediaStream);
                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256;
                    source.connect(analyser);
                    sourceRef.current = source;
                    analyserRef.current = analyser;
                    draw( analyser,ctx,canvas.width, canvas.height);
                } catch (error){
                    console.error("Error initializing live audio", error);
                    cleanup();
                }
            } else if (audioUrl && !isLive) {
                const audio = audioRef.current;
                if (!audio) return;

                audio.crossOrigin = "anonymous";

                // chi tao 1 source moi khi audioUrl thay doi
                if (audioUrl !==  audioUrlRef.current) {
                    cleanup();
                    try {
                        const source = audioContext.createMediaElementSource(audio);
                        const analyser = audioContext.createAnalyser();
                        analyser.fftSize = 256;
                        source.connect(analyser);
                        analyser.connect(audioContext.destination);
                        sourceRef.current = source;
                        analyserRef.current = analyser;
                        draw(analyser, ctx, canvas.width, canvas.height);
                    } catch (error) {
                        console.error("Error initializing audio", error);
                        cleanup();
                        return ;
                    }
                }

                const handlePlay = () => {
                    if (analyserRef.current && ctx) {
                        draw(analyserRef.current, ctx, canvas.width, canvas.height);
                    }
                };

                const handleEnded = () => {
                    if (analyserRef.current) {
                        cancelAnimationFrame(animationRef.current);
                    }
                };

                audio.addEventListener("play", handlePlay);
                audio.addEventListener("ended", handleEnded);
                audio.addEventListener("pause", handleEnded);

                return () => {
                    audio.removeEventListener("play", handlePlay);
                    audio.removeEventListener("ended", handleEnded);
                    audio.removeEventListener("pause", handleEnded);
                };
                
            }
            return cleanup;
        };
        initializeAudioContext();
    }, [hasBrowser, audioUrl, mediaStream, isLive]);

    const draw = (
        analyser: AnalyserNode,
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
    ) => {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const drawVisualizer = () => {
            animationRef.current = requestAnimationFrame(drawVisualizer);
            analyser.getByteFrequencyData(dataArray);
            ctx.fillStyle = "rgb(17, 24, 39)";
            ctx.fillRect(0, 0, width, height);

            const barwidth = (width / bufferLength) * 2.5;
            let x = 0;

            for (let i =0 ; i< bufferLength; i++){
                const barheight = (dataArray[i] / 255) * height;

                const gradient = ctx.createLinearGradient
                (0, height, 0, height - barheight);
                gradient.addColorStop(0, "rgb(129,140,248)");
                gradient.addColorStop(1, "rgb(199, 210, 254)");

                ctx.fillStyle = gradient;
                ctx.fillRect(x, height - barheight, barwidth, barheight);
                x += barwidth + 1;
            }
        };
        drawVisualizer();
    };

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect();
            }
            if (analyserRef.current) {
                analyserRef.current.disconnect();
            }
        };
    }, []);
    
    return (
        <div className="w-full space-y-4">
            <canvas 
                ref = {canvasRef}
                className="w-full h-40 rounded-lg bg-gray-900"
                width={500}
                height={160}
            />
            {audioUrl && !isLive && (
                <audio 
                    ref = {audioRef}
                    src={audioUrl}
                    controls
                    className="w-full rounded-lg bg-gray-100 dark:bg-gray-800"
                />
            )}
        </div>
    );
};

export default AudioVisualize;
