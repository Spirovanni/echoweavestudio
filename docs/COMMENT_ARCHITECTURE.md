# Polymorphic Comment Architecture

## Overview

The comment system uses a polymorphic architecture pattern that allows comments to be attached to any entity type without schema changes. This flexible design supports current entity types (chapters, songs, images, etc.) and future additions.

## Core Principles

### 1. Polymorphic Pattern

Instead of creating separate comment tables for each entity type, we use a single `ews_comments` table with:
- `entity_type`: Discriminator field identifying the type of entity
- `entity_id`: Foreign key pointing to any entity (not enforced by database)

**Benefits:**
- Single source of truth for all comments
- No schema migrations when adding new entity types
- Consistent comment behavior across all entities
- Simplified query patterns

**Trade-offs:**
- No database-level foreign key constraints (handled in application layer)
- Requires application logic to ensure referential integrity

### 2. Supported Entity Types

Current supported entities:
- `chapter` - Chapter comments
- `song` - Song comments
- `image` - Image comments
- `character` - Character profile comments
- `theme` - Theme discussion comments
- `note` - Note annotations
- `conversation` - Conversation thread comments

**Adding New Entity Types:**

To support a new entity type:

1. Add the entity type to the database CHECK constraint:
```sql
ALTER TABLE ews_comments
DROP CONSTRAINT IF EXISTS ews_comments_entity_type_check;

ALTER TABLE ews_comments
ADD CONSTRAINT ews_comments_entity_type_check
CHECK (entity_type IN ('chapter', 'song', 'image', 'character', 'theme', 'note', 'conversation', 'NEW_TYPE'));
```

2. Update the TypeScript type:
```typescript
// src/lib/comments/types.ts
export type CommentableEntityType =
  | "chapter"
  | "song"
  // ... existing types
  | "NEW_TYPE";
```

3. That's it! The service layer and API routes will automatically support the new type.

## Database Schema

```sql
CREATE TABLE ews_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'chapter', 'song', 'image', 'character',
    'theme', 'note', 'conversation'
  )),
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_entity ON ews_comments(entity_type, entity_id);
CREATE INDEX idx_comments_user ON ews_comments(user_id);
CREATE INDEX idx_comments_created ON ews_comments(created_at DESC);
```

**Key Indexes:**
- `(entity_type, entity_id)` - Composite index for fetching all comments on an entity
- `user_id` - Index for fetching all comments by a user
- `created_at DESC` - Index for chronological ordering

## TypeScript Types

### Core Types

```typescript
// Supported entity types (discriminated union)
type CommentableEntityType =
  | "chapter"
  | "song"
  | "image"
  // ... etc

// Basic comment structure
interface Comment {
  id: string;
  user_id: string;
  entity_type: CommentableEntityType;
  entity_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Comment with joined user profile
interface CommentWithUser extends Comment {
  user: {
    id: string;
    display_name: string;
    email: string;
    avatar_url?: string | null;
  };
}
```

### Type-Safe Entity References

```typescript
// Generic comment reference for type safety
interface CommentReference<T extends CommentableEntityType = CommentableEntityType> {
  entityType: T;
  entityId: string;
}

// Usage examples
const chapterComments: CommentReference<"chapter"> = {
  entityType: "chapter",
  entityId: "chapter-uuid"
};

const songComments: CommentReference<"song"> = {
  entityType: "song",
  entityId: "song-uuid"
};
```

## Service Layer

The service layer (`src/lib/comments/service.ts`) provides CRUD operations:

### Create Comment

```typescript
import { createComment } from "@/lib/comments/service";

const comment = await createComment(supabase, {
  entityType: "chapter",
  entityId: "chapter-uuid",
  content: "Great chapter!",
  userId: "user-uuid",
});
```

### Fetch Comments

```typescript
import { fetchComments } from "@/lib/comments/service";

const comments = await fetchComments(supabase, {
  entityType: "chapter",
  entityId: "chapter-uuid",
  limit: 50,
  offset: 0,
  sortOrder: "asc", // or "desc"
});
```

### Update Comment

```typescript
import { updateComment } from "@/lib/comments/service";

const updated = await updateComment(supabase, {
  commentId: "comment-uuid",
  content: "Updated content",
  userId: "user-uuid", // Must match comment owner
});
```

### Delete Comment

```typescript
import { deleteComment } from "@/lib/comments/service";

const success = await deleteComment(
  supabase,
  "comment-uuid",
  "user-uuid" // Must match comment owner
);
```

