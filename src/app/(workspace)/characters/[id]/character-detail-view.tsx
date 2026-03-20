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
import { ArrowLeft, Pencil, X, Check, Users, BookOpen, Trash2 } from "lucide-react";

interface LinkedChapter {
  id: string;
  title: string;
  status: string;
  orderIndex: number;
  linkedAt: string;
}

interface Character {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  symbolism: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CharacterDetailViewProps {
  character: Character;
  chapters: LinkedChapter[];
}

export function CharacterDetailView({
  character,
  chapters,
}: CharacterDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(character.name);
  const [description, setDescription] = useState(character.description ?? "");
  const [symbolism, setSymbolism] = useState(character.symbolism ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          symbolism: symbolism.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success("Character updated");
        setEditing(false);
        router.refresh();
      } else {
        toast.error("Failed to update character");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this character? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Character deleted");
        router.push("/characters");
      } else {
        toast.error("Failed to delete character");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setName(character.name);
    setDescription(character.description ?? "");
    setSymbolism(character.symbolism ?? "");
    setEditing(false);
  };

  const sortedChapters = [...chapters].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/characters">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft />
          </Button>
        </Link>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Users className="size-5" />
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
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight">
                {character.name}
              </h1>
              {character.symbolism && (
                <Badge variant="outline">{character.symbolism}</Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="icon-sm" onClick={handleCancel}>
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
          Created {new Date(character.created_at).toLocaleDateString()}
        </span>
        <span>
          Updated {new Date(character.updated_at).toLocaleDateString()}
        </span>
      </div>

      <Separator className="mb-6" />

      {/* Symbolism */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Symbolism
        </h2>
        {editing ? (
          <Input
            value={symbolism}
            onChange={(e) => setSymbolism(e.target.value)}
            placeholder="e.g. hope, rebellion, transformation"
          />
        ) : character.symbolism ? (
          <p className="text-sm">{character.symbolism}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            No symbolism defined yet. Click the edit button to add one.
          </p>
        )}
      </section>

      {/* Description */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </h2>
        {editing ? (
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this character's role, personality, and story arc..."
            rows={6}
            className="resize-none"
          />
        ) : character.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {character.description}
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
            No chapters linked to this character yet. Link chapters from the
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
