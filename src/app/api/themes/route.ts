import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient, verifyProjectAccess } from "@/lib/api/helpers";

/**
 * GET /api/themes
 * List themes for a project.
 *
 * Query params:
 * - project_id: string (required)
 * - search?: string (search name/description)
 * - limit?: number (default 50, max 100)
 * - offset?: number (default 0)
 */
export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("project_id");
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
    .from("ews_themes")
    .select("*")
    .eq("project_id", projectId)
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    console.error("Themes fetch error:", dbError);
    return NextResponse.json(
      { error: "Failed to fetch themes" },
      { status: 500 }
    );
  }

  // Get total count
  let countQuery = supabase!
    .from("ews_themes")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (search) {
    countQuery = countQuery.or(
      `name.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { count } = await countQuery;

  return NextResponse.json({ data: data || [], total: count || 0 });
}

/**
 * POST /api/themes
 * Create a new theme.
 *
 * Body: { project_id, name, description? }
 */
export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const body = await request.json();
  const { project_id, name, description } = body;

  if (!project_id || !name) {
    return NextResponse.json(
      { error: "project_id and name are required" },
      { status: 400 }
    );
  }

  const hasAccess = await verifyProjectAccess(supabase!, user!.id, project_id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error: dbError } = await supabase!
    .from("ews_themes")
    .insert({
      project_id,
      name,
      description: description || null,
      created_by: user!.id,
    })
    .select()
    .single();

  if (dbError) {
    console.error("Theme create error:", dbError);
    return NextResponse.json(
      { error: "Failed to create theme" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
