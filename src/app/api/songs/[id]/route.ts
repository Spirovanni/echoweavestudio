import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient, verifyProjectAccess } from "@/lib/api/helpers";

/**
 * GET /api/songs/[id]
 * Get a single song by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("ews_songs")
    .select("*")
    .eq("id", id)
    .single();

  if (dbError || !data) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const hasAccess = await verifyProjectAccess(supabase!, user!.id, data.project_id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data });
}

/**
 * PATCH /api/songs/[id]
 * Update a song. Body: { title?, lyrics?, audio_url?, mood? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { data: existing, error: fetchError } = await supabase!
    .from("ews_songs")
    .select("project_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const hasAccess = await verifyProjectAccess(supabase!, user!.id, existing.project_id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const allowedFields = ["title", "lyrics", "audio_url", "mood"];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { data, error: dbError } = await supabase!
    .from("ews_songs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * DELETE /api/songs/[id]
 * Delete a song.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { data: existing, error: fetchError } = await supabase!
    .from("ews_songs")
    .select("project_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const hasAccess = await verifyProjectAccess(supabase!, user!.id, existing.project_id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: dbError } = await supabase!
    .from("ews_songs")
    .delete()
    .eq("id", id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
