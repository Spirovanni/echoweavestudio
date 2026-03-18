import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ContentRenderer } from "@/components/editor/ContentRenderer";
import { Pencil, ArrowLeft } from "lucide-react";
import type { Chapter } from "@/lib/types";
import type { JSONContent } from "@tiptap/react";

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: chapter } = await supabase
    .from("ews_chapters")
    .select("*")
    .eq("id", id)
    .single<Chapter>();

  if (!chapter) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Chapter not found</p>
        <Link href="/chapters">
          <Button variant="outline">Back to Chapters</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/chapters">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {chapter.title}
            </h1>
            <Badge variant="outline">{chapter.status}</Badge>
          </div>
          {chapter.summary && (
            <p className="mt-1 text-sm text-muted-foreground">
              {chapter.summary}
            </p>
          )}
        </div>
        <Link href={`/chapters/${id}/edit`}>
          <Button size="sm">
            <Pencil />
            Edit
          </Button>
        </Link>
      </div>

      {/* Metadata */}
      <div className="mb-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>Created {new Date(chapter.created_at).toLocaleDateString()}</span>
        <span>Updated {new Date(chapter.updated_at).toLocaleDateString()}</span>
        <span>Order: {chapter.order_index + 1}</span>
      </div>

      <Separator className="mb-6" />

      {/* Content */}
      <div className="mx-auto max-w-4xl">
        {chapter.content ? (
          <ContentRenderer
            content={chapter.content as unknown as JSONContent}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No content yet.{" "}
            <Link
              href={`/chapters/${id}/edit`}
              className="text-primary underline underline-offset-4"
            >
              Start writing
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
