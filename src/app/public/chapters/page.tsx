import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Published Chapters — Echo Weave Studio",
  description: "Read published chapters and stories from Echo Weave Studio.",
};

export default async function PublicChaptersPage() {
  const supabase = await createClient();

  const { data: chapters } = await supabase
    .from("ews_chapters")
    .select("id, title, summary, order_index, created_at")
    .eq("status", "published")
    .order("order_index", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Published Chapters</h1>

      {!chapters || chapters.length === 0 ? (
        <p className="text-muted-foreground">No published chapters yet.</p>
      ) : (
        <div className="space-y-4">
          {chapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={`/public/chapters/${chapter.id}`}
              className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-muted-foreground">
                  Ch. {chapter.order_index + 1}
                </span>
                <h2 className="text-lg font-semibold">{chapter.title}</h2>
              </div>
              {chapter.summary && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {chapter.summary}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
