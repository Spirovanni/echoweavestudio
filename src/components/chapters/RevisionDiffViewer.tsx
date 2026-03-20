"use client";

import { useMemo, useState } from "react";
import { diffLines } from "diff";
import { extractTextFromTiptap } from "@/lib/utils/tiptap-text";
import { Button } from "@/components/ui/button";
import { Undo2, Columns, AlignLeft } from "lucide-react";

interface RevisionDiffViewerProps {
  oldContent: Record<string, unknown> | null;
  newContent: Record<string, unknown> | null;
  oldTitle?: string;
  newTitle?: string;
  onRestore?: () => void;
}

export function RevisionDiffViewer({
  oldContent,
  newContent,
  oldTitle = "Previous",
  newTitle = "Current",
  onRestore,
}: RevisionDiffViewerProps) {
  const [viewMode, setViewMode] = useState<"inline" | "split">("inline");

  const diff = useMemo(() => {
    const oldText = extractTextFromTiptap(oldContent);
    const newText = extractTextFromTiptap(newContent);
    return diffLines(oldText, newText);
  }, [oldContent, newContent]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const part of diff) {
      const lineCount = part.value.split("\n").filter(Boolean).length;
      if (part.added) added += lineCount;
      if (part.removed) removed += lineCount;
    }
    return { added, removed };
  }, [diff]);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between sticky top-0 bg-background/95 pb-2 pt-1 border-b z-10">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="font-medium bg-muted px-2 py-1 rounded">
            {oldTitle} &rarr; {newTitle}
          </div>
          <span className="text-green-600 dark:text-green-400 font-medium">
            +{stats.added} added
          </span>
          <span className="text-red-600 dark:text-red-400 font-medium">
            -{stats.removed} removed
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md mr-4 overflow-hidden">
            <Button
              variant={viewMode === "inline" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 rounded-none px-3"
              onClick={() => setViewMode("inline")}
              title="Inline View"
            >
              <AlignLeft className="size-4 mr-2" />
              Inline
            </Button>
            <Button
              variant={viewMode === "split" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 rounded-none border-l px-3"
              onClick={() => setViewMode("split")}
              title="Side-by-side View"
            >
              <Columns className="size-4 mr-2" />
              Split
            </Button>
          </div>

          {onRestore && (
            <Button size="sm" onClick={onRestore} title="Restore this revision">
              <Undo2 className="size-4 mr-2" />
              Restore
            </Button>
          )}
        </div>
      </div>

      {/* Diff Output */}
      <div className="rounded-lg border border-border overflow-hidden font-mono text-sm leading-relaxed tracking-tight">
        {viewMode === "inline" ? (
          // --- INLINE VIEW ---
          <div>
            {diff.map((part, index) => {
              let bgClass = "";
              let prefix = " ";

              if (part.added) {
                bgClass = "bg-green-500/10 text-green-800 dark:text-green-300";
                prefix = "+";
              } else if (part.removed) {
                bgClass = "bg-red-500/10 text-red-800 dark:text-red-300";
                prefix = "-";
              }

              const lines = part.value.split("\n");
              if (lines[lines.length - 1] === "") lines.pop();

              return (
                <div key={index} className={bgClass}>
                  {lines.map((line, lineIdx) => (
                    <div
                      key={lineIdx}
                      className="px-3 py-1 whitespace-pre-wrap break-words"
                    >
                      <span className="inline-block w-4 shrink-0 select-none text-muted-foreground mr-2">
                        {prefix}
                      </span>
                      {line || " "}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          // --- SPLIT VIEW ---
          <div className="flex flex-col">
            <div className="grid grid-cols-2 divide-x divide-border border-b bg-muted/50 font-semibold text-xs py-1.5 px-3 uppercase tracking-wider text-muted-foreground">
              <div>{oldTitle}</div>
              <div className="pl-3">{newTitle}</div>
            </div>
            
            {diff.map((part, index) => {
              const lines = part.value.split("\n");
              if (lines[lines.length - 1] === "") lines.pop();

              if (part.added) {
                return lines.map((line, lineIdx) => (
                  <div key={`${index}-${lineIdx}`} className="grid grid-cols-2 divide-x divide-border">
                    <div className="bg-muted/10 w-full" />
                    <div className="bg-green-500/10 text-green-800 dark:text-green-300 px-3 py-1 whitespace-pre-wrap break-words">
                      <span className="inline-block w-4 shrink-0 select-none text-muted-foreground/50 mr-2">+</span>
                      {line || " "}
                    </div>
                  </div>
                ));
              } else if (part.removed) {
                return lines.map((line, lineIdx) => (
                  <div key={`${index}-${lineIdx}`} className="grid grid-cols-2 divide-x divide-border">
                    <div className="bg-red-500/10 text-red-800 dark:text-red-300 px-3 py-1 whitespace-pre-wrap break-words">
                      <span className="inline-block w-4 shrink-0 select-none text-muted-foreground/50 mr-2">-</span>
                      {line || " "}
                    </div>
                    <div className="bg-muted/10 w-full" />
                  </div>
                ));
              }

              return lines.map((line, lineIdx) => (
                <div key={`${index}-${lineIdx}`} className="grid grid-cols-2 divide-x divide-border">
                  <div className="px-3 py-1 whitespace-pre-wrap break-words text-muted-foreground/80">
                    <span className="inline-block w-4 shrink-0 select-none text-muted-foreground/30 mr-2"> </span>
                    {line || " "}
                  </div>
                  <div className="px-3 py-1 whitespace-pre-wrap break-words text-muted-foreground/80">
                    <span className="inline-block w-4 shrink-0 select-none text-muted-foreground/30 mr-2"> </span>
                    {line || " "}
                  </div>
                </div>
              ));
            })}
          </div>
        )}
      </div>
    </div>
  );
}
