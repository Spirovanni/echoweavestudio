import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient } from "@/lib/api/helpers";
import { deleteComment } from "@/lib/comments/service";

/**
 * DELETE /api/comments/[id]
 * Delete a comment. Only the comment author can delete their own comment.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  // Verify comment exists and user is the author
  const { data: existing, error: fetchError } = await supabase!
    .from("ews_comments")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // Verify user is the comment author
  if (existing.user_id !== user!.id) {
    return NextResponse.json(
      { error: "You can only delete your own comments" },
      { status: 403 }
    );
  }

  // Delete comment
  const success = await deleteComment(supabase!, id, user!.id);

  if (!success) {
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
