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
import { AdminAuth } from "@/components/ui/admin-auth";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Plus,
  FileText,
  BookOpen,
  CheckSquare,
  Square,
} from "lucide-react";
import Link from "next/link";

interface Word {
  id: string;
  japaneseWord: string;
  banglaMeaning: string;
  imageUrl: string;
  chapter: string;
}

export default function NewExamTemplate() {
  const router = useRouter();
  const { toast } = useToast();

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [allowedUsers, setAllowedUsers] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchWords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exam/words");
      const data = await res.json();
      if (data.success) {
        setWords(data.words);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch vocabulary data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chapters = Array.from(
    new Set(words.map((w) => w.chapter).filter(Boolean)),
  ).sort();

  const toggleChapter = (chapter: string) => {
    setSelectedChapters((prev) =>
      prev.includes(chapter)
        ? prev.filter((c) => c !== chapter)
        : [...prev, chapter],
    );
  };

  const toggleWord = (wordId: string) => {
    setSelectedWordIds((prev) =>
      prev.includes(wordId)
        ? prev.filter((id) => id !== wordId)
        : [...prev, wordId],
    );
  };

  const filteredWords = words.filter((w) => {
    const matchesChapter =
      selectedChapters.length === 0 || selectedChapters.includes(w.chapter);
    const matchesSearch =
      !searchQuery ||
      w.japaneseWord.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.banglaMeaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.chapter.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChapter && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowedUsers || !totalQuestions || !startTime || !endTime) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill out all required fields.",
      });
      return;
    }
    if (selectedChapters.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select at least one chapter.",
      });
      return;
    }
    if (selectedWordIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select at least one word.",
      });
      return;
    }
    if (totalQuestions > selectedWordIds.length) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: `Question count (${totalQuestions}) cannot exceed selected words (${selectedWordIds.length}).`,
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/exam/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedUsers: allowedUsers.split(",").map((s) => s.trim()),
          totalQuestions,
          chapters: selectedChapters,
          startTime,
          endTime,
          selectedWords: selectedWordIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          variant: "success",
          title: "Template Created!",
          description: `Template ID: ${data.template.templateId}`,
        });
        router.push("/admin");
      } else {
        throw new Error(data.error || "Failed to create template");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: err.message || "An error occurred.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectAllFiltered = () => {
    const ids = filteredWords.map((w) => w.id);
    const allSelected = ids.every((id) => selectedWordIds.includes(id));
    if (allSelected) {
      setSelectedWordIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedWordIds((prev) =>
        [...prev, ...ids].filter((v, i, a) => a.indexOf(v) === i),
      );
    }
  };

  const allFilteredSelected =
    filteredWords.length > 0 &&
    filteredWords.every((w) => selectedWordIds.includes(w.id));

  return (
    <AdminAuth>
      <div className="min-h-screen bg-transparent p-4 md:p-10 max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors gap-2 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Plus className="h-9 w-9 text-emerald-500" /> New Exam Template
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Select chapters and specific words to create a custom exam template.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            <p className="text-sm text-neutral-500 font-semibold">
              Loading vocabulary data...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BookOpen className="h-5 w-5 text-emerald-500" /> Select
                      Chapters
                    </CardTitle>
                    <CardDescription>
                      Choose which chapters to include in this exam.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {chapters.length === 0 ? (
                      <p className="text-sm text-neutral-500">
                        No chapters found.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {chapters.map((chapter) => {
                          const isSelected = selectedChapters.includes(chapter);
                          const wordCount = words.filter(
                            (w) => w.chapter === chapter,
                          ).length;
                          return (
                            <button
                              key={chapter}
                              type="button"
                              onClick={() => toggleChapter(chapter)}
                              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                isSelected
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-neutral-400 dark:hover:border-white/[0.15]"
                              }`}
                            >
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Square className="h-4 w-4 text-neutral-400" />
                              )}
                              <span>Chapters - {chapter}</span>
                              <span
                                className={`text-xs ml-1 ${isSelected ? "text-emerald-500" : "text-neutral-400"}`}
                              >
                                ({wordCount})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="h-5 w-5 text-emerald-500" /> Select
                      Words
                    </CardTitle>
                    <CardDescription>
                      {selectedChapters.length === 0
                        ? "Select chapters above to see available words."
                        : `Showing words from selected chapters. Choose specific words for the exam.`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedChapters.length === 0 ? (
                      <p className="text-sm text-neutral-500 py-4">
                        Please select at least one chapter first.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="relative">
                            <Input
                              placeholder="Search words..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-3 pr-4 w-64"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-neutral-500 font-semibold">
                              {
                                selectedWordIds.filter((id) =>
                                  filteredWords.some((w) => w.id === id),
                                ).length
                              }{" "}
                              / {filteredWords.length} selected
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={selectAllFiltered}
                              className="text-xs"
                            >
                              {allFilteredSelected
                                ? "Deselect All"
                                : "Select All"}
                            </Button>
                          </div>
                        </div>

                        {filteredWords.length === 0 ? (
                          <p className="text-sm text-neutral-500 py-4 text-center">
                            No words found matching your criteria.
                          </p>
                        ) : (
                          <div className="max-h-96 overflow-y-auto space-y-1 pr-1">
                            {filteredWords.map((word) => {
                              const isWordSelected = selectedWordIds.includes(
                                word.id,
                              );
                              return (
                                <button
                                  key={word.id}
                                  type="button"
                                  onClick={() => toggleWord(word.id)}
                                  className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                                    isWordSelected
                                      ? "border-emerald-500/30 bg-emerald-500/5"
                                      : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.15]"
                                  }`}
                                >
                                  {isWordSelected ? (
                                    <CheckSquare className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                  ) : (
                                    <Square className="h-5 w-5 text-neutral-400 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <span className="font-bold text-base">
                                      {word.japaneseWord}
                                    </span>
                                    <span className="text-neutral-500 text-sm ml-2">
                                      - {word.banglaMeaning}
                                    </span>
                                  </div>
                                  <span className="text-xs text-neutral-400 flex-shrink-0 bg-neutral-100 dark:bg-white/[0.04] px-2 py-1 rounded-full">
                                    {word.chapter}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="">
                <Card className="p-6 shadow-xl border-emerald-500/10">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-emerald-500" /> Template
                    Config
                  </h3>
                  <p className="text-xs text-neutral-500 mb-6">
                    Configure exam settings and publish.
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Allowed Students Email(s)
                      </label>
                      <Input
                        placeholder="student1@mail.com, student2@mail.com"
                        value={allowedUsers}
                        onChange={(e) => setAllowedUsers(e.target.value)}
                      />
                      <p className="text-[10px] text-neutral-400">
                        Comma-separated email addresses.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Question Count
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={selectedWordIds.length || 100}
                        value={totalQuestions || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setTotalQuestions(0);
                            return;
                          }
                          const num = parseInt(val, 10);
                          if (!isNaN(num)) {
                            setTotalQuestions(num);
                          }
                        }}
                      />
                      <p className="text-[10px] text-neutral-400">
                        Max: {selectedWordIds.length || 0} words selected
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Exam Start Date/Time
                      </label>
                      <Input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Exam End Date/Time
                      </label>
                      <Input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>

                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Chapters</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedChapters.length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Words Selected</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedWordIds.length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Questions</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {totalQuestions}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="premium"
                      className="w-full font-bold"
                      disabled={
                        submitting ||
                        loading ||
                        selectedChapters.length === 0 ||
                        selectedWordIds.length === 0
                      }
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Publishing...
                        </span>
                      ) : (
                        "Publish Template"
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </form>
        )}
      </div>
    </AdminAuth>
  );
}
