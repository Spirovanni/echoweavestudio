import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Get an authenticated Supabase client for API routes.
 * Returns the client and user, or a 401 response if not authenticated.
 */
export async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase: null,
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { supabase, user, error: null };
}

/**
 * Verify the user is a member of the given project.
 */
export async function verifyProjectAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string
) {
  const { data } = await supabase
    .from("ews_project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  return !!data;
}
