import { NextResponse } from "next/server";
import { getSheetData, clearSheetRange } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const resultId = params.id;
    if (!resultId) {
      return NextResponse.json({ error: "Missing result ID" }, { status: 400 });
    }

    const resultsRows = await getSheetData("Exam_Results!A2:F");
    const detailsRows = await getSheetData("Result_Details!A2:E");

    const resultIndex = resultsRows.findIndex((row) => row[0] === resultId);
    if (resultIndex === -1) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const resultRowNum = resultIndex + 2;
    const examRange = `Exam_Results!A${resultRowNum}:F${resultRowNum}`;

    const detailRanges = detailsRows
      .map((row, i) => (row[0] === resultId ? i + 2 : null))
      .filter((r): r is number => r !== null)
      .map((rowNum) => `Result_Details!A${rowNum}:E${rowNum}`);

    await clearSheetRange(examRange, ...detailRanges);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting exam result:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete exam result" },
      { status: 500 },
    );
  }
}
