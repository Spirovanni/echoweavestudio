"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Users, Settings as SettingsIcon, Info } from "lucide-react";

interface ProjectMember {
  userId: string;
  role: string;
  joinedAt: string;
  profile: {
    id: string;
    display_name: string;
    email: string;
    avatar_url?: string | null;
  };
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectSettings {
  adult_module_enabled: boolean;
  publishing_enabled: boolean;
  ai_enabled: boolean;
  collaboration_enabled: boolean;
}

interface ProjectSettingsProps {
  projectId: string;
  initialProject: Project;
  initialMembers: ProjectMember[];
  initialSettings: ProjectSettings;
}

export function ProjectSettingsComponent({
  projectId,
  initialProject,
  initialMembers,
  initialSettings,
}: ProjectSettingsProps) {
  const [title, setTitle] = useState(initialProject.title);
  const [description, setDescription] = useState(initialProject.description || "");
  const [adultModuleEnabled, setAdultModuleEnabled] = useState(initialSettings.adult_module_enabled);
  const [publishingEnabled, setPublishingEnabled] = useState(initialSettings.publishing_enabled);
  const [aiEnabled, setAiEnabled] = useState(initialSettings.ai_enabled);
  const [collaborationEnabled, setCollaborationEnabled] = useState(initialSettings.collaboration_enabled);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasMetadataChanges =
    title !== initialProject.title ||
    description !== (initialProject.description || "");

  const hasSettingsChanges =
    adultModuleEnabled !== initialSettings.adult_module_enabled ||
    publishingEnabled !== initialSettings.publishing_enabled ||
    aiEnabled !== initialSettings.ai_enabled ||
    collaborationEnabled !== initialSettings.collaboration_enabled;

  const hasChanges = hasMetadataChanges || hasSettingsChanges;

  const handleSave = async () => {
    if (!hasChanges) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Update project metadata if changed
      if (hasMetadataChanges) {
        const metadataRes = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
          }),
        });

        if (!metadataRes.ok) {
          const { error: errorMsg } = await metadataRes.json();
          throw new Error(errorMsg || "Failed to update project metadata");
        }
      }

      // Update project settings if changed
      if (hasSettingsChanges) {
        const settingsRes = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            adult_module_enabled: adultModuleEnabled,
            publishing_enabled: publishingEnabled,
            ai_enabled: aiEnabled,
            collaboration_enabled: collaborationEnabled,
          }),
        });

        if (!settingsRes.ok) {
          const { error: errorMsg } = await settingsRes.json();
          throw new Error(errorMsg || "Failed to update project settings");
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTitle(initialProject.title);
    setDescription(initialProject.description || "");
    setAdultModuleEnabled(initialSettings.adult_module_enabled);
    setPublishingEnabled(initialSettings.publishing_enabled);
    setAiEnabled(initialSettings.ai_enabled);
    setCollaborationEnabled(initialSettings.collaboration_enabled);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Project Metadata */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="size-5 text-primary" />
            <CardTitle>Project Information</CardTitle>
          </div>
          <CardDescription>
            Update project title, description, and basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Creative Project"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              The name of your project, visible to all members
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your project (optional)"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              Optional project description visible to members
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-2 text-sm font-medium">Project Details</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Created: <span className="font-medium text-foreground">
                {new Date(initialProject.created_at).toLocaleDateString()}
              </span></p>
              <p>Last Updated: <span className="font-medium text-foreground">
                {new Date(initialProject.updated_at).toLocaleDateString()}
              </span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Features */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="size-5 text-primary" />
            <CardTitle>Feature Settings</CardTitle>
          </div>
          <CardDescription>
            Enable or disable project-level features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium">AI Tools</p>
              <p className="text-xs text-muted-foreground">
                Enable AI-powered writing assistance and generation
              </p>
            </div>
            <Switch
              checked={aiEnabled}
              onCheckedChange={setAiEnabled}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Collaboration</p>
              <p className="text-xs text-muted-foreground">
                Allow multiple authors to work together
              </p>
            </div>
            <Switch
              checked={collaborationEnabled}
              onCheckedChange={setCollaborationEnabled}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Publishing</p>
              <p className="text-xs text-muted-foreground">
                Enable export and publishing features
              </p>
            </div>
            <Switch
              checked={publishingEnabled}
              onCheckedChange={setPublishingEnabled}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Adult Content Module</p>
              <p className="text-xs text-muted-foreground">
                Enable mature/adult content features
              </p>
            </div>
            <Switch
              checked={adultModuleEnabled}
              onCheckedChange={setAdultModuleEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Project Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <CardTitle>Project Members</CardTitle>
          </div>
          <CardDescription>
            View and manage project collaborators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {initialMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{member.profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">{member.profile.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium capitalize">{member.role}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
          Project settings updated successfully!
        </div>
      )}

      {/* Save Button */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 size-4" />
              Save Project Settings
            </>
          )}
        </Button>
        {hasChanges && (
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
