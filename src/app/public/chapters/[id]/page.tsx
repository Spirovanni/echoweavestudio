import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ContentRenderer } from "@/components/editor/ContentRenderer";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("ews_chapters")
    .select("title, summary")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!chapter) return { title: "Chapter Not Found" };

  return {
    title: `${chapter.title} — Echo Weave Studio`,
    description: chapter.summary || undefined,
  };
}

export default async function PublicChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch chapter + author display name
  const { data: chapter } = await supabase
    .from("ews_chapters")
    .select("id, title, summary, content, order_index, created_at, updated_at, created_by")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!chapter) {
    notFound();
  }

  // Fetch all published chapters in same project for prev/next navigation
  const { data: siblings } = await supabase
    .from("ews_chapters")
    .select("id, title, order_index, project_id")
    .eq("status", "published")
    .order("order_index", { ascending: true });

  // Filter to same project and find neighbors
  const projectChapters = siblings?.filter(
    (c) => c.project_id === (siblings?.find((s) => s.id === id)?.project_id)
  ) ?? [];

  const currentIdx = projectChapters.findIndex((c) => c.id === id);
  const prevChapter = currentIdx > 0 ? projectChapters[currentIdx - 1] : null;
  const nextChapter = currentIdx < projectChapters.length - 1 ? projectChapters[currentIdx + 1] : null;

  // Fetch author name
  const { data: author } = await supabase
    .from("ews_profiles")
    .select("display_name")
    .eq("id", chapter.created_by)
    .single();

  return (
    <article className="space-y-6">
      <div>
        <Link
          href="/public/chapters"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; All chapters
        </Link>
      </div>

      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Chapter {chapter.order_index + 1}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{chapter.title}</h1>
        {chapter.summary && (
          <p className="text-lg text-muted-foreground">{chapter.summary}</p>
        )}
        {author && (
          <p className="text-sm text-muted-foreground">
            By {author.display_name}
          </p>
        )}
      </header>

      <hr className="border-border" />

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        {chapter.content ? (
          <ContentRenderer content={chapter.content} />
        ) : (
          <p className="text-muted-foreground italic">No content yet.</p>
        )}
      </div>

      {/* Prev / Next navigation */}
      {(prevChapter || nextChapter) && (
        <>
          <hr className="border-border" />
          <nav className="flex justify-between">
            <div>
              {prevChapter && (
                <Link
                  href={`/public/chapters/${prevChapter.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  &larr; {prevChapter.title}
                </Link>
              )}
            </div>
            <div>
              {nextChapter && (
                <Link
                  href={`/public/chapters/${nextChapter.id}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {nextChapter.title} &rarr;
                </Link>
              )}
            </div>
          </nav>
        </>
      )}
    </article>
  );
}
