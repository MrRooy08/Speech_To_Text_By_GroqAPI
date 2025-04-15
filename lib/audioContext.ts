let audioContext: AudioContext | null = null;
export async function getAudioContext(): Promise<AudioContext> {
    if (typeof window === "undefined") {
        throw new Error("AudioContext is only available in the browser");
    }
    try {
        if (!audioContext) {
            const AudioContext = 
                window.AudioContext || ( window as any).webkitAudioContext;
            audioContext = new AudioContext();
        }
        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        return audioContext;
    } catch (error) {
        console.error(" Error initializing AudioContext: ", error);
        throw error;
    }
}

export function closeAudioContext() {
    if (audioContext) {
        audioContext.close().catch(console.error);
        audioContext = null;
    }
}

export function isAudioContextSuspended(): boolean {
    return !! (audioContext && audioContext.state === "running");
}
