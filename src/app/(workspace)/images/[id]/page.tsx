import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil, ImageIcon } from "lucide-react";
import type { Image } from "@/lib/types";

export default async function ImageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const supabase = await createClient();

  const { data: image } = await supabase
    .from("ews_images")
    .select("*")
    .eq("id", id)
    .single<Image>();

  if (!image) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Image not found</p>
        <Link href="/images">
          <Button variant="outline">Back to Images</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/images">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">
            {image.title}
          </h1>
          {image.caption && (
            <p className="mt-1 text-sm text-muted-foreground">
              {image.caption}
            </p>
          )}
        </div>
        <Link href={`/images/${id}/edit`}>
          <Button size="sm">
            <Pencil />
            Edit
          </Button>
        </Link>
      </div>

      {/* Metadata */}
      <div className="mb-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>Created {new Date(image.created_at).toLocaleDateString()}</span>
        <span>Updated {new Date(image.updated_at).toLocaleDateString()}</span>
      </div>

      <Separator className="mb-6" />

      {/* Image display */}
      <div className="mx-auto max-w-4xl">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
          <img
            src={image.image_url}
            alt={image.title}
            className="size-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
          {/* Fallback icon */}
          <div className="hidden absolute inset-0 flex items-center justify-center">
            <ImageIcon className="size-16 text-muted-foreground" />
          </div>
        </div>

        {/* Symbolism */}
        {image.symbolism && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Symbolism & Meaning
            </h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {image.symbolism}
            </p>
          </div>
        )}

        {!image.symbolism && (
          <p className="mt-6 text-sm text-muted-foreground">
            No symbolism notes yet.{" "}
            <Link
              href={`/images/${id}/edit`}
              className="text-primary underline underline-offset-4"
            >
              Add notes
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
