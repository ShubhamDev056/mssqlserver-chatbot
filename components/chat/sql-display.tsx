"use client";

import { Check, ClipboardCopy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatSql } from "@/lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface SqlDisplayProps {
  sql: string;
  className?: string;
}

export function SqlDisplay({ sql, className }: SqlDisplayProps) {
  const [copied, setCopied] = useState(false);
  const formattedSql = formatSql(sql);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative overflow-hidden rounded-md", className)}>
      <div className="flex items-center justify-between bg-secondary px-4 py-2">
        <div className="text-sm font-medium">Generated SQL Query</div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <ClipboardCopy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      <div className="max-h-96 overflow-auto p-0">
        <SyntaxHighlighter
          language="sql"
          style={atomDark}
          customStyle={{
            margin: 0,
            padding: "1rem",
            borderRadius: 0,
            fontSize: "0.875rem",
          }}
        >
          {formattedSql}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}