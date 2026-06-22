"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { GraduationCap, ArrowRight, BookOpen, ShieldAlert } from "lucide-react";

interface Template {
  templateId: string;
  allowedUsers: string[];
  totalQuestions: number;
  chapters: string[];
  startTime: string;
  endTime: string;
}

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [isPractice, setIsPractice] = useState(true);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [wordsRes, templatesRes] = await Promise.all([
          fetch("/api/exam/words"),
          fetch("/api/exam/templates"),
        ]);

        const wordsData = await wordsRes.json();
        const templatesData = await templatesRes.json();

        if (wordsData.success) {
          const chapters = Array.from(
            new Set(wordsData.words.map((w: any) => w.chapter).filter(Boolean)),
          ) as string[];
          setAvailableChapters(chapters);
        }

        if (templatesData.success) {
          setAvailableTemplates(templatesData.templates);
        }
      } catch (err) {
        console.error("Error loading home details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleLaunchExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter your name to launch the exam.",
      });
      return;
    }
    if (!userEmail.trim() || !userEmail.includes("@")) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid email address.",
      });
      return;
    }
    setValidating(true);
    if (isPractice) {
      const chaptersParam =
        selectedChapters.length > 0 ? selectedChapters.join(",") : "";
      toast({
        variant: "success",
        title: "Practice Started!",
        description: `Welcome, ${userName}. Launching practice room...`,
      });
      router.push(
        `/exam/practice?name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}&chapters=${encodeURIComponent(chaptersParam)}`,
      );
      setValidating(false);
      return;
    }
    const targetId = templateId.trim().toUpperCase();
    const template = availableTemplates.find(
      (t) => t.templateId.toUpperCase() === targetId,
    );
    if (!template) {
      toast({
        variant: "destructive",
        title: "Template Not Found",
        description: `The exam code "${targetId}" is invalid.`,
      });
      setValidating(false);
      return;
    }
    const isWhitelisted = template.allowedUsers.some(
      (email) => email.toLowerCase() === userEmail.trim().toLowerCase(),
    );
    if (!isWhitelisted) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Your email is not authorized for this exam template.",
      });
      setValidating(false);
      return;
    }
    const now = new Date();
    const start = new Date(template.startTime);
    const end = new Date(template.endTime);
    if (now < start) {
      toast({
        variant: "destructive",
        title: "Exam Not Started",
        description: `This exam starts on ${start.toLocaleString()}.`,
      });
      setValidating(false);
      return;
    }
    if (now > end) {
      toast({
        variant: "destructive",
        title: "Exam Expired",
        description: `This exam expired on ${end.toLocaleString()}.`,
      });
      setValidating(false);
      return;
    }
    toast({
      variant: "success",
      title: "Credentials Approved!",
      description: "Redirecting to the secure examination console...",
    });
    router.push(
      `/exam/${template.templateId}?name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}`,
    );
    setValidating(false);
  };

  const toggleChapterSelection = (chapter: string) => {
    setSelectedChapters((prev) =>
      prev.includes(chapter)
        ? prev.filter((c) => c !== chapter)
        : [...prev, chapter],
    );
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden p-6">
      <div className="absolute -left-40 -top-40 h-96 w-96 animate-pulse-glow rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 animate-pulse-glow rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.03] pointer-events-none" />

      <div className="z-10 w-full max-w-xl animate-fade-in">
        <Card>
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-lg shadow-emerald-500/5">
              <GraduationCap className="h-8 w-8 text-emerald-500" />
            </div>
            <CardTitle className="text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              Japanese Exam Portal
            </CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-sm">
              Enter your student details below to start a practice room or
              access a scheduled examination.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-500" />
                <p className="text-xs font-semibold text-neutral-500">
                  Warming up servers...
                </p>
              </div>
            ) : (
              <form onSubmit={handleLaunchExam} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-450">
                      Student Name
                    </label>
                    <Input
                      placeholder="e.g. Robin Hood"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-450">
                      Verify Email
                    </label>
                    <Input
                      type="email"
                      placeholder="e.g. student@nihongo.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-1 rounded-2xl border border-neutral-200 bg-neutral-50 p-1 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <button
                    type="button"
                    onClick={() => setIsPractice(true)}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all duration-300 ${
                      isPractice
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white"
                    }`}
                  >
                    Vocabulary Practice
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPractice(false)}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all duration-300 ${
                      !isPractice
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white"
                    }`}
                  >
                    Scheduled Exam Set
                  </button>
                </div>

                {isPractice ? (
                  <div className="animate-slide-in space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-450">
                      <BookOpen className="h-3.5 w-3.5 text-neutral-500" />{" "}
                      Filter by Chapter (Optional)
                    </label>
                    {availableChapters.length === 0 ? (
                      <p className="text-xs text-neutral-500">
                        No chapters found. Defaulting to all cards.
                      </p>
                    ) : (
                      <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-2 pt-1">
                        {availableChapters.map((chapter) => {
                          const isSelected = selectedChapters.includes(chapter);
                          return (
                            <button
                              key={chapter}
                              type="button"
                              onClick={() => toggleChapterSelection(chapter)}
                              className={`rounded-full border px-3 py-1.5 text-xs transition-all duration-200 ${
                                isSelected
                                  ? "border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400"
                                  : "border-neutral-300 bg-white text-neutral-500 hover:border-neutral-400 hover:text-neutral-900 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-neutral-500 dark:hover:border-white/[0.15] dark:hover:text-neutral-200"
                              }`}
                            >
                              Chapter {chapter}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="animate-slide-in space-y-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-450">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Exam
                      Template Code
                    </label>
                    <Input
                      placeholder="e.g. T-102"
                      value={templateId}
                      onChange={(e) => setTemplateId(e.target.value)}
                      className="h-12 text-center text-lg font-bold uppercase tracking-widest"
                    />
                    <p className="text-center text-[10px] text-neutral-500">
                      Enter the test code provided by your administrator.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="premium"
                  className="h-12 w-full font-bold"
                  disabled={validating}
                >
                  {validating ? (
                    <span className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Validating Entry Permits...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Let&apos;s Start <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="mt-auto w-full max-w-6xl border-t border-neutral-200 py-4 text-center text-xs text-neutral-400 dark:border-white/[0.04] dark:text-neutral-600">
        &copy; {new Date().getFullYear()} Nihongo Pro.
      </footer>
    </div>
  );
}
