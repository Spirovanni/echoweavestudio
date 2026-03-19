# Entity Linking Architecture

## Overview

The entity linking system allows chapters to be associated with related creative assets: songs, images, conversations, characters, and themes. This creates a rich, interconnected narrative structure where writers can weave together different elements of their story.

## Database Schema

### Junction Tables

Each linkable entity type has its own junction table following a consistent naming pattern:

```
ews_chapter_songs         (chapter_id, song_id, created_at)
ews_chapter_images        (chapter_id, image_id, created_at)
ews_chapter_conversations (chapter_id, conversation_id, created_at)
ews_chapter_characters    (chapter_id, character_id, created_at)
ews_chapter_themes        (chapter_id, theme_id, created_at)
```

**Key characteristics:**
- Composite primary key on `(chapter_id, entity_id)` ensures unique links
- Foreign keys with `ON DELETE CASCADE` automatically clean up orphaned links
- `created_at` timestamp tracks when the link was established
- Indexes on entity_id columns for efficient reverse lookups

### Row-Level Security (RLS)

All junction tables enforce project-scoped access through RLS policies:

- **View links**: Any project member can view links for chapters in their projects
- **Manage links**: Any project member can create/delete links for chapters in their projects
- Access is derived from the chapter's `project_id` through joins

## TypeScript Types

### Core Types

```typescript
// Linkable entity types (entities that can be linked to chapters)
export type LinkableEntityType =
  | "song"
  | "image"
  | "conversation"
  | "character"
  | "theme";

// Generic link interface
export interface EntityLink {
  chapter_id: string;
  entity_id: string;
  entity_type: LinkableEntityType;
  created_at: string;
}

// Specific junction table interfaces
export interface ChapterSongLink {
  chapter_id: string;
  song_id: string;
  created_at: string;
}
// ... (similar for other entity types)
```

### Type Mappings

Three constant mappings provide type-safe access to table and column names:

```typescript
// Junction table names
export const LINK_TABLE_MAP: Record<LinkableEntityType, string> = {
  song: "ews_chapter_songs",
  image: "ews_chapter_images",
  // ...
};

// Entity table names
export const ENTITY_TABLE_MAP: Record<LinkableEntityType, string> = {
  song: "ews_songs",
  image: "ews_images",
  // ...
};

// ID column names in junction tables
export const LINK_ID_COLUMN_MAP: Record<LinkableEntityType, string> = {
  song: "song_id",
  image: "image_id",
  // ...
};
```

## API Pattern

### Consistent Route Structure

All linking operations follow a uniform RESTful pattern:

```
POST   /api/chapters/[id]/links/[entityType]/[entityId]  - Create link
DELETE /api/chapters/[id]/links/[entityType]/[entityId]  - Remove link
GET    /api/chapters/[id]/links/[entityType]             - List all links of type
GET    /api/chapters/[id]/links                          - List all links (all types)
```

**Path Parameters:**
- `id` - Chapter UUID
- `entityType` - One of: `song`, `image`, `conversation`, `character`, `theme`
- `entityId` - Entity UUID

### Request Flow

1. **Validate entity type** - Ensure `entityType` is a valid `LinkableEntityType`
2. **Authenticate user** - Get authenticated Supabase client
3. **Verify chapter access** - Check user has access to the chapter's project
4. **Verify entity access** - Check entity exists and user has access to its project
5. **Validate same project** - Ensure chapter and entity belong to the same project
6. **Execute operation** - Insert/delete in appropriate junction table

### Response Format

**Success (Create):**
```json
{
  "data": {
    "chapter_id": "uuid",
    "song_id": "uuid",
    "created_at": "2026-03-18T..."
  }
}
```

**Success (List):**
```json
{
  "data": [
    {
      "chapter_id": "uuid",
      "entity_id": "uuid",
      "entity_type": "song",
      "entity": { ...song data... },
      "created_at": "2026-03-18T..."
    }
  ]
}
```

**Error:**
```json
{
  "error": "Chapter not found"
}
```

## Implementation Guide

### Creating a Link API Route

Here's a template for implementing a link creation endpoint:

