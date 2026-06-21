import Link from "next/link";
import { GraduationCap, LayoutDashboard } from "lucide-react";
import { Button } from "./button";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/60 bg-white/70 backdrop-blur-xl dark:border-white/[0.06] dark:bg-black/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-transform duration-300 group-hover:scale-105">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
            Nihongo Pro
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/admin">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
