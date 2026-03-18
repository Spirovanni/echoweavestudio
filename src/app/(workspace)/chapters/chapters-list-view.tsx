"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Chapter, ChapterStatus } from "@/lib/types";
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
import { Plus, ArrowUpDown } from "lucide-react";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "idea", label: "Idea" },
  { value: "outline", label: "Outline" },
  { value: "draft", label: "Draft" },
  { value: "revision", label: "Revision" },
  { value: "complete", label: "Complete" },
  { value: "published", label: "Published" },
];

type SortField = "order_index" | "title" | "created_at" | "updated_at";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "order_index", label: "Order" },
  { value: "title", label: "Title" },
  { value: "created_at", label: "Date created" },
  { value: "updated_at", label: "Last updated" },
];

interface ChaptersListViewProps {
  chapters: Chapter[];
  projectId: string | null;
}

export function ChaptersListView({ chapters, projectId }: ChaptersListViewProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("order_index");
  const [sortAsc, setSortAsc] = useState(true);

  // Create chapter dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [creating, setCreating] = useState(false);

  const filteredAndSorted = useMemo(() => {
    let result = [...chapters];

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "title") {
        cmp = a.title.localeCompare(b.title);
      } else if (sortField === "created_at") {
        cmp = a.created_at.localeCompare(b.created_at);
      } else if (sortField === "updated_at") {
        cmp = a.updated_at.localeCompare(b.updated_at);
      } else {
        cmp = a.order_index - b.order_index;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [chapters, statusFilter, sortField, sortAsc]);

  const handleCreateChapter = async () => {
    if (!newTitle.trim() || !projectId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          title: newTitle.trim(),
          summary: newSummary.trim() || undefined,
          order_index: chapters.length,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setDialogOpen(false);
        setNewTitle("");
        setNewSummary("");
        router.push(`/chapters/${data.id}/edit`);
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div>
      {/* Filters and actions */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortField} onValueChange={(v) => v && setSortField(v as SortField)}>
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
                New Chapter
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Chapter</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Chapter title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTitle.trim()) {
                        handleCreateChapter();
                      }
                    }}
                  />
                  <Input
                    placeholder="Summary (optional)"
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateChapter}
                    disabled={!newTitle.trim() || creating}
                  >
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-xs text-muted-foreground">
              Create a project to add chapters
            </p>
          )}
        </div>
      </div>

      {/* Chapter list */}
      {filteredAndSorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {chapters.length === 0
            ? "No chapters yet. Click 'New Chapter' to create one."
            : "No chapters match the current filter."}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredAndSorted.map((chapter) => (
            <Link
              key={chapter.id}
              href={`/chapters/${chapter.id}`}
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {chapter.order_index + 1}.
                  </span>
                  <h2 className="font-medium truncate">{chapter.title}</h2>
                </div>
                {chapter.summary && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                    {chapter.summary}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {new Date(chapter.updated_at).toLocaleDateString()}
                </span>
                <Badge variant="outline">{chapter.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
