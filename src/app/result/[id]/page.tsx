"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Home,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface ResponseItem {
  wordId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  japaneseWord: string;
  correctBanglaMeaning: string;
  imageUrl: string;
  chapter: string;
}

interface ResultData {
  resultId: string;
  userName: string;
  templateId: string;
  score: number;
  totalMarks: number;
  timestamp: string;
  status: string;
  responses: ResponseItem[];
}

export default function ResultViewer({ params }: { params: { id: string } }) {
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResult() {
      try {
        setLoading(true);
        const res = await fetch(`/api/exam/results/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setResult(data.result);
        }
      } catch (err) {
        console.error("Failed loading result details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
          <p className="text-sm font-semibold text-neutral-500">
            Retrieving worksheet results...
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Card className="w-full max-w-md border-red-500/20 p-8 text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="text-xl font-bold">Record Not Found</h3>
          <p className="mt-2 text-sm text-neutral-500">
            The exam score record code could not be resolved in the database.
          </p>
          <Link href="/">
            <Button className="mt-6 font-bold" variant="outline">
              Return Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (result.status === "pending_review") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Card className="w-full max-w-md border-amber-500/20 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-500">
            <svg className="h-8 w-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold">Result Pending Review</h3>
          <p className="mt-2 text-sm text-neutral-500">
            Your exam is currently being reviewed by the administrator. Please
            check back later to view your result.
          </p>
          <Link href="/">
            <Button className="mt-6 font-bold" variant="outline">
              Return Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const scorePercentage = Math.round((result.score / result.totalMarks) * 100);
  let feedbackTitle = "Keep Practicing!";
  let feedbackDescription =
    "Japanese learning takes patience. Keep practicing your flashcards!";
  let ringColor = "stroke-red-500";
  let ringBg = "text-red-500/10";
  if (scorePercentage >= 85) {
    feedbackTitle = "Outstanding Performance!";
    feedbackDescription =
      "Excellent job! You have fully mastered these vocabulary items.";
    ringColor = "stroke-emerald-500";
    ringBg = "text-emerald-500/10";
  } else if (scorePercentage >= 50) {
    feedbackTitle = "Good Progress!";
    feedbackDescription =
      "Great effort! Review the words you missed to score 100% next time.";
    ringColor = "stroke-emerald-500";
    ringBg = "text-emerald-500/10";
  }

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (scorePercentage / 100) * circumference;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-10 animate-fade-in">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 font-semibold"
          >
            <Home className="h-4 w-4 text-emerald-500" /> Portal Home
          </Button>
        </Link>
        <span className="font-mono text-xs text-neutral-500">
          Result ID: {result.resultId}
        </span>
      </div>

      <Card className="p-6 md:p-8">
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="relative flex h-36 w-36 flex-shrink-0 items-center justify-center">
            <svg className="h-full w-full -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className={`stroke-current ${ringBg}`}
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className={`stroke-current drop-shadow-lg ${ringColor} transition-all duration-1000 ease-out`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black">{scorePercentage}%</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                Score
              </span>
            </div>
          </div>
          <div className="flex-grow space-y-3 text-center md:text-left">
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Exam Summary
            </span>
            <h2 className="text-2xl font-black leading-tight md:text-3xl">
              {feedbackTitle}
            </h2>
            <p className="max-w-lg text-sm text-neutral-500">
              {feedbackDescription}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-xs text-neutral-500 md:justify-start justify-center">
              <span className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-neutral-500" />
                Score: <strong>{result.score}</strong> / {result.totalMarks}{" "}
                marks
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                Completed:{" "}
                <strong>
                  {new Date(result.timestamp).toLocaleDateString()}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-xl font-extrabold">
          <BookOpen className="h-5 w-5 text-emerald-500" /> Detailed Review
          Sheet
        </h3>
        <div className="space-y-3">
          {result.responses.map((item, index) => (
            <Card
              key={index}
              className={`p-4 transition-colors ${item.isCorrect ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "border-red-500/20 bg-red-500/[0.02]"}`}
            >
              <div className="flex items-center gap-4">
                {item.imageUrl ? (
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <img
                      src={item.imageUrl}
                      alt="thumb"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 text-[10px] font-bold uppercase text-neutral-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-neutral-600">
                    No Pic
                  </div>
                )}
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-lg font-black leading-none">
                      {item.japaneseWord}
                    </h4>
                    <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-neutral-600">
                      Chapter {item.chapter}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                    <p className="truncate text-neutral-500">
                      Your answer:{" "}
                      <strong
                        className={
                          item.isCorrect ? "text-emerald-500" : "text-red-500"
                        }
                      >
                        {item.userAnswer || "(empty)"}
                      </strong>
                    </p>
                    {/* <p className="truncate text-neutral-500">Correct: <strong>{item.correctBanglaMeaning || item.correctAnswer}</strong></p> */}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {item.isCorrect ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
