Ekhane full-stack implementation plan-ti (Shadcn UI, Google Sheets Database wrapper, ebong Gemini Vision AI dynamic data extraction automation module সহ) ekta complete **Markdown (`.md`) file** format-e niche deya holo। Aponi eti copy kore sorasori aponar `README.md` ba `IMPLEMENTATION_PLAN.md` file-e use korte parben।

````markdown
# 🇯🇵 Japanese Language Exam Platform - Full Stack Implementation Plan

Ei documentation-e Next.js 14 (App Router), Shadcn UI, Google Sheets API (Database layout), ebong Gemini Vision AI (Automatic vocabulary data extraction from images) er full integration mapping ebong coding blueprint deya holo।

---

## 🏗️ 1. Project Architecture Overview

System-ti binary operations layout horizontally synchronize thakbe:

- **Frontend UI:** Next.js (App Router) + Tailwind CSS + Shadcn UI (Desktop & Mobile Responsive/PWA view)
- **Core Database:** Google Sheets API Wrapper
- **Image Processing & OCR Engine:** Gemini Vision API (`@google/genai`)

---

## 📊 2. Google Sheet Database Schema Mapping

Aponar Google Sheet spreadsheet-e text rendering operations sequence running dynamic constraints execute korar jonno nicher **4 ta tabs/sheets** setup korte hobe:

### Sheet 1: `Words_Dataset`

| Column           | Type   | Purpose                                  |
| :--------------- | :----- | :--------------------------------------- |
| `id`             | String | Unique Vocabulary ID (e.g., W-1002)      |
| `japanese_word`  | String | Extracted Japanese Text (Kanji/Hiragana) |
| `bangla_meaning` | String | Extracted Bangla exact meanings          |
| `image_url`      | String | Hosted asset link / Cloud link           |
| `chapter`        | String | Selected Chapter group definition        |

### Sheet 2: `Exam_Templates`

| Column            | Type       | Purpose                                         |
| :---------------- | :--------- | :---------------------------------------------- |
| `template_id`     | String     | Unique ID mapped by Admin                       |
| `allowed_users`   | CSV String | Comma-separated access lists                    |
| `total_questions` | Number     | Maximum question length limit                   |
| `chapters`        | CSV String | Chapter rules configurations                    |
| `start_time`      | ISO Date   | Examination dynamic validation start constraint |
| `end_time`        | ISO Date   | Active expiration target validation point       |

### Sheet 3: `Exam_Results`

| Column        | Type     | Purpose                                       |
| :------------ | :------- | :-------------------------------------------- |
| `result_id`   | String   | Unique tracking code for Result Shareable URL |
| `user_name`   | String   | Name registered before launching exam         |
| `template_id` | String   | Template ID or 'Custom' marking identifier    |
| `score`       | Number   | Final validated positive response mark counts |
| `total_marks` | Number   | Active matrix array sequence length bounds    |
| `timestamp`   | ISO Date | Submission timing metadata node               |

### Sheet 4: `Result_Details`

| Column           | Type    | Purpose                                            |
| :--------------- | :------ | :------------------------------------------------- |
| `result_id`      | String  | Key reference pointer mapping to Sheet 3           |
| `word_id`        | String  | Reference pointer to Sheet 1                       |
| `user_answer`    | String  | Exact string entered inside input box by User      |
| `correct_answer` | String  | The validated standard correct target token string |
| `is_correct`     | Boolean | Comparison matching result (TRUE/FALSE)            |

---

## 🔒 3. System Environment Variables (`.env.local`)

```env
GOOGLE_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_actual_google_sheet_id_from_url
GEMINI_API_KEY=AIzaSyYourActualGeminiVisionEngineTokenHere
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
````

---

## 📡 4. Backend Architecture Code Blocks

### A. Google Sheets Core Utility Connector

```typescript
// src/lib/googleSheets.ts
import { google } from "googleapis";

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  [
    "[https://www.googleapis.com/auth/spreadsheets](https://www.googleapis.com/auth/spreadsheets)",
  ],
);

const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

export async function getSheetData(range: string) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data.values || [];
}

