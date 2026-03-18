"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Song } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ArrowUpDown, Music } from "lucide-react";

type SortField = "title" | "created_at" | "updated_at";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "created_at", label: "Date created" },
  { value: "updated_at", label: "Last updated" },
];

interface SongsListViewProps {
  songs: Song[];
  projectId: string | null;
}

export function SongsListView({ songs, projectId }: SongsListViewProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");

  // Create song dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMood, setNewMood] = useState("");
  const [creating, setCreating] = useState(false);

  const filteredAndSorted = useMemo(() => {
    let result = [...songs];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.mood?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "title") {
        cmp = a.title.localeCompare(b.title);
      } else if (sortField === "created_at") {
        cmp = a.created_at.localeCompare(b.created_at);
      } else {
        cmp = a.updated_at.localeCompare(b.updated_at);
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [songs, search, sortField, sortAsc]);

  const handleCreateSong = async () => {
    if (!newTitle.trim() || !projectId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          title: newTitle.trim(),
          mood: newMood.trim() || undefined,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setDialogOpen(false);
        setNewTitle("");
        setNewMood("");
        router.push(`/songs/${data.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Filters and actions */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />

        <Select
          value={sortField}
          onValueChange={(v) => v && setSortField(v as SortField)}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSortAsc(!sortAsc)}
        >
          <ArrowUpDown className={sortAsc ? "" : "rotate-180"} />
        </Button>

        <div className="ml-auto">
          {projectId ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                <Plus />
                New Song
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Song</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Song title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTitle.trim()) {
                        handleCreateSong();
                      }
                    }}
                  />
                  <Input
                    placeholder="Mood (optional, e.g. melancholy, triumphant)"
                    value={newMood}
                    onChange={(e) => setNewMood(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateSong}
                    disabled={!newTitle.trim() || creating}
                  >
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-xs text-muted-foreground">
              Create a project to add songs
            </p>
          )}
        </div>
      </div>

      {/* Song list */}
      {filteredAndSorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {songs.length === 0
            ? "No songs yet. Click 'New Song' to create one."
            : "No songs match the current search."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSorted.map((song) => (
            <Link
              key={song.id}
              href={`/songs/${song.id}`}
              className="group flex flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Music className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium truncate group-hover:text-primary transition-colors">
                    {song.title}
                  </h2>
                  {song.mood && (
                    <Badge variant="outline" className="mt-1">
                      {song.mood}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {new Date(song.created_at).toLocaleDateString()}
                </span>
                {song.lyrics && (
                  <span className="truncate max-w-[140px]">
                    {song.lyrics.slice(0, 40)}...
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
