import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/api/helpers";

/**
 * GET /api/dashboard/stats
 * Returns aggregate counts for dashboard widgets:
 * - Total counts by entity type (chapters, songs, images, characters, etc.)
 * - Chapter status breakdown
 * - Activity counts (recent edits)
 */
export async function GET() {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  try {
    // Get projects the user is a member of
    const { data: memberships } = await supabase
      .from("ews_project_members")
      .select("project_id")
      .eq("user_id", user!.id);

    const projectIds = memberships?.map((m) => m.project_id) ?? [];

    if (projectIds.length === 0) {
      return NextResponse.json({
        chapters: { total: 0, byStatus: {}, completionPercent: 0, completedCount: 0 },
        songs: { total: 0 },
        images: { total: 0 },
        characters: { total: 0 },
        themes: { total: 0 },
        notes: { total: 0 },
        conversations: { total: 0 },
        linkedAssets: { themeLinks: 0, characterLinks: 0, conversationLinks: 0 },
      });
    }

    // Fetch counts in parallel
    const [
      chaptersResult,
      songsResult,
      imagesResult,
      charactersResult,
      themesResult,
      notesResult,
      conversationsResult,
      linkedThemesResult,
      linkedCharactersResult,
      linkedConversationsResult,
    ] = await Promise.all([
      // Chapters with status breakdown
      supabase
        .from("ews_chapters")
        .select("status")
        .in("project_id", projectIds),

      // Songs count
      supabase
        .from("ews_songs")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds),

      // Images count
      supabase
        .from("ews_images")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds),

      // Characters count
      supabase
        .from("ews_characters")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds),

      // Themes count
      supabase
        .from("ews_themes")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds),

      // Notes count
      supabase
        .from("ews_notes")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds),

      // Conversations count
      supabase
        .from("ews_conversations")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds),

      // Linked asset counts
      supabase
        .from("ews_chapter_themes")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("ews_chapter_characters")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("ews_chapter_conversations")
        .select("id", { count: "exact", head: true }),
    ]);

    // Process chapter status breakdown
    const chaptersByStatus: Record<string, number> = {};
    let chaptersTotal = 0;
    if (chaptersResult.data) {
      chaptersTotal = chaptersResult.data.length;
      chaptersResult.data.forEach((ch) => {
        const status = ch.status || "unknown";
        chaptersByStatus[status] = (chaptersByStatus[status] || 0) + 1;
      });
    }

    // Compute completion percentage
    const completedCount =
      (chaptersByStatus["complete"] || 0) +
      (chaptersByStatus["published"] || 0);
    const completionPercent =
      chaptersTotal > 0 ? Math.round((completedCount / chaptersTotal) * 100) : 0;

    return NextResponse.json({
      chapters: {
        total: chaptersTotal,
        byStatus: chaptersByStatus,
        completionPercent,
        completedCount,
      },
      songs: {
        total: songsResult.count ?? 0,
      },
      images: {
        total: imagesResult.count ?? 0,
      },
      characters: {
        total: charactersResult.count ?? 0,
      },
      themes: {
        total: themesResult.count ?? 0,
      },
      notes: {
        total: notesResult.count ?? 0,
      },
      conversations: {
        total: conversationsResult.count ?? 0,
      },
      linkedAssets: {
        themeLinks: linkedThemesResult.count ?? 0,
        characterLinks: linkedCharactersResult.count ?? 0,
        conversationLinks: linkedConversationsResult.count ?? 0,
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
