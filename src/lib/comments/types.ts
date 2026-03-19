/**
 * Comment System Types
 *
 * Polymorphic comment architecture supporting multiple entity types.
 * Uses entity_type + entity_id pattern for flexible commenting on any entity.
 */

/**
 * Supported entity types for comments
 */
export type CommentableEntityType =
  | "chapter"
  | "song"
  | "image"
  | "character"
  | "theme"
  | "note"
  | "conversation";

/**
 * Comment record from database
 */
export interface Comment {
  id: string;
  user_id: string;
  entity_type: CommentableEntityType;
  entity_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * Comment with user profile information
 */
export interface CommentWithUser extends Comment {
  user: {
    id: string;
    display_name: string;
    email: string;
    avatar_url?: string | null;
  };
}

/**
 * Parameters for creating a comment
 */
export interface CreateCommentParams {
  entityType: CommentableEntityType;
  entityId: string;
  content: string;
  userId: string;
}

/**
 * Parameters for updating a comment
 */
export interface UpdateCommentParams {
  commentId: string;
  content: string;
  userId: string; // For permission check
}

/**
 * Parameters for fetching comments
 */
export interface FetchCommentsParams {
  entityType: CommentableEntityType;
  entityId: string;
  limit?: number;
  offset?: number;
  sortOrder?: "asc" | "desc";
}

/**
 * Generic comment reference for type-safe entity association
 */
export interface CommentReference<T extends CommentableEntityType = CommentableEntityType> {
  entityType: T;
  entityId: string;
}

/**
 * Type guards for entity types
 */
export function isCommentableEntity(type: string): type is CommentableEntityType {
  return [
    "chapter",
    "song",
    "image",
    "character",
    "theme",
    "note",
    "conversation",
  ].includes(type);
}
