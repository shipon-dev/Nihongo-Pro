import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const resultId = params.id;
    if (!resultId) {
      return NextResponse.json({ error: "Missing result ID" }, { status: 400 });
    }

    const [resultsRows, detailsRows, wordsRows] = await Promise.all([
      getSheetData("Exam_Results!A2:G"),
      getSheetData("Result_Details!A2:F"),
      getSheetData("Words_Dataset!A2:E"),
    ]);

    // Find the specific exam result summary row
    const resultRow = resultsRows.find((row) => row[0] === resultId);
    if (!resultRow) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const examResult = {
      resultId: resultRow[0] || "",
      userName: resultRow[1] || "",
      templateId: resultRow[2] || "",
      score: parseInt(resultRow[3]) || 0,
      totalMarks: parseInt(resultRow[4]) || 0,
      timestamp: resultRow[5] || "",
      status: resultRow[6] || "reviewed",
    };

    // Filter detailed answers for this result ID
    const matchingDetails = detailsRows.filter((row) => row[0] === resultId);

    // Map vocabulary for lookup
    const wordsMap = new Map();
    wordsRows.forEach((row) => {
      wordsMap.set(row[0], {
        japaneseWord: row[1] || "",
        banglaMeaning: row[2] || "",
        imageUrl: row[3] || "",
        chapter: row[4] || "",
      });
    });

    const responses = matchingDetails.map((row) => {
      const wordId = row[1] || "";
      const wordInfo = wordsMap.get(wordId) || {
        japaneseWord: "Unknown Word",
        banglaMeaning: "Unknown",
        imageUrl: "",
        chapter: "",
      };

      const isAutoCorrect = row[4] === "TRUE";
      const adminCorrect = row.length > 5 ? row[5] === "TRUE" : isAutoCorrect;

      return {
        wordId,
        userAnswer: row[2] || "",
        correctAnswer: row[3] || "",
        isCorrect: adminCorrect,
        japaneseWord: wordInfo.japaneseWord,
        correctBanglaMeaning: wordInfo.banglaMeaning,
        imageUrl: wordInfo.imageUrl,
        chapter: wordInfo.chapter,
      };
    });

    return NextResponse.json({
      success: true,
      result: {
        ...examResult,
        responses,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving exam result details:", error);
    return NextResponse.json(
      { error: error.message || "Failed retrieving exam result details" },
      { status: 500 }
    );
  }
}
