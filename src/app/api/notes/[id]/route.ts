import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient, verifyProjectAccess } from "@/lib/api/helpers";

/**
 * GET /api/notes/[id]
 * Get a single note by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("ews_notes")
    .select("*")
    .eq("id", id)
    .single();

  if (dbError || !data) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const hasAccess = await verifyProjectAccess(
    supabase!,
    user!.id,
    data.project_id
  );
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data });
}

/**
 * PATCH /api/notes/[id]
 * Update a note. Body: { title?, content?, tags? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { data: existing, error: fetchError } = await supabase!
    .from("ews_notes")
    .select("project_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const hasAccess = await verifyProjectAccess(
    supabase!,
    user!.id,
    existing.project_id
  );
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const allowedFields = ["title", "content", "tags"];
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
    .from("ews_notes")
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
 * DELETE /api/notes/[id]
 * Delete a note.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { data: existing, error: fetchError } = await supabase!
    .from("ews_notes")
    .select("project_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const hasAccess = await verifyProjectAccess(
    supabase!,
    user!.id,
    existing.project_id
  );
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: dbError } = await supabase!
    .from("ews_notes")
    .delete()
    .eq("id", id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
