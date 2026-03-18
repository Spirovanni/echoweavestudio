import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { PageShell } from "@/components/layout/page-shell";
import { ChaptersListView } from "./chapters-list-view";
import type { Chapter } from "@/lib/types";

export default async function ChaptersPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Get projects the user is a member of
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

  // Use the first project as default for creating new chapters
  const defaultProjectId = projectIds[0] ?? null;

  return (
    <PageShell
      title="Chapters"
      description="Build and revise narrative chapters"
    >
      <ChaptersListView chapters={chapters} projectId={defaultProjectId} />
    </PageShell>
  );
}
