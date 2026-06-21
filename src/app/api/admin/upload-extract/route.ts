import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { appendSheetRows } from "@/lib/googleSheets";
import fs from "fs";
import path from "path";

// Initialize Gemini client using environment API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "AIzaSy_dummy_key_for_build_purposes" });

export async function POST(req: Request) {
  try {
    const { imageBase64, chapterName } = await req.json();
    
    if (!imageBase64 || !chapterName) {
      return NextResponse.json(
        { error: "Missing required fields: imageBase64 or chapterName" },
        { status: 400 }
      );
    }

    // Prepare base64 data by stripping any prefixes
    let cleanBase64 = imageBase64;
    if (cleanBase64.includes(";base64,")) {
      cleanBase64 = cleanBase64.split(";base64,")[1];
    }

    // Call Gemini 2.5 Flash to extract Japanese words & Bangla meanings
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
        `Analyze this card image. Extract ALL the Japanese words and their exact Bangla meanings.
         Return the response ONLY in this strict JSON format as an array of objects:
         [
           { "japanese_word": "extracted_word_1", "bangla_meaning": "extracted_meaning_1" },
           { "japanese_word": "extracted_word_2", "bangla_meaning": "extracted_meaning_2" }
         ]
         Do not include any extra text or conversational filler, just the raw JSON array.`,
      ],
    });

    const responseText = aiResponse.text || "";
    const cleanJsonText = responseText.replace(/```json|```/g, "").trim();
    
    let parsedJson;
    try {
      parsedJson = JSON.parse(cleanJsonText);
    } catch (parseErr) {
      console.error("Gemini response was not valid JSON:", responseText);
      return NextResponse.json(
        { error: "AI response failed JSON validation. Please try again." },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsedJson) || parsedJson.length === 0) {
      return NextResponse.json(
        { error: "Could not extract Japanese words or Bangla meanings from the card." },
        { status: 500 }
      );
    }

    // Save image to the local public uploads directory
    const buffer = Buffer.from(cleanBase64, "base64");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filename = `card-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    const imageUrl = `/uploads/${filename}`;

    // Prepare rows for Google Sheets
    const rowsToInsert = [];
    const extractedWords = [];

    for (const item of parsedJson) {
      const uniqueWordId = `W-${Math.floor(1000 + Math.random() * 9000)}`;
      rowsToInsert.push([
        uniqueWordId,
        item.japanese_word,
        item.bangla_meaning,
        imageUrl,
        chapterName,
      ]);
      extractedWords.push({
        id: uniqueWordId,
        japanese_word: item.japanese_word,
        bangla_meaning: item.bangla_meaning,
        image_url: imageUrl,
        chapter: chapterName,
      });
    }

    // Bulk append to Google Sheets Words_Dataset
    await appendSheetRows("Words_Dataset!A2:E", rowsToInsert);

    return NextResponse.json({
      success: true,
      extracted: extractedWords,
    });
  } catch (error: any) {
    console.error("Upload and extraction error:", error);
    return NextResponse.json(
      { error: error.message || "Extraction sequence failed processing" },
      { status: 500 }
    );
  }
}
