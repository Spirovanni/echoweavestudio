import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { SettingsView } from "./settings-view";
import type { Profile } from "@/lib/types";
import type { AISettings } from "@/components/settings/ai-settings";

export default async function SettingsPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  // Fetch user profile
  const { data: profile, error } = await supabase
    .from("ews_profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (error || !profile) {
    console.error("Failed to fetch profile:", error);
    redirect("/login");
  }

  // Get projects the user is a member of
  const { data: memberships } = await supabase
    .from("ews_project_members")
    .select("project_id, ews_projects!inner(id, title)")
    .eq("user_id", user.id);

  const projects = memberships?.map((m: any) => ({
    id: m.project_id,
    title: m.ews_projects.title,
  })) ?? [];

  // Get project data and settings for the first project (if available)
  let aiSettings: AISettings = {};
  let project = null;
  let projectMembers: any[] = [];
  let projectSettings = null;
  const defaultProjectId = projects[0]?.id ?? null;

  if (defaultProjectId) {
    // Fetch project
    const { data: projectData } = await supabase
      .from("ews_projects")
      .select("*")
      .eq("id", defaultProjectId)
      .single();

    project = projectData;

    // Fetch project settings
    const { data: settingsData } = await supabase
      .from("ews_project_settings")
      .select("*")
      .eq("project_id", defaultProjectId)
      .single();

    projectSettings = settingsData;
    aiSettings = settingsData?.settings?.ai || {};

    // Fetch project members
    const { data: members } = await supabase
      .from("ews_project_members")
      .select(`
        user_id,
        role,
        joined_at,
        ews_profiles!inner(id, display_name, email, avatar_url)
      `)
      .eq("project_id", defaultProjectId)
      .order("joined_at", { ascending: true });

    projectMembers = members?.map((m: any) => ({
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      profile: Array.isArray(m.ews_profiles) ? m.ews_profiles[0] : m.ews_profiles,
    })) ?? [];
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <SettingsView
        profile={profile}
        projectId={defaultProjectId}
        project={project}
        projectMembers={projectMembers}
        projectSettings={projectSettings}
        aiSettings={aiSettings}
      />
    </div>
  );
}
