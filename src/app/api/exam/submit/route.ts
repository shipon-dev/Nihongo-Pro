import { NextResponse } from "next/server";
import { appendSheetRow } from "@/lib/googleSheets";

export async function POST(req: Request) {
  try {
    const { userName, templateId, score, totalMarks, responses } = await req.json();

    if (!userName || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Missing required fields: userName or responses" },
        { status: 400 }
      );
    }

    // Generate unique Result ID
    const resultId = `RES-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    // Append to Exam_Results spreadsheet
    await appendSheetRow("Exam_Results!A2:F", [
      resultId,
      userName,
      templateId || "Practice",
      score,
      totalMarks,
      timestamp,
    ]);

    // Append detail breakdown responses in loop
    for (const response of responses) {
      await appendSheetRow("Result_Details!A2:E", [
        resultId,
        response.wordId || "",
        response.userAnswer || "",
        response.correctAnswer || "",
        response.isCorrect ? "TRUE" : "FALSE",
      ]);
    }

    return NextResponse.json({
      success: true,
      resultId,
    });
  } catch (error: any) {
    console.error("Exam submission save error:", error);
    return NextResponse.json(
      { error: error.message || "Failed documenting responses" },
      { status: 500 }
    );
  }
}
