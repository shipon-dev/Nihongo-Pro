"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AdminAuth } from "@/components/ui/admin-auth";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Upload, Sparkles, Image as ImageIcon, BookOpen } from "lucide-react";
import Link from "next/link";

export default function AdminUploadPanel() {
  const { toast } = useToast();
  const router = useRouter();
  const [chapter, setChapter] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedWords, setExtractedWords] = useState<{
    japanese_word: string;
    bangla_meaning: string;
  }[] | null>(null);

  const processFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultString = reader.result as string;
        setPreview(resultString);
        setBase64(resultString.split(",")[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const executeExtraction = async () => {
    if (!base64 || !chapter) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please specify a Chapter Name and upload an Image card.",
      });
      return;
    }

    setLoading(true);
    setExtractedWords(null);

    try {
      const res = await fetch("/api/admin/upload-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, chapterName: chapter }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setExtractedWords(data.extracted);
        toast({
          variant: "success",
          title: "Extraction Saved!",
          description: `Successfully added ${data.extracted.length} words to Chapter "${chapter}".`,
        });
        setPreview(null);
        setBase64(null);
      } else {
        throw new Error(data.error || "Failed to process image card.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: err.message || "Something went wrong while running Gemini AI.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuth>
    <div className="min-h-screen bg-transparent p-6 md:p-12 flex flex-col justify-center items-center">
      <div className="w-full max-w-lg mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors gap-2 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      <Card className="w-full max-w-lg shadow-xl border-emerald-500/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-3 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <Sparkles className="h-7 w-7 text-emerald-500" />
          </div>
          <CardTitle className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            AI Vocabulary Extractor
          </CardTitle>
          <CardDescription>
            Upload a flashcard image to automatically extract the Japanese word and Bangla meaning using Gemini Vision.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Chapter Name
            </label>
            <Input
              placeholder="e.g. Chapter 1, Verbs, N5 Essentials"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> Card Image Upload
            </label>
            
            {!preview ? (
              <div className="relative group cursor-pointer border-2 border-dashed border-neutral-300 hover:border-emerald-500/50 bg-neutral-50 hover:bg-emerald-50 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300 dark:border-white/[0.08] dark:hover:border-emerald-500/50 dark:bg-white/[0.02] dark:hover:bg-emerald-500/[0.02]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={processFile}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Upload className="h-10 w-10 text-neutral-400 group-hover:text-emerald-500 transition-colors mb-3" />
                <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">Choose card image file</p>
                <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-600">PNG, JPG, or WEBP up to 5MB</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 p-2 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <img
                  src={preview}
                  alt="Card Preview"
                  className="w-full h-64 object-contain rounded-xl"
                />
                <button
                  onClick={() => {
                    setPreview(null);
                    setBase64(null);
                  }}
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
                >
                  Change Image
                </button>
              </div>
            )}
          </div>

          <Button
            onClick={executeExtraction}
            className="w-full font-bold"
            variant="premium"
            disabled={loading || !base64 || !chapter}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Gemini Extracting Card Data...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Run AI Auto-Extractor
              </span>
            )}
          </Button>

          {extractedWords && extractedWords.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] animate-slide-in">
              <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                Extracted Words ({extractedWords.length}):
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {extractedWords.map((word, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white border border-neutral-200 p-3 rounded-xl dark:bg-black/40 dark:border-white/[0.06]">
                    <div>
                      <p className="text-lg font-bold">{word.japanese_word}</p>
                      <p className="text-sm text-neutral-500 mt-1">Bangla: {word.bangla_meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AdminAuth>
  );
}