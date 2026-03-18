"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { JSONContent } from "@tiptap/react";
import type { Chapter, ChapterStatus } from "@/lib/types";
import ChapterEditor from "@/components/editor/ChapterEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Check, AlertCircle } from "lucide-react";

const CHAPTER_STATUSES: { value: ChapterStatus; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "outline", label: "Outline" },
  { value: "draft", label: "Draft" },
  { value: "revision", label: "Revision" },
  { value: "complete", label: "Complete" },
  { value: "published", label: "Published" },
];

const AUTOSAVE_DELAY = 2000;

type SaveState = "idle" | "saving" | "saved" | "error";

export function ChapterEditView({ chapterId }: { chapterId: string }) {
  const router = useRouter();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<ChapterStatus>("idea");
  const [content, setContent] = useState<JSONContent | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  // Fetch chapter data
  useEffect(() => {
    async function fetchChapter() {
      try {
        const res = await fetch(`/api/chapters/${chapterId}`);
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to load chapter");
        }
        const { data } = await res.json();
        setChapter(data);
        setTitle(data.title);
        setStatus(data.status);
        setContent(data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chapter");
      } finally {
        setLoading(false);
      }
    }
    fetchChapter();
  }, [chapterId]);

  // Auto-save function
  const save = useCallback(
    async (updates: Partial<Pick<Chapter, "title" | "status" | "content">>) => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/chapters/${chapterId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          throw new Error("Save failed");
        }
        setSaveState("saved");
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveState("idle"), 2000);
      } catch {
        setSaveState("error");
      }
    },
    [chapterId]
  );

  // Debounced auto-save
  const scheduleSave = useCallback(
    (updates: Partial<Pick<Chapter, "title" | "status" | "content">>) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      setHasUnsavedChanges(true);
      setSaveState("idle");
      saveTimerRef.current = setTimeout(() => {
        save(updates);
      }, AUTOSAVE_DELAY);
    },
    [save]
  );

  // Handle title change
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!initialLoadRef.current) {
      scheduleSave({ title: newTitle, status, content });
    }
  };

  // Handle status change
  const handleStatusChange = (newStatus: ChapterStatus) => {
    setStatus(newStatus);
    // Save status immediately (no debounce)
    save({ title, status: newStatus, content });
  };

  // Handle content change
  const handleContentChange = (newContent: JSONContent) => {
    setContent(newContent);
    if (!initialLoadRef.current) {
      scheduleSave({ title, status, content: newContent });
    }
  };

  // Mark initial load complete after first render with data
  useEffect(() => {
    if (chapter && initialLoadRef.current) {
      // Small delay to allow editor to initialize with content
      const timer = setTimeout(() => {
        initialLoadRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [chapter]);

  // Warn on unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error || "Chapter not found"}</p>
        <Button variant="outline" onClick={() => router.push("/chapters")}>
          Back to Chapters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-3">
        <Link href={`/chapters/${chapterId}`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft />
          </Button>
        </Link>

        <div className="flex flex-1 items-center gap-3">
          <Select value={status} onValueChange={(val) => handleStatusChange(val as ChapterStatus)}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHAPTER_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Save indicator */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveState === "saving" && (
              <>
                <Loader2 className="size-3 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveState === "saved" && (
              <>
                <Check className="size-3 text-green-600" />
                <span>Saved</span>
              </>
            )}
            {saveState === "error" && (
              <>
                <AlertCircle className="size-3 text-destructive" />
                <span>Save failed</span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => save({ title, status, content })}
                >
                  Retry
                </Button>
              </>
            )}
            {saveState === "idle" && hasUnsavedChanges && (
              <Badge variant="outline">Unsaved changes</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-6">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Chapter title..."
            className="mb-6 w-full border-none bg-transparent text-3xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
          />

          {/* Rich text editor */}
          <ChapterEditor
            content={content as JSONContent | undefined}
            onUpdate={handleContentChange}
            placeholder="Start writing your chapter..."
          />
        </div>
      </div>
    </div>
  );
}
