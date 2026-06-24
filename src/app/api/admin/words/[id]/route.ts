import { NextResponse } from "next/server";
import { getSheetData, updateSheetRange, clearSheetRange } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const wordId = params.id;
    const { japaneseWord, banglaMeaning, chapter } = await req.json();

    const rows = await getSheetData("Words_Dataset!A2:E");
    const rowIndex = rows.findIndex((row) => row[0] === wordId);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const rowNum = rowIndex + 2;
    const existingRow = rows[rowIndex];

    await updateSheetRange(`Words_Dataset!A${rowNum}:E${rowNum}`, [[
      wordId,
      japaneseWord || existingRow[1] || "",
      banglaMeaning || existingRow[2] || "",
      existingRow[3] || "",
      chapter || existingRow[4] || "",
    ]]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating word:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update word" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const wordId = params.id;
    const rows = await getSheetData("Words_Dataset!A2:E");
    const rowIndex = rows.findIndex((row) => row[0] === wordId);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    const rowNum = rowIndex + 2;
    await clearSheetRange(`Words_Dataset!A${rowNum}:E${rowNum}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting word:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete word" },
      { status: 500 }
    );
  }
}
