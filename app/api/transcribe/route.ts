import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import {writeFile , unlink} from "fs/promises";
import path from "path";
import os from "os";



export async function POST(request: NextRequest) {
    let tempFilePath : string | null = null;

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json (
                {error: "No file provided"},
                {status: 400}
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const tempDir = os.tmpdir();

        const uniqueFileName = `upload-${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}${path.extname(file.name)}`;
        tempFilePath = path.join(tempDir, uniqueFileName);

        await writeFile(tempFilePath, buffer);

        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const transcription = await groq.audio.transcriptions.create({
            file: require("fs").createReadStream(tempFilePath),
            model: "whisper-large-v3",
            response_format: "json",
            language: "en",
            temperature: 0.0,
    });

        if (tempFilePath) {
            await unlink(tempFilePath);
        }

        return NextResponse.json(transcription);
    } catch (error) {
    console.error("Transcript error", error);
    if (tempFilePath) {
        try {
            await unlink(tempFilePath);
        } catch (cleanupError) {
            console.error("Cleanup error", cleanupError);
        }   
    }

        return NextResponse.json(
            {
                error: {
                    message: 
                        error instanceof Error 
                        ? error.message : 
                        "Failed to transcribe audio",
                },
            }, {status: 500}
        );
    }
}