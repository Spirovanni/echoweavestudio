import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient, verifyProjectAccess } from "@/lib/api/helpers";

/**
 * PATCH /api/images/[id]/publish
 * Toggle image published status.
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { data: image, error: fetchError } = await supabase!
    .from("ews_images")
    .select("project_id, published")
    .eq("id", id)
    .single();

  if (fetchError || !image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const hasAccess = await verifyProjectAccess(supabase!, user!.id, image.project_id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error: updateError } = await supabase!
    .from("ews_images")
    .update({ published: !image.published })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
