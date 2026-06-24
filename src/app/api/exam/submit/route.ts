import { NextResponse } from "next/server";
import { google } from "googleapis"; // সরাসরি গুগলের অফিশিয়াল প্যাকেজ ব্যবহার করা সবচেয়ে নিরাপদ

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

    const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;


    const isTemplate = templateId && templateId !== "Practice";
    const status = isTemplate ? "pending_review" : "reviewed";

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Exam_Results!A2:G",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[resultId, userName, templateId || "Practice", score, totalMarks, timestamp, status]],
      },
    });

    const rowsToInsert = responses.map((response) => [
      resultId,
      response.wordId || "",
      response.userAnswer || "",
      response.correctAnswer || "",
      response.isCorrect ? "TRUE" : "FALSE",
      response.isCorrect ? "TRUE" : "FALSE",
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Result_Details!A2:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: rowsToInsert,
      },
    });

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
