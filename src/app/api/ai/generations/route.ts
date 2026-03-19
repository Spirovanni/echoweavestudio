import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient, verifyProjectAccess } from "@/lib/api/helpers";
import { fetchAIGenerations } from "@/lib/ai/generations";
import type { AIToolType, EntityType } from "@/lib/types";

const VALID_TOOL_TYPES: AIToolType[] = ["plot", "outline", "story", "assist", "copilot"];

/**
 * GET /api/ai/generations?project_id=...&tool_type=...&limit=...&offset=...
 * List AI generations for a project with optional filters.
 *
 * Query params:
 * - project_id (required): Project ID
 * - tool_type (optional): Filter by tool type
 * - source_entity_type (optional): Filter by source entity type
 * - source_entity_id (optional): Filter by source entity ID
 * - limit (optional): Number of results (default 50, max 100)
 * - offset (optional): Offset for pagination (default 0)
 *
 * Returns: { data: AIGeneration[], count: number }
 */
export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("project_id");
  const toolType = searchParams.get("tool_type") as AIToolType | null;
  const sourceEntityType = searchParams.get("source_entity_type") as EntityType | null;
  const sourceEntityId = searchParams.get("source_entity_id");
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "50", 10),
    100
  );
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  if (!projectId) {
    return NextResponse.json(
      { error: "project_id query parameter is required" },
      { status: 400 }
    );
  }

  // Validate tool type if provided
  if (toolType && !VALID_TOOL_TYPES.includes(toolType)) {
    return NextResponse.json(
      {
        error: `Invalid tool_type. Must be one of: ${VALID_TOOL_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Verify project access
  const hasAccess = await verifyProjectAccess(supabase!, user!.id, projectId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch generations
  const result = await fetchAIGenerations(supabase!, projectId, {
    toolType: toolType || undefined,
    sourceEntityType: sourceEntityType || undefined,
    sourceEntityId: sourceEntityId || undefined,
    limit,
    offset,
  });

  if (result.error) {
    return NextResponse.json(
      { error: "Failed to fetch AI generations" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: result.data,
    count: result.count,
    limit,
    offset,
  });
}
