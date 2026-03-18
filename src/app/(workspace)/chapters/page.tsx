import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { Badge } from "@/components/ui/badge";
import type { Chapter } from "@/lib/types";

export default async function ChaptersPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Get chapters from all projects the user is a member of
  const { data: memberships } = await supabase
    .from("ews_project_members")
    .select("project_id")
    .eq("user_id", user.id);

  const projectIds = memberships?.map((m) => m.project_id) ?? [];

  let chapters: Chapter[] = [];
  if (projectIds.length > 0) {
    const { data } = await supabase
      .from("ews_chapters")
      .select("*")
      .in("project_id", projectIds)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });
    chapters = (data as Chapter[]) ?? [];
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chapters</h1>
          <p className="text-sm text-muted-foreground">
            Build and revise narrative chapters
          </p>
        </div>
      </div>

      {chapters.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No chapters yet. Create a project first, then add chapters.
        </p>
      ) : (
        <div className="space-y-2">
          {chapters.map((chapter) => (
            <Link
              key={chapter.id}
              href={`/chapters/${chapter.id}`}
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {chapter.order_index + 1}.
                  </span>
                  <h2 className="font-medium">{chapter.title}</h2>
                </div>
                {chapter.summary && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                    {chapter.summary}
                  </p>
                )}
              </div>
              <Badge variant="outline">{chapter.status}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
