import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient, verifyProjectAccess } from "@/lib/api/helpers";

/**
 * PATCH /api/chapters/[id]/publish
 * Toggle chapter published status.
 * - If currently "published", reverts to "complete"
 * - Otherwise sets status to "published"
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { data: chapter, error: fetchError } = await supabase!
    .from("ews_chapters")
    .select("project_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const hasAccess = await verifyProjectAccess(supabase!, user!.id, chapter.project_id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newStatus = chapter.status === "published" ? "complete" : "published";

  const { data, error: updateError } = await supabase!
    .from("ews_chapters")
    .update({ status: newStatus })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
