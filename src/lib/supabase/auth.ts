import { createClient } from "./server";
import { redirect } from "next/navigation";

/**
 * Get the authenticated user on the server side.
 * Returns the user object or null if not authenticated.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Require authentication — redirect to /login if no user.
 * Use in Server Components or Server Actions.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Get the user's profile from the ews_profiles table.
 */
export async function getUserProfile() {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("ews_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}
