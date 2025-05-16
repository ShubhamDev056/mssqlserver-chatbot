import { Database, Github, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function NavHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              SQL Whisperer
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            className="flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <MessagesSquare className="mr-2 h-4 w-4" />
            <span>Chat</span>
          </Link>
          <Link
            href="https://github.com/yourusername/sql-whisperer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Github className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline-block">GitHub</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}