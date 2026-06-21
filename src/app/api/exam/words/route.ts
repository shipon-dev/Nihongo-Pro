import { NextResponse } from "next/server";
import { getSheetData } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chapterFilter = searchParams.get("chapter");

    const rows = await getSheetData("Words_Dataset!A2:E");

    let words = rows.map((row) => ({
      id: row[0] || "",
      japaneseWord: row[1] || "",
      banglaMeaning: row[2] || "",
      imageUrl: row[3] || "",
      chapter: row[4] || "",
    }));

    if (chapterFilter) {
      const filters = chapterFilter.split(",").map((s) => s.trim().toLowerCase());
      words = words.filter((w) => filters.includes(w.chapter.toLowerCase()));
    }

    return NextResponse.json({ success: true, words });
  } catch (error: any) {
    console.error("Error fetching words dataset:", error);
    return NextResponse.json(
      { error: error.message || "Failed fetching words dataset" },
      { status: 500 }
    );
  }
}
