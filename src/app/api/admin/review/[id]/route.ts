import { NextResponse } from "next/server";
import { getSheetData, updateSheetRange } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const resultId = params.id;
    const [resultsRows, detailsRows, wordsRows] = await Promise.all([
      getSheetData("Exam_Results!A2:G"),
      getSheetData("Result_Details!A2:F"),
      getSheetData("Words_Dataset!A2:E"),
    ]);

    const resultRow = resultsRows.find((row) => row[0] === resultId);
    if (!resultRow) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const wordsMap = new Map();
    wordsRows.forEach((row) => {
      wordsMap.set(row[0], {
        japaneseWord: row[1] || "",
        banglaMeaning: row[2] || "",
        chapter: row[3] || "",
      });
    });

    const matchingDetails = detailsRows.filter((row) => row[0] === resultId);

    const responses = matchingDetails.map((row) => {
      const wordId = row[1] || "";
      const wordInfo = wordsMap.get(wordId) || {
        japaneseWord: "Unknown Word",
        banglaMeaning: "Unknown",
        chapter: "",
      };
      return {
        wordId,
        japaneseWord: wordInfo.japaneseWord,
        correctAnswer: row[3] || "",
        userAnswer: row[2] || "",
        isCorrect: row.length > 5 ? row[5] === "TRUE" : row[4] === "TRUE",
        autoCorrect: row[4] === "TRUE",
        chapter: wordInfo.chapter,
      };
    });

    return NextResponse.json({
      success: true,
      result: {
        resultId: resultRow[0] || "",
        userName: resultRow[1] || "",
        templateId: resultRow[2] || "",
        score: parseInt(resultRow[3]) || 0,
        totalMarks: parseInt(resultRow[4]) || 0,
        timestamp: resultRow[5] || "",
        status: resultRow[6] || "reviewed",
        responses,
      },
    });
  } catch (error: any) {
    console.error("Error fetching review data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch review data" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const resultId = params.id;
    const { responses } = await req.json();

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json({ error: "Missing responses array" }, { status: 400 });
    }

    const [resultsRows, detailsRows] = await Promise.all([
      getSheetData("Exam_Results!A2:G"),
      getSheetData("Result_Details!A2:F"),
    ]);

    const matchingIndices = detailsRows
      .map((row, i) => (row[0] === resultId ? i : -1))
      .filter((i) => i !== -1);

    const updates: { range: string; values: string[][] }[] = [];
    responses.forEach((resp: { wordId: string; isCorrect: boolean }) => {
      const idx = matchingIndices.find((i) => detailsRows[i][1] === resp.wordId);
      if (idx === undefined) return;
      const rowNum = idx + 2;
      updates.push({
        range: `Result_Details!F${rowNum}`,
        values: [[resp.isCorrect ? "TRUE" : "FALSE"]],
      });
    });

    for (const update of updates) {
      await updateSheetRange(update.range, update.values);
    }

    const newScore = responses.filter((r: { isCorrect: boolean }) => r.isCorrect).length;
    const resultIndex = resultsRows.findIndex((row) => row[0] === resultId);
    if (resultIndex !== -1) {
      const resultRowNum = resultIndex + 2;
      await updateSheetRange(`Exam_Results!D${resultRowNum}`, [[String(newScore)]]);
      await updateSheetRange(`Exam_Results!G${resultRowNum}`, [["reviewed"]]);
    }

    return NextResponse.json({ success: true, score: newScore });
  } catch (error: any) {
    console.error("Error saving review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save review" },
      { status: 500 }
    );
  }
}
