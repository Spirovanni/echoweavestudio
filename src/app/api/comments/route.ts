import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient, verifyProjectAccess } from "@/lib/api/helpers";
import { createComment, fetchComments } from "@/lib/comments/service";
import { logCreatedEvent } from "@/lib/activity/events";
import type { CommentableEntityType } from "@/lib/comments/types";

/**
 * GET /api/comments
 * List comments for an entity with pagination
 *
 * Query params:
 * - entityType: CommentableEntityType (required)
 * - entityId: string (required)
 * - limit?: number (default 50, max 100)
 * - offset?: number (default 0)
 * - sortOrder?: "asc" | "desc" (default "asc")
 *
 * Returns: { data: CommentWithUser[], total: number }
 */
export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const entityType = searchParams.get("entityType") as CommentableEntityType | null;
  const entityId = searchParams.get("entityId");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: "entityType and entityId query parameters are required" },
      { status: 400 }
    );
  }

  // Verify user has access to the entity's project
  // First, get the entity to find its project_id
  const projectId = await getEntityProjectId(supabase!, entityType, entityId);
  if (!projectId) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  const hasAccess = await verifyProjectAccess(supabase!, user!.id, projectId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse pagination params
  const limit = Math.min(parseInt(limitParam || "50", 10), 100);
  const offset = parseInt(offsetParam || "0", 10);

  // Fetch comments
  const comments = await fetchComments(supabase!, {
    entityType,
    entityId,
    limit,
    offset,
    sortOrder,
  });

  // Get total count for pagination
  const { count, error: countError } = await supabase!
    .from("ews_comments")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  if (countError) {
    console.error("Comment count error:", countError);
  }

  return NextResponse.json({
    data: comments,
    total: count || 0,
  });
}

/**
 * POST /api/comments
 * Create a new comment
 *
 * Body:
 * - entityType: CommentableEntityType
 * - entityId: string
 * - content: string
 *
 * Returns: { data: CommentWithUser }
 */
export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const body = await request.json();
  const { entityType, entityId, content } = body;

  if (!entityType || !entityId || !content) {
    return NextResponse.json(
      { error: "entityType, entityId, and content are required" },
      { status: 400 }
    );
  }

  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json(
      { error: "content must be a non-empty string" },
      { status: 400 }
    );
  }

  // Verify user has access to the entity's project
  const projectId = await getEntityProjectId(supabase!, entityType, entityId);
  if (!projectId) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  const hasAccess = await verifyProjectAccess(supabase!, user!.id, projectId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Create comment
  const comment = await createComment(supabase!, {
    entityType,
    entityId,
    content: content.trim(),
    userId: user!.id,
  });

  if (!comment) {
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }

  // Log activity event
  await logCreatedEvent(
    supabase!,
    projectId,
    user!.id,
    entityType,
    entityId,
    {
      comment_id: comment.id,
      content_preview: content.trim().substring(0, 100),
    }
  );

  return NextResponse.json({ data: comment });
}

/**
 * Helper function to get the project_id for an entity
 */
async function getEntityProjectId(
  supabase: any,
  entityType: string,
  entityId: string
): Promise<string | null> {
  try {
    let tableName: string;

    switch (entityType) {
      case "chapter":
        tableName = "ews_chapters";
        break;
      case "song":
        tableName = "ews_songs";
        break;
      case "image":
        tableName = "ews_images";
        break;
      case "conversation":
        tableName = "ews_conversations";
        break;
      case "character":
        tableName = "ews_characters";
        break;
      case "theme":
        tableName = "ews_themes";
        break;
      case "note":
        tableName = "ews_notes";
        break;
      default:
        return null;
    }

    const { data, error } = await supabase
      .from(tableName)
      .select("project_id")
      .eq("id", entityId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.project_id;
  } catch (error) {
    console.error("Failed to fetch entity project_id:", error);
    return null;
  }
}
