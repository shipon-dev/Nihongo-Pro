import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getSheetData("Exam_Results!A2:F");
    
    const results = rows.map((row) => ({
      resultId: row[0] || "",
      userName: row[1] || "",
      templateId: row[2] || "",
      score: parseInt(row[3]) || 0,
      totalMarks: parseInt(row[4]) || 0,
      timestamp: row[5] || "",
    }));

    // Sort by timestamp desc
    results.reverse();

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Error fetching results list for admin:", error);
    return NextResponse.json(
      { error: error.message || "Failed fetching exam results" },
      { status: 500 }
    );
  }
}
