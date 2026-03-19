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
import { ImageUpload } from "@/components/images/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
  const [newCaption, setNewCaption] = useState("");
  const [newSymbolism, setNewSymbolism] = useState("");

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

  const handleUploadComplete = (url: string, imageId?: string) => {
    // Clear form and close dialog
    setDialogOpen(false);
    setNewTitle("");
    setNewCaption("");
    setNewSymbolism("");

    // Navigate to the new image if we got an ID
    if (imageId) {
      router.push(`/images/${imageId}`);
    } else {
      // Refresh the page to show the new image
      router.refresh();
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
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload Image</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <ImageUpload
                    projectId={projectId}
                    onUploadComplete={handleUploadComplete}
                    title={newTitle}
                    caption={newCaption}
                    symbolism={newSymbolism}
                  />

                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter image title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="caption">Caption</Label>
                      <Input
                        id="caption"
                        placeholder="Brief description (optional)"
                        value={newCaption}
                        onChange={(e) => setNewCaption(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="symbolism">Symbolism</Label>
                      <Textarea
                        id="symbolism"
                        placeholder="What does this image symbolize in your story? (optional)"
                        value={newSymbolism}
                        onChange={(e) => setNewSymbolism(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
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
