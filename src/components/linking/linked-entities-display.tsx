"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Loader2, Music, ImageIcon, MessageSquare, Users as UsersIcon, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { LinkableEntityType, EntityLink } from "@/lib/types";

interface LinkedEntitiesDisplayProps {
  chapterId: string;
  entityType: LinkableEntityType;
  editable?: boolean; // Show remove buttons
  className?: string;
  onUnlink?: (entityId: string) => void;
}

const ENTITY_CONFIG: Record<LinkableEntityType, {
  icon: React.ElementType;
  label: string;
  singularLabel: string;
  pathPrefix: string;
}> = {
  song: {
    icon: Music,
    label: "Songs",
    singularLabel: "Song",
    pathPrefix: "/songs",
  },
  image: {
    icon: ImageIcon,
    label: "Images",
    singularLabel: "Image",
    pathPrefix: "/images",
  },
  conversation: {
    icon: MessageSquare,
    label: "Conversations",
    singularLabel: "Conversation",
    pathPrefix: "/conversations",
  },
  character: {
    icon: UsersIcon,
    label: "Characters",
    singularLabel: "Character",
    pathPrefix: "/characters",
  },
  theme: {
    icon: Palette,
    label: "Themes",
    singularLabel: "Theme",
    pathPrefix: "/themes",
  },
};

export function LinkedEntitiesDisplay({
  chapterId,
  entityType,
  editable = false,
  className,
  onUnlink,
}: LinkedEntitiesDisplayProps) {
  const [links, setLinks] = useState<EntityLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState<EntityLink | null>(null);

  const config = ENTITY_CONFIG[entityType];
  const Icon = config.icon;

  useEffect(() => {
    fetchLinks();
  }, [chapterId, entityType]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/links`);
      if (!res.ok) throw new Error("Failed to fetch links");

      const { data } = await res.json();

      // Filter for this entity type
      const filtered = data.filter(
        (link: EntityLink) => link.entity_type === entityType
      );

      setLinks(filtered);
    } catch (error) {
      console.error("Error fetching links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (link: EntityLink) => {
    setUnlinking(link.entity_id);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/links`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: link.entity_type,
          entityId: link.entity_id,
        }),
      });

      if (!res.ok) throw new Error("Failed to unlink entity");

      // Update local state
      setLinks((prev) => prev.filter((l) => l.entity_id !== link.entity_id));

      // Call parent callback if provided
      onUnlink?.(link.entity_id);
    } catch (error) {
      console.error("Error unlinking entity:", error);
    } finally {
      setUnlinking(null);
      setConfirmUnlink(null);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className={cn("py-8 text-center text-sm text-muted-foreground", className)}>
        <Icon className="mx-auto mb-2 size-8 opacity-50" />
        <p>No linked {config.label.toLowerCase()} yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {links.map((link) => {
          const entity = link.entity;
          const displayName = entity?.title || entity?.name || "Untitled";
          const isUnlinking = unlinking === link.entity_id;

          return (
            <div
              key={link.entity_id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:bg-accent"
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" />

              <Link
                href={`${config.pathPrefix}/${link.entity_id}`}
                className="flex-1 truncate text-sm font-medium hover:underline"
              >
                {displayName}
              </Link>

              {editable && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setConfirmUnlink(link)}
                  disabled={isUnlinking}
                  className="shrink-0"
                >
                  {isUnlinking ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <X className="size-3" />
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Unlink confirmation dialog */}
      <AlertDialog
        open={!!confirmUnlink}
        onOpenChange={(open) => !open && setConfirmUnlink(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink {config.singularLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the link between this chapter and "{confirmUnlink?.entity?.title || confirmUnlink?.entity?.name || "this entity"}".
              The {config.singularLabel.toLowerCase()} itself will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmUnlink && handleUnlink(confirmUnlink)}
            >
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
