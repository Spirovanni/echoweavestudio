import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient } from "@/lib/api/helpers";
import { requireProjectAdmin } from "@/lib/auth/roles";

/**
 * GET /api/projects/[id]
 * Get project details including members.
 *
 * Returns: { data: { project, members } }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { id } = await params;

  // Fetch project
  const { data: project, error: projectError } = await supabase!
    .from("ews_projects")
    .select("*")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Verify user has access
  const { data: membership } = await supabase!
    .from("ews_project_members")
    .select("role")
    .eq("project_id", id)
    .eq("user_id", user!.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch project members with profile information
  const { data: members, error: membersError } = await supabase!
    .from("ews_project_members")
    .select(`
      user_id,
      role,
      joined_at,
      ews_profiles!inner(id, display_name, email, avatar_url)
    `)
    .eq("project_id", id)
    .order("joined_at", { ascending: true });

  if (membersError) {
    console.error("Members fetch error:", membersError);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }

  // Transform members data
  const transformedMembers = members?.map((m: any) => ({
    userId: m.user_id,
    role: m.role,
    joinedAt: m.joined_at,
    profile: Array.isArray(m.ews_profiles) ? m.ews_profiles[0] : m.ews_profiles,
  })) ?? [];

  return NextResponse.json({
    data: {
      project,
      members: transformedMembers,
    },
  });
}

/**
 * PATCH /api/projects/[id]
 * Update project metadata (admin-only).
 *
 * Body: {
 *   title?: string,
 *   description?: string
 * }
 *
 * Returns: { data: Project }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { title, description } = body;

  // Verify user is an admin of the project
  try {
    await requireProjectAdmin(supabase!, user!.id, id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin access required" },
      { status: 403 }
    );
  }

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {};
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "title must be a non-empty string" },
        { status: 400 }
      );
    }
    updates.title = title.trim();
  }
  if (description !== undefined) {
    updates.description = typeof description === "string" ? description.trim() : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No fields provided to update" },
      { status: 400 }
    );
  }

  // Update project
  const { data: updatedProject, error: updateError } = await supabase!
    .from("ews_projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Project update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }

  // Log activity event
  await supabase!.from("ews_activity_events").insert({
    project_id: id,
    user_id: user!.id,
    event_type: "updated",
    entity_type: "project",
    entity_id: id,
    metadata: { changes: updates },
  });

  return NextResponse.json({ data: updatedProject });
}
