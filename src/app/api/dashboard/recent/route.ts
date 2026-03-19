import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/api/helpers";

type RecentActivity = {
  id: string;
  type: "chapter" | "song" | "image" | "character" | "theme" | "note" | "conversation";
  title: string;
  updated_at: string;
};

/**
 * GET /api/dashboard/recent
 * Returns recently updated items across all entity types
 * Query params:
 * - limit: number of items to return (default: 20, max: 50)
 */
export async function GET(request: Request) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "20"),
    50
  );

  try {
    // Get projects the user is a member of
    const { data: memberships } = await supabase
      .from("ews_project_members")
      .select("project_id")
      .eq("user_id", user!.id);

    const projectIds = memberships?.map((m) => m.project_id) ?? [];

    if (projectIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch recent items from each table in parallel
    const [
      chapters,
      songs,
      images,
      characters,
      themes,
      notes,
      conversations,
    ] = await Promise.all([
      supabase
        .from("ews_chapters")
        .select("id, title, updated_at")
        .in("project_id", projectIds)
        .order("updated_at", { ascending: false })
        .limit(limit),

      supabase
        .from("ews_songs")
        .select("id, title, updated_at")
        .in("project_id", projectIds)
        .order("updated_at", { ascending: false })
        .limit(limit),

      supabase
        .from("ews_images")
        .select("id, title, updated_at")
        .in("project_id", projectIds)
        .order("updated_at", { ascending: false })
        .limit(limit),

      supabase
        .from("ews_characters")
        .select("id, name, updated_at")
        .in("project_id", projectIds)
        .order("updated_at", { ascending: false })
        .limit(limit),

      supabase
        .from("ews_themes")
        .select("id, name, updated_at")
        .in("project_id", projectIds)
        .order("updated_at", { ascending: false })
        .limit(limit),

      supabase
        .from("ews_notes")
        .select("id, title, updated_at")
        .in("project_id", projectIds)
        .order("updated_at", { ascending: false })
        .limit(limit),

      supabase
        .from("ews_conversations")
        .select("id, title, updated_at")
        .in("project_id", projectIds)
        .order("updated_at", { ascending: false })
        .limit(limit),
    ]);

    // Combine and normalize all results
    const allItems: RecentActivity[] = [
      ...(chapters.data?.map((c) => ({
        id: c.id,
        type: "chapter" as const,
        title: c.title,
        updated_at: c.updated_at,
      })) ?? []),
      ...(songs.data?.map((s) => ({
        id: s.id,
        type: "song" as const,
        title: s.title,
        updated_at: s.updated_at,
      })) ?? []),
      ...(images.data?.map((i) => ({
        id: i.id,
        type: "image" as const,
        title: i.title,
        updated_at: i.updated_at,
      })) ?? []),
      ...(characters.data?.map((c) => ({
        id: c.id,
        type: "character" as const,
        title: c.name,
        updated_at: c.updated_at,
      })) ?? []),
      ...(themes.data?.map((t) => ({
        id: t.id,
        type: "theme" as const,
        title: t.name,
        updated_at: t.updated_at,
      })) ?? []),
      ...(notes.data?.map((n) => ({
        id: n.id,
        type: "note" as const,
        title: n.title,
        updated_at: n.updated_at,
      })) ?? []),
      ...(conversations.data?.map((c) => ({
        id: c.id,
        type: "conversation" as const,
        title: c.title,
        updated_at: c.updated_at,
      })) ?? []),
    ];

    // Sort by updated_at descending and limit
    allItems.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const recentItems = allItems.slice(0, limit);

    return NextResponse.json({ data: recentItems });
  } catch (err) {
    console.error("Dashboard recent activity error:", err);
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 }
    );
  }
}
