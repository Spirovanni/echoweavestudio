"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Pencil, X, Check, Palette, BookOpen, Trash2 } from "lucide-react";

interface LinkedChapter {
  id: string;
  title: string;
  status: string;
  orderIndex: number;
  linkedAt: string;
}

interface Theme {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ThemeDetailViewProps {
  theme: Theme;
  chapters: LinkedChapter[];
}

export function ThemeDetailView({ theme, chapters }: ThemeDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(theme.name);
  const [description, setDescription] = useState(theme.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/themes/${theme.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success("Theme updated");
        setEditing(false);
        router.refresh();
      } else {
        toast.error("Failed to update theme");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this theme? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/themes/${theme.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Theme deleted");
        router.push("/themes");
      } else {
        toast.error("Failed to delete theme");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setName(theme.name);
    setDescription(theme.description ?? "");
    setEditing(false);
  };

  const sortedChapters = [...chapters].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/themes">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft />
          </Button>
        </Link>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Palette className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg font-bold"
              autoFocus
            />
          ) : (
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {theme.name}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCancel}
              >
                <X />
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!name.trim() || saving}
              >
                <Check />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditing(true)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="mb-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          Created {new Date(theme.created_at).toLocaleDateString()}
        </span>
        <span>
          Updated {new Date(theme.updated_at).toLocaleDateString()}
        </span>
      </div>

      <Separator className="mb-6" />

      {/* Description */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </h2>
        {editing ? (
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this theme and how it manifests in the story..."
            rows={5}
            className="resize-none"
          />
        ) : theme.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {theme.description}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            No description yet. Click the edit button to add one.
          </p>
        )}
      </section>

      <Separator className="mb-6" />

      {/* Linked Chapters */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Linked Chapters
        </h2>
        {sortedChapters.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            No chapters linked to this theme yet. Link chapters from the
            chapter detail page.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedChapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/chapters/${chapter.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {chapter.title}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {chapter.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
