/**
 * Comment Service
 *
 * Service layer for comment CRUD operations with polymorphic entity support.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Comment,
  CommentWithUser,
  CreateCommentParams,
  UpdateCommentParams,
  FetchCommentsParams,
} from "./types";

/**
 * Create a new comment
 *
 * @param supabase - Supabase client
 * @param params - Comment creation parameters
 * @returns The created comment with user info, or null if creation failed
 */
export async function createComment(
  supabase: SupabaseClient,
  params: CreateCommentParams
): Promise<CommentWithUser | null> {
  const { entityType, entityId, content, userId } = params;

  try {
    const { data, error } = await supabase
      .from("ews_comments")
      .insert({
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        content,
      })
      .select(`
        id,
        user_id,
        entity_type,
        entity_id,
        content,
        created_at,
        updated_at,
        ews_profiles!inner(id, display_name, email, avatar_url)
      `)
      .single();

    if (error || !data) {
      console.error("Failed to create comment:", error);
      return null;
    }

    return transformCommentWithUser(data);
  } catch (error) {
    console.error("Unexpected error creating comment:", error);
    return null;
  }
}

/**
 * Fetch comments for an entity
 *
 * @param supabase - Supabase client
 * @param params - Fetch parameters
 * @returns Array of comments with user info
 */
export async function fetchComments(
  supabase: SupabaseClient,
  params: FetchCommentsParams
): Promise<CommentWithUser[]> {
  const {
    entityType,
    entityId,
    limit = 50,
    offset = 0,
    sortOrder = "asc",
  } = params;

  try {
    const { data, error } = await supabase
      .from("ews_comments")
      .select(`
        id,
        user_id,
        entity_type,
        entity_id,
        content,
        created_at,
        updated_at,
        ews_profiles!inner(id, display_name, email, avatar_url)
      `)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Failed to fetch comments:", error);
      return [];
    }

    return (data || []).map(transformCommentWithUser);
  } catch (error) {
    console.error("Unexpected error fetching comments:", error);
    return [];
  }
}

/**
 * Fetch a single comment by ID
 *
 * @param supabase - Supabase client
 * @param commentId - Comment ID
 * @returns Comment with user info, or null if not found
 */
export async function fetchCommentById(
  supabase: SupabaseClient,
  commentId: string
): Promise<CommentWithUser | null> {
  try {
    const { data, error } = await supabase
      .from("ews_comments")
      .select(`
        id,
        user_id,
        entity_type,
        entity_id,
        content,
        created_at,
        updated_at,
        ews_profiles!inner(id, display_name, email, avatar_url)
      `)
      .eq("id", commentId)
      .single();

    if (error || !data) {
      console.error("Failed to fetch comment:", error);
      return null;
    }

    return transformCommentWithUser(data);
  } catch (error) {
    console.error("Unexpected error fetching comment:", error);
    return null;
  }
}

/**
 * Update a comment
 *
 * @param supabase - Supabase client
 * @param params - Update parameters
 * @returns Updated comment with user info, or null if update failed
 */
export async function updateComment(
  supabase: SupabaseClient,
  params: UpdateCommentParams
): Promise<CommentWithUser | null> {
  const { commentId, content, userId } = params;

  try {
    // Verify ownership
    const { data: existing } = await supabase
      .from("ews_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!existing || existing.user_id !== userId) {
      console.error("User does not own this comment");
      return null;
    }

    const { data, error } = await supabase
      .from("ews_comments")
      .update({ content })
      .eq("id", commentId)
      .select(`
        id,
        user_id,
        entity_type,
        entity_id,
        content,
        created_at,
        updated_at,
        ews_profiles!inner(id, display_name, email, avatar_url)
      `)
      .single();

    if (error || !data) {
      console.error("Failed to update comment:", error);
      return null;
    }

    return transformCommentWithUser(data);
  } catch (error) {
    console.error("Unexpected error updating comment:", error);
    return null;
  }
}

/**
 * Delete a comment
 *
 * @param supabase - Supabase client
 * @param commentId - Comment ID
 * @param userId - User ID for permission check
 * @returns true if deleted successfully
 */
export async function deleteComment(
  supabase: SupabaseClient,
  commentId: string,
  userId: string
): Promise<boolean> {
  try {
    // Verify ownership
    const { data: existing } = await supabase
      .from("ews_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!existing || existing.user_id !== userId) {
      console.error("User does not own this comment");
      return false;
    }

    const { error } = await supabase
      .from("ews_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Failed to delete comment:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error deleting comment:", error);
    return false;
  }
}

/**
 * Get comment count for an entity
 *
 * @param supabase - Supabase client
 * @param entityType - Entity type
 * @param entityId - Entity ID
 * @returns Number of comments
 */
export async function getCommentCount(
  supabase: SupabaseClient,
  entityType: string,
  entityId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("ews_comments")
      .select("id", { count: "exact", head: true })
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);

    if (error) {
      console.error("Failed to get comment count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Unexpected error getting comment count:", error);
    return 0;
  }
}

/**
 * Transform raw comment data to CommentWithUser
 */
function transformCommentWithUser(data: any): CommentWithUser {
  const userProfile = Array.isArray(data.ews_profiles)
    ? data.ews_profiles[0]
    : data.ews_profiles;

  return {
    id: data.id,
    user_id: data.user_id,
    entity_type: data.entity_type,
    entity_id: data.entity_id,
    content: data.content,
    created_at: data.created_at,
    updated_at: data.updated_at,
    user: {
      id: userProfile.id,
      display_name: userProfile.display_name,
      email: userProfile.email,
      avatar_url: userProfile.avatar_url,
    },
  };
}
