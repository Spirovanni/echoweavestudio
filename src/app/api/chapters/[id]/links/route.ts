import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient, verifyProjectAccess } from "@/lib/api/helpers";
import {
  LINK_TABLE_MAP,
  ENTITY_TABLE_MAP,
  LINK_ID_COLUMN_MAP,
  type LinkableEntityType,
  type EntityLink,
} from "@/lib/types";

const VALID_ENTITY_TYPES: LinkableEntityType[] = [
  "song",
  "image",
  "conversation",
  "character",
  "theme",
];

/**
 * GET /api/chapters/[id]/links
 * Get all linked entities for a chapter, grouped by type.
 *
 * Returns: { data: EntityLink[] }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { id: chapterId } = await params;

  // Verify chapter exists and user has access
  const { data: chapter } = await supabase!
    .from("ews_chapters")
    .select("project_id")
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const hasAccess = await verifyProjectAccess(supabase!, user!.id, chapter.project_id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Fetch all linked entities from all junction tables
  const links: EntityLink[] = [];

  for (const entityType of VALID_ENTITY_TYPES) {
    const linkTable = LINK_TABLE_MAP[entityType];
    const entityTable = ENTITY_TABLE_MAP[entityType];
    const idColumn = LINK_ID_COLUMN_MAP[entityType];

    // Query junction table and join with entity table to get entity data
    const { data, error: linkError } = await supabase!
      .from(linkTable)
      .select(`
        chapter_id,
        ${idColumn},
        created_at,
        entity:${entityTable}(*)
      `)
      .eq("chapter_id", chapterId) as any;

    if (linkError) {
      console.error(`Error fetching ${entityType} links:`, linkError);
      continue; // Skip this type on error
    }

    if (data) {
      // Transform to EntityLink format
      for (const link of data as any[]) {
        links.push({
          chapter_id: link.chapter_id,
          entity_id: link[idColumn],
          entity_type: entityType,
          entity: Array.isArray(link.entity) ? link.entity[0] : link.entity,
          created_at: link.created_at,
        });
      }
    }
  }

  // Sort by created_at descending
  links.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return NextResponse.json({ data: links });
}

/**
 * POST /api/chapters/[id]/links
 * Create a link between a chapter and an entity.
 *
 * Body: { entityType: LinkableEntityType, entityId: string }
 * Returns: { data: EntityLink }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { id: chapterId } = await params;
  const body = await request.json();
  const { entityType, entityId } = body;

  // Validate entity type
  if (!entityType || !VALID_ENTITY_TYPES.includes(entityType as LinkableEntityType)) {
    return NextResponse.json(
      {
        error: `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (!entityId) {
    return NextResponse.json(
      { error: "entityId is required" },
      { status: 400 }
    );
  }

  const type = entityType as LinkableEntityType;

  // Get chapter and verify access
  const { data: chapter } = await supabase!
    .from("ews_chapters")
    .select("project_id")
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const hasChapterAccess = await verifyProjectAccess(
    supabase!,
    user!.id,
    chapter.project_id
  );
  if (!hasChapterAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Get entity and verify access
  const { data: entity } = await supabase!
    .from(ENTITY_TABLE_MAP[type])
    .select("id, project_id")
    .eq("id", entityId)
    .single();

  if (!entity) {
    return NextResponse.json(
      { error: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` },
      { status: 404 }
    );
  }

  const hasEntityAccess = await verifyProjectAccess(
    supabase!,
    user!.id,
    entity.project_id
  );
  if (!hasEntityAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Verify same project
  if (chapter.project_id !== entity.project_id) {
    return NextResponse.json(
      { error: "Chapter and entity must belong to the same project" },
      { status: 400 }
    );
  }

  // Create link (ignore if already exists)
  const { data: link, error: linkError } = await supabase!
    .from(LINK_TABLE_MAP[type])
    .insert({
      chapter_id: chapterId,
      [LINK_ID_COLUMN_MAP[type]]: entityId,
    })
    .select()
    .single();

  if (linkError) {
    // Ignore duplicate key errors (23505)
    if (linkError.code === "23505") {
      return NextResponse.json(
        { message: "Link already exists" },
        { status: 200 }
      );
    }
    console.error("Link creation error:", linkError);
    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 }
    );
  }

  // Return the link with entity data
  const entityLink: EntityLink = {
    chapter_id: chapterId,
    entity_id: entityId,
    entity_type: type,
    entity: entity,
    created_at: link.created_at,
  } as any;

  return NextResponse.json({ data: entityLink }, { status: 201 });
}

/**
 * DELETE /api/chapters/[id]/links
 * Remove a link between a chapter and an entity.
 *
 * Body: { entityType: LinkableEntityType, entityId: string }
 * Returns: { message: string }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { id: chapterId } = await params;
  const body = await request.json();
  const { entityType, entityId } = body;

  // Validate entity type
  if (!entityType || !VALID_ENTITY_TYPES.includes(entityType as LinkableEntityType)) {
    return NextResponse.json(
      {
        error: `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (!entityId) {
    return NextResponse.json(
      { error: "entityId is required" },
      { status: 400 }
    );
  }

  const type = entityType as LinkableEntityType;

  // Verify chapter exists and user has access
  const { data: chapter } = await supabase!
    .from("ews_chapters")
    .select("project_id")
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const hasAccess = await verifyProjectAccess(
    supabase!,
    user!.id,
    chapter.project_id
  );
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Delete the link
  const { error: deleteError } = await supabase!
    .from(LINK_TABLE_MAP[type])
    .delete()
    .eq("chapter_id", chapterId)
    .eq(LINK_ID_COLUMN_MAP[type], entityId);

  if (deleteError) {
    console.error("Link deletion error:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete link" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Link removed successfully" });
}
