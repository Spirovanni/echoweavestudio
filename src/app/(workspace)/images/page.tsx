import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { PageShell } from "@/components/layout/page-shell";
import { ImagesGalleryView } from "./images-gallery-view";
import type { Image } from "@/lib/types";

export default async function ImagesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // Get projects the user is a member of
  const { data: memberships } = await supabase
    .from("ews_project_members")
    .select("project_id")
    .eq("user_id", user.id);

  const projectIds = memberships?.map((m) => m.project_id) ?? [];

  let images: Image[] = [];
  if (projectIds.length > 0) {
    const { data } = await supabase
      .from("ews_images")
      .select("*")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });
    images = (data as Image[]) ?? [];
  }

  const defaultProjectId = projectIds[0] ?? null;

  return (
    <PageShell
      title="Images"
      description="Visual inspiration and narrative artwork"
    >
      <ImagesGalleryView images={images} projectId={defaultProjectId} />
    </PageShell>
  );
}
