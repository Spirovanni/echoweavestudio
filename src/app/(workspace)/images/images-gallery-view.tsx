"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Image } from "@/lib/types";
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
import { Plus, ArrowUpDown, ImageIcon } from "lucide-react";

type SortField = "title" | "created_at" | "updated_at";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "created_at", label: "Date created" },
  { value: "updated_at", label: "Last updated" },
];

interface ImagesGalleryViewProps {
  images: Image[];
  projectId: string | null;
}

export function ImagesGalleryView({ images, projectId }: ImagesGalleryViewProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");

  // Create image dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [creating, setCreating] = useState(false);

  const filteredAndSorted = useMemo(() => {
    let result = [...images];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (img) =>
          img.title.toLowerCase().includes(q) ||
          img.caption?.toLowerCase().includes(q)
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
  }, [images, search, sortField, sortAsc]);

  const handleCreateImage = async () => {
    if (!newTitle.trim() || !newImageUrl.trim() || !projectId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          title: newTitle.trim(),
          image_url: newImageUrl.trim(),
          caption: newCaption.trim() || undefined,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        setDialogOpen(false);
        setNewTitle("");
        setNewImageUrl("");
        setNewCaption("");
        router.push(`/images/${data.id}`);
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
          placeholder="Search images..."
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
                New Image
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Image</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Image title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <Input
                    placeholder="Image URL"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                  <Input
                    placeholder="Caption (optional)"
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateImage}
                    disabled={!newTitle.trim() || !newImageUrl.trim() || creating}
                  >
                    {creating ? "Adding..." : "Add Image"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-xs text-muted-foreground">
              Create a project to add images
            </p>
          )}
        </div>
      </div>

      {/* Image grid */}
      {filteredAndSorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {images.length === 0
            ? "No images yet. Click 'New Image' to add one."
            : "No images match the current search."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSorted.map((image) => (
            <Link
              key={image.id}
              href={`/images/${image.id}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border transition-all hover:shadow-lg hover:scale-[1.02]"
            >
              {/* Image */}
              <img
                src={image.image_url}
                alt={image.title}
                className="size-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <h3 className="font-medium text-sm truncate">{image.title}</h3>
                {image.caption && (
                  <p className="text-xs text-white/80 truncate mt-0.5">
                    {image.caption}
                  </p>
                )}
                <p className="text-xs text-white/60 mt-1">
                  {new Date(image.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Fallback icon if image fails */}
              <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground opacity-0 group-hover:opacity-0">
                <ImageIcon className="size-12" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
