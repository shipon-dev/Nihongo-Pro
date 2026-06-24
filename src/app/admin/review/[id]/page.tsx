"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminAuth } from "@/components/ui/admin-auth";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Send,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";

interface ReviewResponse {
  wordId: string;
  japaneseWord: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  autoCorrect: boolean;
  chapter: string;
}

interface ReviewData {
  resultId: string;
  userName: string;
  templateId: string;
  score: number;
  totalMarks: number;
  timestamp: string;
  status: string;
  responses: ReviewResponse[];
}

export default function ReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [marks, setMarks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadReview() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/review/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setReview(data.result);
          const initialMarks: Record<string, boolean> = {};
          data.result.responses.forEach((r: ReviewResponse) => {
            initialMarks[r.wordId] = r.isCorrect;
          });
          setMarks(initialMarks);
        }
      } catch (err) {
        console.error("Failed loading review:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReview();
  }, [params.id]);

  const toggleMark = (wordId: string) => {
    setMarks((prev) => ({ ...prev, [wordId]: !prev[wordId] }));
  };

  const handleSubmit = async () => {
    if (!review) return;
    setSubmitting(true);
    try {
      const responses = review.responses.map((r) => ({
        wordId: r.wordId,
        isCorrect: marks[r.wordId],
      }));

      const res = await fetch(`/api/admin/review/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          variant: "success",
          title: "Review Saved",
          description: `Score updated: ${data.score} / ${review.totalMarks}`,
        });
        router.push("/admin");
      } else {
        throw new Error(data.error || "Failed to save review");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to save review",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingReviewCount = review
    ? review.responses.filter((r) => marks[r.wordId] !== r.autoCorrect).length
    : 0;

  return (
    <AdminAuth>
      <div className="min-h-screen bg-transparent p-4 md:p-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 font-semibold mb-3"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-emerald-500" /> Review
              Exam
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            <p className="text-sm text-neutral-500 font-semibold">
              Loading exam details...
            </p>
          </div>
        ) : !review ? (
          <Card className="p-8 text-center">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h3 className="text-xl font-bold">Review Not Found</h3>
            <p className="mt-2 text-sm text-neutral-500">
              This exam result could not be found.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase font-semibold tracking-wider text-neutral-500">
                    Student
                  </p>
                  <p className="font-bold mt-1">{review.userName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold tracking-wider text-neutral-500">
                    Template
                  </p>
                  <p className="font-mono font-bold mt-1">
                    {review.templateId}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold tracking-wider text-neutral-500">
                    Current Score
                  </p>
                  <p className="font-bold mt-1">
                    {review.score} / {review.totalMarks}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold tracking-wider text-neutral-500">
                    Changes Made
                  </p>
                  <p className="font-bold mt-1">{pendingReviewCount}</p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-bold">
                Question Review ({review.responses.length} items)
              </h2>

              {review.responses.map((response, index) => (
                <Card
                  key={response.wordId}
                  className={`p-5 transition-colors ${
                    marks[response.wordId] !== response.autoCorrect
                      ? "border-amber-500/40 bg-amber-500/[0.03]"
                      : marks[response.wordId]
                        ? "border-emerald-500/20 bg-emerald-500/[0.02]"
                        : "border-red-500/20 bg-red-500/[0.02]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-400">
                          #{index + 1}
                        </span>
                        <span className="rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-500 dark:border-white/[0.06] dark:bg-white/[0.03]">
                          Chapter {response.chapter}
                        </span>
                      </div>
                      <h3 className="text-xl font-black">
                        {response.japaneseWord}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-white/[0.03]">
                          <p className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500 mb-1">
                            Correct Answer
                          </p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">
                            {response.correctAnswer}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-white/[0.03]">
                          <p className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500 mb-1">
                            Student Answer
                          </p>
                          <p
                            className={`font-bold ${
                              response.userAnswer.trim()
                                ? "text-neutral-900 dark:text-white"
                                : "text-neutral-400 italic"
                            }`}
                          >
                            {response.userAnswer.trim() || "(empty)"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleMark(response.wordId)}
                      className={`flex-shrink-0 p-3 rounded-2xl transition-all border-2 ${
                        marks[response.wordId]
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/10"
                          : "border-red-500 bg-red-500/10 text-red-500 shadow-lg shadow-red-500/10"
                      }`}
                    >
                      {marks[response.wordId] ? (
                        <CheckCircle2 className="h-8 w-8" />
                      ) : (
                        <XCircle className="h-8 w-8" />
                      )}
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-neutral-400">
                    Auto-grade:{" "}
                    {response.autoCorrect ? (
                      <span className="text-emerald-500 font-semibold">
                        Correct
                      </span>
                    ) : (
                      <span className="text-red-500 font-semibold">
                        Incorrect
                      </span>
                    )}
                    {marks[response.wordId] !== response.autoCorrect && (
                      <span className="text-amber-500 font-semibold ml-2">
                        (Changed)
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="sticky bottom-4">
              <Button
                onClick={handleSubmit}
                variant="premium"
                className="w-full h-14 text-lg font-bold rounded-xl shadow-xl shadow-emerald-500/20"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving Review...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-5 w-5" /> Submit Review &amp; Publish
                    Result
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminAuth>
  );
}