```typescript
// src/app/api/chapters/[id]/links/[entityType]/[entityId]/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient, verifyProjectAccess } from "@/lib/api/helpers";
import {
  LINK_TABLE_MAP,
  ENTITY_TABLE_MAP,
  LINK_ID_COLUMN_MAP,
  type LinkableEntityType,
} from "@/lib/types";

const VALID_ENTITY_TYPES: LinkableEntityType[] = [
  "song",
  "image",
  "conversation",
  "character",
  "theme",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entityType: string; entityId: string }> }
) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { id: chapterId, entityType, entityId } = await params;

  // 1. Validate entity type
  if (!VALID_ENTITY_TYPES.includes(entityType as LinkableEntityType)) {
    return NextResponse.json(
      { error: `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const type = entityType as LinkableEntityType;

  // 2. Get chapter and verify access
  const { data: chapter } = await supabase!
    .from("ews_chapters")
    .select("project_id")
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const hasChapterAccess = await verifyProjectAccess(supabase!, user!.id, chapter.project_id);
  if (!hasChapterAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // 3. Get entity and verify access
  const { data: entity } = await supabase!
    .from(ENTITY_TABLE_MAP[type])
    .select("project_id")
    .eq("id", entityId)
    .single();

  if (!entity) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  const hasEntityAccess = await verifyProjectAccess(supabase!, user!.id, entity.project_id);
  if (!hasEntityAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // 4. Verify same project
  if (chapter.project_id !== entity.project_id) {
    return NextResponse.json(
      { error: "Chapter and entity must belong to the same project" },
      { status: 400 }
    );
  }

  // 5. Create link (ignore if already exists)
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
    return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
  }

  return NextResponse.json({ data: link }, { status: 201 });
}
```

### Client-Side Usage

```typescript
// Create a link
async function linkSongToChapter(chapterId: string, songId: string) {
  const res = await fetch(`/api/chapters/${chapterId}/links/song/${songId}`, {
    method: "POST",
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error);
  }
  return res.json();
}

// Remove a link
async function unlinkSongFromChapter(chapterId: string, songId: string) {
  const res = await fetch(`/api/chapters/${chapterId}/links/song/${songId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error);
  }
  return res.json();
}

// Get all songs linked to a chapter
async function getChapterSongs(chapterId: string) {
  const res = await fetch(`/api/chapters/${chapterId}/links/song`);
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error);
  }
  const { data } = await res.json();
  return data; // Array of { chapter_id, song_id, entity: Song, created_at }
}
```

## UI Components

### Link Picker Component

A reusable component for selecting entities to link:

```typescript
<EntityLinkPicker
  chapterId={chapterId}
  entityType="song"
  onLink={(entityId) => linkEntity(entityId)}
/>
```

**Features:**
- Search/filter entities by name
- Show only entities in the same project
- Indicate already-linked entities
- Accessible keyboard navigation

### Linked Entities Display

A component to show all linked entities for a chapter:

```typescript
<LinkedEntitiesDisplay
  chapterId={chapterId}
  entityType="song"
  onUnlink={(entityId) => unlinkEntity(entityId)}
/>
```

**Features:**
- Group by entity type with tabs/sections
- Display entity preview cards
- Unlink action with confirmation
- Drag-and-drop reordering (future enhancement)

## Benefits of This Architecture

1. **Type Safety**: TypeScript types ensure correct usage across the codebase
2. **Consistency**: Same pattern for all entity types reduces cognitive load
3. **Scalability**: Easy to add new linkable entity types in the future
4. **Performance**: Proper indexes and RLS policies ensure efficient queries
5. **Security**: RLS policies enforce project-scoped access automatically
6. **Maintainability**: Centralized mappings make updates easy

## Future Enhancements

- **Link metadata**: Add `order`, `notes`, or `relevance` fields to junction tables
- **Bi-directional links**: Support entity-to-entity links beyond just chapter links
- **Link suggestions**: AI-powered recommendations for related entities
- **Link analytics**: Track which entities are most commonly linked together
- **Bulk operations**: Link/unlink multiple entities at once
