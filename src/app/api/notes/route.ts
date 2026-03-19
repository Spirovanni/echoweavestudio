import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient, verifyProjectAccess } from "@/lib/api/helpers";

/**
 * GET /api/notes
 * List notes for a project with optional tag filter.
 *
 * Query params:
 * - project_id: string (required)
 * - tag?: string (filter by tag)
 * - search?: string (search title/content)
 * - limit?: number (default 50, max 100)
 * - offset?: number (default 0)
 */
export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("project_id");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  if (!projectId) {
    return NextResponse.json(
      { error: "project_id query parameter is required" },
      { status: 400 }
    );
  }

  const hasAccess = await verifyProjectAccess(supabase!, user!.id, projectId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = Math.min(parseInt(limitParam || "50", 10), 100);
  const offset = parseInt(offsetParam || "0", 10);

  let query = supabase!
    .from("ews_notes")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    console.error("Notes fetch error:", dbError);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }

  // Get total count
  let countQuery = supabase!
    .from("ews_notes")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (tag) {
    countQuery = countQuery.contains("tags", [tag]);
  }
  if (search) {
    countQuery = countQuery.or(
      `title.ilike.%${search}%,content.ilike.%${search}%`
    );
  }

  const { count } = await countQuery;

  return NextResponse.json({ data: data || [], total: count || 0 });
}

/**
 * POST /api/notes
 * Create a new note.
 *
 * Body: { project_id, title, content?, tags? }
 */
export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const body = await request.json();
  const { project_id, title, content, tags } = body;

  if (!project_id || !title) {
    return NextResponse.json(
      { error: "project_id and title are required" },
      { status: 400 }
    );
  }

  const hasAccess = await verifyProjectAccess(supabase!, user!.id, project_id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error: dbError } = await supabase!
    .from("ews_notes")
    .insert({
      project_id,
      title,
      content: content || null,
      tags: Array.isArray(tags) ? tags : [],
      created_by: user!.id,
    })
    .select()
    .single();

  if (dbError) {
    console.error("Note create error:", dbError);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