### Get Comment Count

```typescript
import { getCommentCount } from "@/lib/comments/service";

const count = await getCommentCount(
  supabase,
  "chapter",
  "chapter-uuid"
);
```

## API Pattern

Comments follow a RESTful API pattern with query parameters for entity filtering:

### Endpoints

```
GET    /api/comments?entityType=chapter&entityId=xxx     List comments
POST   /api/comments                                     Create comment
GET    /api/comments/[id]                                Get single comment
PATCH  /api/comments/[id]                                Update comment
DELETE /api/comments/[id]                                Delete comment
```

### Request/Response Examples

**Create Comment:**
```typescript
POST /api/comments
{
  "entityType": "chapter",
  "entityId": "chapter-uuid",
  "content": "Great work!"
}

Response: {
  "data": {
    "id": "comment-uuid",
    "user_id": "user-uuid",
    "entity_type": "chapter",
    "entity_id": "chapter-uuid",
    "content": "Great work!",
    "created_at": "2024-03-18T...",
    "updated_at": "2024-03-18T...",
    "user": {
      "id": "user-uuid",
      "display_name": "John Doe",
      "email": "john@example.com",
      "avatar_url": null
    }
  }
}
```

**List Comments:**
```typescript
GET /api/comments?entityType=chapter&entityId=xxx&limit=20&offset=0

Response: {
  "data": [
    // Array of CommentWithUser objects
  ],
  "total": 42
}
```

## Permissions & Security

### Row Level Security (RLS)

Comments use Supabase RLS policies:

```sql
-- Anyone can view comments on entities they have access to
CREATE POLICY "Users can view comments"
  ON ews_comments FOR SELECT
  USING (true); -- Further filtering in application layer

-- Users can create comments
CREATE POLICY "Users can create comments"
  ON ews_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON ews_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON ews_comments FOR DELETE
  USING (auth.uid() = user_id);
```

### Application-Level Permissions

Before returning comments via API:
1. Verify user has access to the parent entity
2. Check project membership
3. Filter comments based on user's access level

Example:
```typescript
// In API route
const chapter = await getChapter(entityId);
const hasAccess = await verifyProjectAccess(
  supabase,
  userId,
  chapter.project_id
);

if (!hasAccess) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Now fetch comments
const comments = await fetchComments(supabase, { entityType, entityId });
```

## UI Component Patterns

### Comments List Component

```typescript
interface CommentsListProps {
  entityType: CommentableEntityType;
  entityId: string;
}

function CommentsList({ entityType, entityId }: CommentsListProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);

  useEffect(() => {
    async function loadComments() {
      const res = await fetch(
        `/api/comments?entityType=${entityType}&entityId=${entityId}`
      );
      const { data } = await res.json();
      setComments(data);
    }
    loadComments();
  }, [entityType, entityId]);

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
```

### Reusable Across Entities

The same component works for any entity:

```typescript
// Chapter page
<CommentsList entityType="chapter" entityId={chapterId} />

// Song page
<CommentsList entityType="song" entityId={songId} />

// Image page
<CommentsList entityType="image" entityId={imageId} />
```

## Future Enhancements

### Threaded Comments

To support comment threads (replies):

1. Add `parent_comment_id` column:
```sql
ALTER TABLE ews_comments
ADD COLUMN parent_comment_id UUID REFERENCES ews_comments(id) ON DELETE CASCADE;
```

2. Update types:
```typescript
interface Comment {
  // ... existing fields
  parent_comment_id?: string | null;
  replies?: Comment[];
}
```

3. Recursive query for thread structure

### Comment Reactions

Add a separate reactions table:

```sql
CREATE TABLE ews_comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES ews_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'thinking')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction_type)
);
```

### Comment Mentions

Parse comment content for @mentions and notify mentioned users.

### Comment Editing History

Track edit history similar to chapter revisions.

## Best Practices

1. **Always validate entity access** before showing/creating comments
2. **Use type guards** to ensure entity_type is valid
3. **Sanitize comment content** to prevent XSS attacks
4. **Implement rate limiting** to prevent comment spam
5. **Use optimistic UI updates** for better UX
6. **Cache comment counts** for performance
7. **Index strategically** - composite index on (entity_type, entity_id) is critical

## Performance Considerations

- Comments are indexed by entity for fast retrieval
- Limit default comment fetches to 50 per page
- Consider pagination for entities with many comments
- Cache comment counts in Redis for high-traffic entities
- Use database-level triggers for automatic updated_at timestamps
