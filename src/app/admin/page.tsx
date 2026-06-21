"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AdminAuth } from "@/components/ui/admin-auth";
import {
  Sparkles,
  Plus,
  FileText,
  Database,
  Award,
  Search,
  Calendar,
  Users,
  Eye,
  ClipboardList,
  Shield,
  LogIn,
  Lock,
} from "lucide-react";
import Link from "next/link";

interface Word {
  id: string;
  japaneseWord: string;
  banglaMeaning: string;
  imageUrl: string;
  chapter: string;
}

interface Template {
  templateId: string;
  allowedUsers: string[];
  totalQuestions: number;
  chapters: string[];
  startTime: string;
  endTime: string;
}

interface Result {
  resultId: string;
  userName: string;
  templateId: string;
  score: number;
  totalMarks: number;
  timestamp: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();

  const [words, setWords] = useState<Word[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"words" | "templates" | "results">(
    "words",
  );

  const [allowedUsers, setAllowedUsers] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [chapters, setChapters] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wordsRes, templatesRes, resultsRes] = await Promise.all([
        fetch("/api/exam/words"),
        fetch("/api/exam/templates"),
        fetch("/api/admin/results"),
      ]);

      const wordsData = await wordsRes.json();
      const templatesData = await templatesRes.json();
      const resultsData = await resultsRes.json();

