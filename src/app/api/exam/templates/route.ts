import { NextResponse } from "next/server";
import { getSheetData, appendSheetRow } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getSheetData("Exam_Templates!A2:G");
    
    const templates = rows.map((row) => ({
      templateId: row[0] || "",
      allowedUsers: row[1] ? row[1].split(",").map((s: string) => s.trim()) : [],
      totalQuestions: parseInt(row[2]) || 10,
      chapters: row[3] ? row[3].split(",").map((s: string) => s.trim()) : [],
      startTime: row[4] || "",
      endTime: row[5] || "",
      selectedWords: row[6] ? row[6].split(",").map((s: string) => s.trim()) : [],
    }));

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: error.message || "Failed fetching exam templates" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { allowedUsers, totalQuestions, chapters, startTime, endTime, selectedWords } = await req.json();

    const templateId = `T-${Math.floor(100 + Math.random() * 900)}`;
    const allowedUsersCsv = Array.isArray(allowedUsers) ? allowedUsers.join(",") : (allowedUsers || "");
    const chaptersCsv = Array.isArray(chapters) ? chapters.join(",") : (chapters || "");
    const selectedWordsCsv = Array.isArray(selectedWords) ? selectedWords.join(",") : (selectedWords || "");

    await appendSheetRow("Exam_Templates!A2:G", [
      templateId,
      allowedUsersCsv,
      totalQuestions || 10,
      chaptersCsv,
      startTime || new Date().toISOString(),
      endTime || new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days later default
      selectedWordsCsv,
    ]);

    return NextResponse.json({
      success: true,
      template: {
        templateId,
        allowedUsers: allowedUsersCsv.split(",").filter(Boolean),
        totalQuestions,
        chapters: chaptersCsv.split(",").filter(Boolean),
        startTime,
        endTime,
        selectedWords: selectedWordsCsv.split(",").filter(Boolean),
      },
    });
  } catch (error: any) {
    console.error("Error creating exam template:", error);
    return NextResponse.json(
      { error: error.message || "Failed creating exam template" },
      { status: 500 }
    );
  }
}
