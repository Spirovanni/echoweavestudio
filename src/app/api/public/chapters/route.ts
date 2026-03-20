import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/public/chapters
 * List published chapters. No authentication required.
 *
 * Query params:
 *   project_id - filter by project (optional)
 *   limit      - max results (default 50)
 *   offset     - pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  const supabase = await createClient();

  let query = supabase
    .from("ews_chapters")
    .select("id, project_id, title, summary, order_index, status, created_at, updated_at", {
      count: "exact",
    })
    .eq("status", "published")
    .order("order_index", { ascending: true })
    .range(offset, offset + limit - 1);

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { data, total: count },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