      if (wordsData.success) setWords(wordsData.words);
      if (templatesData.success) setTemplates(templatesData.templates);
      if (resultsData.success) setResults(resultsData.results);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not fetch data from Google Sheets database.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !allowedUsers ||
      !totalQuestions ||
      !chapters ||
      !startTime ||
      !endTime
    ) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill out all fields to create an exam template.",
      });
      return;
    }

    setCreatingTemplate(true);
    try {
      const res = await fetch("/api/exam/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedUsers: allowedUsers.split(",").map((s) => s.trim()),
          totalQuestions,
          chapters: chapters.split(",").map((s) => s.trim()),
          startTime,
          endTime,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          variant: "success",
          title: "Template Created!",
          description: `Template ID: ${data.template.templateId} has been added.`,
        });
        setTemplates((prev) => [data.template, ...prev]);

        setAllowedUsers("");
        setTotalQuestions(10);
        setChapters("");
        setStartTime("");
        setEndTime("");
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
      setCreatingTemplate(false);
    }
  };

  const filteredWords = words.filter(
    (w) =>
      w.japaneseWord.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.banglaMeaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.chapter.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredResults = results.filter(
    (r) =>
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.resultId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.templateId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <AdminAuth>
    <div className="min-h-screen bg-transparent p-4 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <ClipboardList className="h-9 w-9 text-emerald-500" /> Admin Control
            Deck
          </h1>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} variant="secondary" disabled={loading}>
            Sync Sheet Data
          </Button>
          <Link href="/admin/upload">
            <Button
              variant="premium"
              className="font-bold flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" /> AI Card Extractor
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase font-semibold tracking-wider">
                Vocabulary Dataset
              </p>
              <h3 className="text-2xl font-black mt-0.5">
                {words.length} Words
              </h3>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase font-semibold tracking-wider">
                Active Templates
              </p>
              <h3 className="text-2xl font-black mt-0.5">
                {templates.length} Templates
              </h3>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase font-semibold tracking-wider">
                Submissions
              </p>
              <h3 className="text-2xl font-black mt-0.5">
                {results.length} Exams
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex border-b border-neutral-200 p-2 gap-2 dark:border-white/[0.06]">
              <button
                onClick={() => {
                  setActiveTab("words");
                  setSearchQuery("");
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === "words"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400"
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-white/[0.03]"
                }`}
              >
                Vocabulary
              </button>
              <button
                onClick={() => {
                  setActiveTab("templates");
                  setSearchQuery("");
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === "templates"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400"
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-white/[0.03]"
                }`}
              >
                Exam Templates
              </button>
              <button
                onClick={() => {
                  setActiveTab("results");
                  setSearchQuery("");
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === "results"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400"
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-white/[0.03]"
                }`}
              >
                Results List
              </button>
            </div>

            <CardContent className="p-6">
              {activeTab !== "templates" && (
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
                  <Input
                    placeholder={
                      activeTab === "words"
                        ? "Search vocabulary, meanings, or chapters..."
                        : "Search user name, result code..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                  <p className="text-sm text-neutral-500 font-semibold">
                    Synchronizing with Google Sheets...
                  </p>
                </div>
              ) : (
                <>
                  {activeTab === "words" && (
                    <div className="space-y-4">
                      {filteredWords.length === 0 ? (
                        <p className="text-center text-neutral-500 py-8 text-sm">
                          No vocabulary words found.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:border-white/[0.06]">
                                <th className="pb-3 pr-4">ID</th>
                                <th className="pb-3 pr-4">Japanese Word</th>
                                <th className="pb-3 pr-4">Bangla Meaning</th>
                                <th className="pb-3 pr-4">Chapter</th>
                                <th className="pb-3">Visual</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 text-sm text-neutral-700 dark:divide-white/[0.03] dark:text-neutral-300">
                              {filteredWords.map((word) => (
                                <tr
                                  key={word.id}
                                  className="hover:bg-neutral-50 transition-colors dark:hover:bg-white/[0.02]"
                                >
                                  <td className="py-3.5 pr-4 font-mono text-emerald-600 dark:text-emerald-400">
                                    {word.id}
                                  </td>
                                  <td className="py-3.5 pr-4 font-bold text-base">
                                    {word.japaneseWord}
                                  </td>
                                  <td className="py-3.5 pr-4 text-neutral-500">
                                    {word.banglaMeaning}
                                  </td>
                                  <td className="py-3.5 pr-4">
                                    <span className="bg-neutral-100 text-neutral-600 text-xs px-2.5 py-1 rounded-full border border-neutral-200 dark:bg-white/[0.03] dark:text-neutral-400 dark:border-white/[0.06]">
                                      {word.chapter}
                                    </span>
                                  </td>
                                  <td className="py-3.5">
                                    {word.imageUrl ? (
                                      <Link
                                        href={word.imageUrl}
                                        target="_blank"
                                      >
                                        <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-neutral-200 group hover:border-emerald-500 transition-colors dark:border-white/[0.06]">
                                          <img
                                            src={word.imageUrl}
                                            alt="thumbnail"
                                            className="object-cover w-full h-full"
                                          />
                                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <Eye className="h-3.5 w-3.5 text-white" />
                                          </div>
                                        </div>
                                      </Link>
                                    ) : (
                                      <span className="text-xs text-neutral-400">
                                        None
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "templates" && (
                    <div className="space-y-4">
                      {templates.length === 0 ? (
                        <p className="text-center text-neutral-500 py-8 text-sm">
                          No exam templates defined.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {templates.map((template) => (
                            <Card
                              key={template.templateId}
                              className="p-5 space-y-3"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-lg font-bold flex items-center gap-1.5">
                                    <FileText className="h-4.5 w-4.5 text-emerald-500" />{" "}
                                    {template.templateId}
                                  </h4>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full dark:text-emerald-400">
                                    {template.totalQuestions} Questions
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-neutral-500 space-y-1.5 border-t border-neutral-100 pt-3 dark:border-white/[0.04]">
                                <div className="flex items-center gap-2">
                                  <Users className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                                  <span className="truncate">
                                    Whitelisted:{" "}
                                    {template.allowedUsers.join(", ")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Database className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                                  <span>
                                    Chapters: {template.chapters.join(", ")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                                  <span className="truncate">
                                    Until:{" "}
                                    {new Date(
                                      template.endTime,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="pt-2 flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/exam/${template.templateId}`,
                                    );
                                    toast({
                                      variant: "success",
                                      title: "Link Copied!",
                                      description:
                                        "Exam link copied to clipboard.",
                                    });
                                  }}
                                  className="text-xs rounded-lg h-9"
                                >
                                  Copy Link
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "results" && (
                    <div className="space-y-4">
                      {filteredResults.length === 0 ? (
                        <p className="text-center text-neutral-500 py-8 text-sm">
                          No exam submissions found.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:border-white/[0.06]">
                                <th className="pb-3 pr-4">Result ID</th>
                                <th className="pb-3 pr-4">Student Name</th>
                                <th className="pb-3 pr-4">Template ID</th>
                                <th className="pb-3 pr-4 text-center">Score</th>
                                <th className="pb-3 pr-4">Date</th>
                                <th className="pb-3">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 text-sm text-neutral-700 dark:divide-white/[0.03] dark:text-neutral-300">
                              {filteredResults.map((result) => {
                                const scorePercentage =
                                  (result.score / result.totalMarks) * 100;
                                let scoreColor = "text-red-500";
                                if (scorePercentage >= 80)
                                  scoreColor = "text-emerald-500";
                                else if (scorePercentage >= 50)
                                  scoreColor = "text-emerald-500";

                                return (
                                  <tr
                                    key={result.resultId}
                                    className="hover:bg-neutral-50 transition-colors dark:hover:bg-white/[0.02]"
                                  >
                                    <td className="py-3.5 pr-4 font-mono font-bold">
                                      {result.resultId}
                                    </td>
                                    <td className="py-3.5 pr-4 font-semibold">
                                      {result.userName}
                                    </td>
                                    <td className="py-3.5 pr-4 font-mono text-neutral-500">
                                      {result.templateId}
                                    </td>
                                    <td
                                      className={`py-3.5 pr-4 text-center font-black ${scoreColor}`}
                                    >
                                      {result.score} / {result.totalMarks} (
                                      {Math.round(scorePercentage)}%)
                                    </td>
                                    <td className="py-3.5 pr-4 text-xs text-neutral-500">
                                      {new Date(
                                        result.timestamp,
                                      ).toLocaleDateString()}{" "}
                                      {new Date(
                                        result.timestamp,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </td>
                                    <td className="py-3.5">
                                      <Link href={`/result/${result.resultId}`}>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 rounded-lg text-xs font-bold gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-white"
                                        >
                                          <Eye className="h-3 w-3" /> View
                                          Detail
                                        </Button>
                                      </Link>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="p-6 shadow-xl border-emerald-500/10">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
              <Plus className="h-5 w-5 text-emerald-500" /> New Exam Template
            </h3>
            <p className="text-xs text-neutral-500 mb-6">
              Define test sets, allocate allowed users, configure timing
              restrictions and sync to Sheets database.
            </p>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    Question Count
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={totalQuestions}
                    onChange={(e) =>
                      setTotalQuestions(parseInt(e.target.value) || 10)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    Target Chapters
                  </label>
                  <Input
                    placeholder="Chapter 1, Verbs"
                    value={chapters}
                    onChange={(e) => setChapters(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-[10px] text-neutral-400 -mt-1.5">
                Target chapters to extract vocabulary questions from.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  Exam Start Date/Time
                </label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="text-neutral-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  Exam End Date/Time
                </label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="text-neutral-500"
                />
              </div>

              <Button
                type="submit"
                variant="premium"
                className="w-full font-bold mt-4"
                disabled={creatingTemplate || loading}
              >
                {creatingTemplate
                  ? "Writing Template to Sheets..."
                  : "Publish Template"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
