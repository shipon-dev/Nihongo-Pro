"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle2,
  FileText,
  ListChecks,
  LogIn,
  Play,
  Send,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Word {
  id: string;
  japaneseWord: string;
  banglaMeaning: string;
  imageUrl: string;
  chapter: string;
}

interface AnswerEntry {
  wordId: string;
  userAnswer: string;
}

interface Question {
  wordId: string;
  japaneseWord: string;
  correctAnswer: string;
  chapter: string;
}

interface ResponseDetail {
  wordId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export default function ExamConsole({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const isPractice = params.id === "practice";

  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [examFinished, setExamFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResultId, setSubmittedResultId] = useState<string | null>(
    null,
  );

  const filterChaptersRef = useRef("");

  const [practiceCount, setPracticeCount] = useState<number | string>(10);
  const [practiceSetup, setPracticeSetup] = useState(true);

  useEffect(() => {
    const name = searchParams.get("name");
    const email = searchParams.get("email");
    filterChaptersRef.current = searchParams.get("chapters") || "";

    if (name) {
      setUserName(name);
      setUserEmail(email || "anonymous@mail.com");
      setLoggedIn(true);
      router.replace(`/exam/${params.id}`, undefined);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;

    async function setupExam() {
      try {
        setLoading(true);
        let targetWords: Word[] = [];

        if (isPractice) {
          const fetchUrl = filterChaptersRef.current
            ? `/api/exam/words?chapter=${encodeURIComponent(filterChaptersRef.current)}`
            : "/api/exam/words";
          const res = await fetch(fetchUrl);
          const data = await res.json();
          if (data.success) {
            targetWords = data.words;
          }
        } else {
          const [tempRes, wordsRes] = await Promise.all([
            fetch("/api/exam/templates"),
            fetch("/api/exam/words"),
          ]);
          const tempData = await tempRes.json();
          const wordsData = await wordsRes.json();

          if (tempData.success && wordsData.success) {
            const template = tempData.templates.find(
              (t: any) =>
                t.templateId.toUpperCase() === params.id.toUpperCase(),
            );

            if (!template) {
              toast({
                variant: "destructive",
                title: "Exam Error",
                description: "This exam template could not be loaded.",
              });
              router.push("/");
              return;
            }

            let filtered = wordsData.words;
            if (template.selectedWords && template.selectedWords.length > 0) {
              filtered = wordsData.words.filter((w: any) =>
                template.selectedWords.includes(w.id),
              );
            } else if (template.chapters && template.chapters.length > 0) {
              const chs = template.chapters.map((c: string) => c.toLowerCase());
              filtered = wordsData.words.filter((w: any) =>
                chs.includes(w.chapter.toLowerCase()),
              );
            }

            const shuffled = [...filtered].sort(() => 0.5 - Math.random());
            targetWords = shuffled.slice(0, template.totalQuestions);
          }
        }

        if (targetWords.length === 0) {
          toast({
            variant: "destructive",
            title: "Exam Empty",
            description:
              "No vocabulary words found for the selected configuration.",
          });
          router.push("/");
          return;
        }

        const formatted: Question[] = targetWords.map((w) => ({
          wordId: w.id,
          japaneseWord: w.japaneseWord,
          correctAnswer: w.banglaMeaning,
          chapter: w.chapter,
        }));

        setQuestions(formatted);
        setAnswers(
          formatted.map((q) => ({ wordId: q.wordId, userAnswer: "" })),
        );
        if (!isPractice) setPracticeSetup(false);
      } catch (err) {
        console.error("Failed setting up exam:", err);
      } finally {
        setLoading(false);
      }
    }

    setupExam();
  }, [loggedIn, params.id]);

  const handleSubmit = async () => {
    const finalResponses: ResponseDetail[] = questions.map((q, i) => {
      const ans = answers[i]?.userAnswer || "";
      const cleanCorrectAnswer = q.correctAnswer
        .replace(/\s*\(.*?\)\s*/g, "")
        .trim();
      const possibleAnswers = cleanCorrectAnswer
        .split(/[/,]+/)
        .map((s) => s.trim().toLowerCase());
      const normalizedUserAnswer = ans.trim().toLowerCase();
      const isCorrectMatch = possibleAnswers.some(
        (correct) => correct === normalizedUserAnswer,
      );
      return {
        wordId: q.wordId,
        userAnswer: ans,
        correctAnswer: q.correctAnswer,
        isCorrect: isCorrectMatch,
      };
    });

    setSubmitting(true);
    const score = finalResponses.filter((r) => r.isCorrect).length;

    try {
      const submitRes = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          email: userEmail,
          templateId: isPractice ? "Practice" : params.id,
          score,
          totalMarks: questions.length,
          responses: finalResponses,
        }),
      });

      const submitData = await submitRes.json();
      if (submitRes.ok && submitData.success) {
        setExamFinished(true);
        // setSubmittedResultId(submitData.resultId);
        toast({
          variant: "success",
          title: "Exam Submitted!",
          description: "Your responses have been logged successfully.",
        });
      } else {
        throw new Error(submitData.error || "Failed submission logging");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: err.message || "Failed saving scores to Google Sheets.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!loggedIn) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Card className="w-full max-w-md p-8">
          <CardContent className="space-y-6 p-0">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-lg shadow-emerald-500/5">
                <LogIn className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black">Candidate Login</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Enter your name and email to access this exam.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Full Name
                </label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="e.g. john@mail.com"
                  className="h-12 text-base"
                />
              </div>
              <Button
                onClick={() => {
                  if (!userName.trim()) {
                    toast({
                      variant: "destructive",
                      title: "Validation Error",
                      description: "Please enter your name.",
                    });
                    return;
                  }
                  if (!userEmail.trim()) {
                    toast({
                      variant: "destructive",
                      title: "Validation Error",
                      description: "Please enter your email.",
                    });
                    return;
                  }
                  setLoggedIn(true);
                }}
                variant="premium"
                className="w-full h-12 text-base font-bold rounded-xl"
              >
                <LogIn className="h-4 w-4" /> Start Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
          <p className="text-sm font-semibold text-neutral-500">
            Loading questions...
          </p>
        </div>
      </div>
    );
  }