export async function appendSheetRow(range: string, values: any[]) {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}
```

### B. AI Vision Upload & Extraction Controller Route

````typescript
// src/app/api/admin/upload-extract/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { appendSheetRow } from "@/lib/googleSheets";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { imageBase64, chapterName, imageUrl } = await req.json();
    if (!imageBase64)
      return NextResponse.json(
        { error: "Missing payload assets" },
        { status: 400 },
      );

    // AI Multi-modal prompt interaction structure execution mapping
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
        `Analyze this card image. Extract the Japanese word and its exact Bangla meaning.
         Return the response ONLY in this strict JSON format:
         { "japanese_word": "extracted_word", "bangla_meaning": "extracted_meaning" }`,
      ],
    });

    const parsedJson = JSON.parse(
      aiResponse.text.replace(/```json|```/g, "").trim(),
    );
    const uniqueWordId = `W-${Math.floor(1000 + Math.random() * 9000)}`;

    // Append direct target output tracking rows inside data spreadsheet
    await appendSheetRow("Words_Dataset!A2:E", [
      uniqueWordId,
      parsedJson.japanese_word,
      parsedJson.bangla_meaning,
      imageUrl || "",
      chapterName,
    ]);

    return NextResponse.json({ success: true, extracted: parsedJson });
  } catch (error) {
    return NextResponse.json(
      { error: "Extraction sequence failed processing" },
      { status: 500 },
    );
  }
}
````

### C. Live Security Validation Interceptor Route

```typescript
// src/app/api/exam/submit/route.ts
import { NextResponse } from "next/server";
import { appendSheetRow } from "@/lib/googleSheets";

export async function POST(req: Request) {
  try {
    const { userName, templateId, score, totalMarks, responses } =
      await req.json();
    const resultId = `RES-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    // Save Master Row Record tracking meta array node
    await appendSheetRow("Exam_Results!A2:F", [
      resultId,
      userName,
      templateId,
      score,
      totalMarks,
      timestamp,
    ]);

    // Save detailed breakdown responses arrays loops
    for (const item of responses) {
      await appendSheetRow("Result_Details!A2:E", [
        resultId,
        item.wordId,
        item.userAnswer,
        item.correctAnswer,
        item.isCorrect ? "TRUE" : "FALSE",
      ]);
    }

    return NextResponse.json({ success: true, resultId });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed documenting responses" },
      { status: 500 },
    );
  }
}
```

---

## 🎨 5. Frontend Interfaces Configuration Layouts

### Admin Automation Auto-Extractor Control Deck

```tsx
// src/app/admin/upload/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function AdminUploadPanel() {
  const { toast } = useToast();
  const [chapter, setChapter] = useState("");
  const [base64, setBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const processFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onloadend = () => setBase64((r.result as string).split(",")[1]);
      r.readAsDataURL(file);
    }
  };

  const executeExtraction = async () => {
    if (!base64 || !chapter)
      return alert("All fields are processing dependencies!");
    setLoading(true);
    const res = await fetch("/api/admin/upload-extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64, chapterName: chapter }),
    });
    const data = await res.json();
    if (data.success) {
      toast({
        title: "Extraction Saved!",
        description: `${data.extracted.japanese_word} mapping added.`,
      });
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen flex items-center">
      <Card className="rounded-3xl shadow-xl w-full">
        <CardHeader>
          <CardTitle>AI Vocabulary Extractor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Chapter Name"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
          />
          <Input type="file" accept="image/*" onChange={processFile} />
          <Button
            onClick={executeExtraction}
            className="w-full bg-indigo-600 rounded-xl"
            disabled={loading}
          >
            {loading
              ? "AI Analyzing Processing Sheet..."
              : "Upload & Run Analytics"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### User Security Shield Testing Interface

```tsx
// src/app/exam/[id]/page.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function SecureInputBlock({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { toast } = useToast();

  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onPaste={(e) => {
        e.preventDefault(); // Complete execution interception block
        toast({
          variant: "destructive",
          title: "Paste Blocked",
          description:
            "Anti-cheat mechanism restricts copying content parameters inside text node fields.",
        });
      }}
      autoComplete="off"
      className="text-center font-bold text-xl h-14 rounded-2xl border-2"
      placeholder="বাংলায় সঠিক অর্থটি টাইপ করুন..."
    />
  );
}
```

---

## 🏁 6. Launch & Verification Step sequence Checklist

- [ ] Google Sheets dynamic share options open kore Service Account credentials-er email input-ke **Editor** asset authorization logic provide kora verify korun।
- [ ] Next.js validation logic processing pipeline configuration matching verify pipeline complete checking standard mapping verify apply initialization execution check sequence!

```

Aponar optimization sequence execution setup ready! Aponi direct production stack logic configuration tracking continuous code layer mapping execution deployment model apply korte parben।

```
