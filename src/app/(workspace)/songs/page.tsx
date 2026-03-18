import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { PageShell } from "@/components/layout/page-shell";
import { SongsListView } from "./songs-list-view";
import type { Song } from "@/lib/types";

export default async function SongsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Get projects the user is a member of
  const { data: memberships } = await supabase
    .from("ews_project_members")
    .select("project_id")
    .eq("user_id", user.id);

  const projectIds = memberships?.map((m) => m.project_id) ?? [];

  let songs: Song[] = [];
  if (projectIds.length > 0) {
    const { data } = await supabase
      .from("ews_songs")
      .select("*")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });
    songs = (data as Song[]) ?? [];
  }

  const defaultProjectId = projectIds[0] ?? null;

  return (
    <PageShell
      title="Songs"
      description="Lyrical and musical assets tied to the story"
    >
      <SongsListView songs={songs} projectId={defaultProjectId} />
    </PageShell>
  );
}