  if (examFinished) {
    const resultLink = `${window.location.origin}/result/${submittedResultId}`;

    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Card className="w-full max-w-lg p-8 text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black">Thank You!</h2>
            <p className="text-sm text-neutral-500">
              Your exam has been submitted successfully. The admin will review
              your answers and publish the result.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isPractice && practiceSetup) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Card className="w-full max-w-lg p-8">
          <CardContent className="space-y-6 p-0">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-lg shadow-emerald-500/5">
                <ListChecks className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black">Practice Session</h2>
              <p className="mt-2 text-sm text-neutral-500">
                {questions.length} questions available. Choose how many you want
                to practice.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Number of Questions
              </label>
              <Input
                type="number"
                min={1}
                max={questions.length}
                value={practiceCount}
                onChange={(e) => {
                  if (e.target.value === "") {
                    setPracticeCount("");
                    return;
                  }
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    setPracticeCount(
                      Math.min(Math.max(val, 1), questions.length),
                    );
                  }
                }}
                className="h-14 text-center text-2xl font-bold"
              />
              <p className="text-xs text-neutral-400">
                Max: {questions.length} questions
              </p>
            </div>

            <Button
              onClick={() => {
                const count =
                  typeof practiceCount === "number" ? practiceCount : 1;
                const shuffled = [...questions].sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, count);
                setQuestions(selected);
                setAnswers(
                  selected.map((q) => ({ wordId: q.wordId, userAnswer: "" })),
                );
                setPracticeSetup(false);
              }}
              variant="premium"
              className="w-full h-14 text-lg font-bold rounded-xl"
            >
              <Play className="h-5 w-5" /> Start Practice
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answeredCount = answers.filter((a) => a.userAnswer.trim()).length;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold">
            {isPractice ? (
              <>
                <ListChecks className="h-5 w-5 text-emerald-500" /> Practice
                Sheet
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 text-emerald-500" /> {params.id}
              </>
            )}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">Candidate: {userName}</p>
        </div>
        <div className="text-sm text-neutral-500">
          {answeredCount} / {questions.length} Answered
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <Card key={q.wordId} className="p-5">
            <CardContent className="space-y-3 p-0">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-500">
                    Chapter {q.chapter}
                  </span>
                  <h3 className="mt-3 text-2xl font-black leading-tight">
                    {index + 1}. {q.japaneseWord}
                  </h3>
                </div>
                <span className="ml-4 shrink-0 text-xs font-bold text-neutral-400">
                  #{index + 1}
                </span>
              </div>
              <Input
                value={answers[index]?.userAnswer || ""}
                onChange={(e) => {
                  const updated = [...answers];
                  updated[index] = {
                    ...updated[index],
                    userAnswer: e.target.value,
                  };
                  setAnswers(updated);
                }}
                placeholder="বাংলায় অর্থ লিখুন..."
                className="h-12 rounded-xl border-2 text-base font-semibold"
              />
            </CardContent>
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
              Submitting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-5 w-5" /> Submit All Answers
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
