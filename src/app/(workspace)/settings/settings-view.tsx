"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { User, LogOut, Save, Loader2, Sparkles, FolderOpen } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AISettingsComponent, type AISettings } from "@/components/settings/ai-settings";
import { ProjectSettingsComponent } from "@/components/settings/project-settings";
import type { Profile } from "@/lib/types";

interface SettingsViewProps {
  profile: Profile;
  projectId: string | null;
  project: any;
  projectMembers: any[];
  projectSettings: any;
  aiSettings: AISettings;
}

export function SettingsView({ profile, projectId, project, projectMembers, projectSettings, aiSettings }: SettingsViewProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges =
    displayName !== profile.display_name ||
    avatarUrl !== (profile.avatar_url || "");

  const handleSave = async () => {
    if (!hasChanges) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          avatar_url: avatarUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const { error: errorMsg } = await res.json();
        throw new Error(errorMsg || "Failed to update profile");
      }

      setSuccess(true);
      router.refresh();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDisplayName(profile.display_name);
    setAvatarUrl(profile.avatar_url || "");
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="profile">
            <User className="mr-2 size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="project" disabled={!projectId}>
            <FolderOpen className="mr-2 size-4" />
            Project
          </TabsTrigger>
          <TabsTrigger value="ai" disabled={!projectId}>
            <Sparkles className="mr-2 size-4" />
            AI
          </TabsTrigger>
        </TabsList>

        {/* Profile & Account Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Profile Section */}
          <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="size-5 text-primary" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>
            Update your personal information and how others see you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              This is how your name will appear to collaborators
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Provide a URL to your profile picture
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
              Profile updated successfully!
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Save Changes
                </>
              )}
            </Button>
            {hasChanges && (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <LogOut className="size-5 text-primary" />
            <CardTitle>Account</CardTitle>
          </div>
          <CardDescription>
            Manage your account and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-xs text-muted-foreground">
                Sign out of your Echo Weave Studio account
              </p>
            </div>
            <SignOutButton />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-2 text-sm font-medium">Account Information</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Role: <span className="font-medium text-foreground">{profile.role}</span></p>
              <p>Member since: <span className="font-medium text-foreground">
                {new Date(profile.created_at).toLocaleDateString()}
              </span></p>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Project Settings Tab */}
        <TabsContent value="project" className="space-y-6">
          {projectId && project && projectSettings ? (
            <ProjectSettingsComponent
              projectId={projectId}
              initialProject={project}
              initialMembers={projectMembers}
              initialSettings={projectSettings}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  No project selected. Join or create a project to manage project settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Settings Tab */}
        <TabsContent value="ai" className="space-y-6">
          {projectId ? (
            <AISettingsComponent projectId={projectId} initialSettings={aiSettings} />
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  No project selected. Join or create a project to configure AI settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
