"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContentRenderer } from "@/components/editor/ContentRenderer";
import { RevisionDiffViewer } from "./RevisionDiffViewer";
import { History, Loader2, FileText, Eye, GitCompareArrows } from "lucide-react";
import type { JSONContent } from "@tiptap/react";

interface Revision {
  id: string;
  chapterId: string;
  title: string;
  summary: string;
  createdAt: string;
  editedBy: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface RevisionWithContent extends Revision {
  content: JSONContent;
}

interface RevisionHistoryProps {
  chapterId: string;
}

export function RevisionHistory({ chapterId }: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  
  const [isComparing, setIsComparing] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  
  const [selectedRevision, setSelectedRevision] =
    useState<RevisionWithContent | null>(null);
  const [compareRevision, setCompareRevision] =
    useState<RevisionWithContent | null>(null);
  const [isLoadingRevision, setIsLoadingRevision] = useState(false);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "diff">("view");

  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchRevisions();
  }, [chapterId]);

  const fetchRevisions = async (offset = 0, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetch(
        `/api/chapters/${chapterId}/revisions?limit=${PAGE_SIZE}&offset=${offset}`
      );
      if (!res.ok) throw new Error("Failed to fetch revisions");
      const { data, total: count } = await res.json();

      if (append) {
        setRevisions((prev) => [...prev, ...(data || [])]);
      } else {
        setRevisions(data || []);
      }
      setTotal(count || 0);
      setHasMore((data || []).length === PAGE_SIZE);
    } catch (error) {
      console.error("Failed to fetch revisions:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const viewRevision = async (revision: Revision) => {
    setDialogMode("view");
    setDialogOpen(true);
    setIsLoadingRevision(true);
    setSelectedRevision(null);
    setCompareRevision(null);

    try {
      const res = await fetch(
        `/api/chapters/${chapterId}/revisions/${revision.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch revision");
      const { data } = await res.json();
      setSelectedRevision(data);
    } catch (error) {
      console.error("Failed to fetch revision:", error);
    } finally {
      setIsLoadingRevision(false);
    }
  };

  const startComparison = async () => {
    if (selectedForCompare.length !== 2) return;
    
    // determine older vs newer temporally
    const rA = revisions.find((r) => r.id === selectedForCompare[0]);
    const rB = revisions.find((r) => r.id === selectedForCompare[1]);
    if (!rA || !rB) return;

    const isANewer = new Date(rA.createdAt).getTime() > new Date(rB.createdAt).getTime();
    const newRevMeta = isANewer ? rA : rB;
    const oldRevMeta = isANewer ? rB : rA;

    setDialogMode("diff");
    setDialogOpen(true);
    setIsLoadingRevision(true);
    setSelectedRevision(null);
    setCompareRevision(null);

    try {
      const [resNew, resOld] = await Promise.all([
        fetch(`/api/chapters/${chapterId}/revisions/${newRevMeta.id}`),
        fetch(`/api/chapters/${chapterId}/revisions/${oldRevMeta.id}`)
      ]);
      if (!resNew.ok || !resOld.ok) throw new Error("Failed to fetch revisions");
      const dataNew = await resNew.json();
      const dataOld = await resOld.json();

      setSelectedRevision(dataNew.data);
      setCompareRevision(dataOld.data);
    } catch (error) {
      console.error("Failed to fetch diff revisions:", error);
    } finally {
      setIsLoadingRevision(false);
    }
  };

  const handleCheckboxChange = (revisionId: string, checked: boolean) => {
    if (checked) {
      if (selectedForCompare.length < 2) {
        setSelectedForCompare([...selectedForCompare, revisionId]);
      }
    } else {
      setSelectedForCompare(selectedForCompare.filter(id => id !== revisionId));
    }
  };

  const toggleCompareMode = () => {
    if (isComparing) {
      setIsComparing(false);
      setSelectedForCompare([]);
    } else {
      setIsComparing(true);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <History className="size-4" />
          <span>
            {total} {total === 1 ? "revision" : "revisions"}
          </span>
        </div>
        
        {total > 1 && (
          <Button 
            variant={isComparing ? "secondary" : "ghost"}
            size="sm"
            onClick={toggleCompareMode}
          >
            <GitCompareArrows className="size-4 mr-2" />
            {isComparing ? "Cancel Compare" : "Compare"}
          </Button>
        )}
      </div>

      {isComparing && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <span className="text-sm font-medium">
            Select two revisions to compare ({selectedForCompare.length}/2)
          </span>
          <Button 
            size="sm" 
            disabled={selectedForCompare.length !== 2}
            onClick={startComparison}
          >
            Compare Selected
          </Button>
        </div>
      )}

      {revisions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <History className="mx-auto mb-2 size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No revisions yet. Revisions are created automatically when you save
            changes.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {revisions.map((revision, index) => {
              const isChecked = selectedForCompare.includes(revision.id);
              return (
                <div
                  key={revision.id}
                  className={`group flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    isChecked 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  {isComparing && (
                    <Checkbox 
                      className="mr-2"
                      checked={isChecked}
                      disabled={!isChecked && selectedForCompare.length >= 2}
                      onCheckedChange={(checked) => handleCheckboxChange(revision.id, checked === true)}
                    />
                  )}

                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    v{total - (revisions.indexOf(revision))}
                  </div>

                  <Avatar className="size-6 shrink-0">
                    <AvatarImage
                      src={revision.editedBy.avatarUrl || undefined}
                      alt={revision.editedBy.displayName}
                    />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(revision.editedBy.displayName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {revision.editedBy.displayName}
                      </span>
                      {revision.summary && (
                        <span className="text-xs text-muted-foreground truncate">
                          — {revision.summary}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(revision.createdAt)}
                    </p>
                  </div>

                  {!isComparing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => viewRevision(revision)}
                    >
                      <Eye className="mr-1 size-3.5" />
                      View
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRevisions(revisions.length, true)}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Revision content dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[1000px] max-h-[85vh] flex flex-col pt-10">
          <DialogHeader className="shrink-0 mb-4">
            <DialogTitle className="flex items-center gap-2">
              {dialogMode === "diff" ? (
                <>
                   <GitCompareArrows className="size-5" />
                   Revision Comparison
                </>
              ) : (
                <>
                  <FileText className="size-5" />
                  {selectedRevision?.title || "Revision"}
                </>
              )}
            </DialogTitle>
            {dialogMode === "view" && selectedRevision && (
              <DialogDescription>
                Saved by {selectedRevision.editedBy.displayName} on{" "}
                {formatTimestamp(selectedRevision.createdAt)}
              </DialogDescription>
            )}
             {dialogMode === "diff" && selectedRevision && compareRevision && (
              <DialogDescription>
                Comparing v{total - revisions.findIndex(r => r.id === compareRevision.id)} with v{total - revisions.findIndex(r => r.id === selectedRevision.id)}
              </DialogDescription>
             )}
          </DialogHeader>

          {isLoadingRevision ? (
            <div className="flex items-center justify-center py-12 flex-1">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : dialogMode === "diff" && selectedRevision && compareRevision ? (
            <ScrollArea className="flex-1 pr-4 min-h-0">
               <RevisionDiffViewer 
                 oldContent={compareRevision.content as Record<string, unknown>} 
                 newContent={selectedRevision.content as Record<string, unknown>}
                 oldTitle={`v${total - revisions.findIndex(r => r.id === compareRevision.id)} (${formatTimestamp(compareRevision.createdAt)})`}
                 newTitle={`v${total - revisions.findIndex(r => r.id === selectedRevision.id)} (${formatTimestamp(selectedRevision.createdAt)})`}
                 onRestore={() => {
                   // mock restore action
                   console.log("Mock restoring to revision:", selectedRevision.id);
                   alert("Restore functionality coming soon. Check back later.");
                 }}
               />
            </ScrollArea>
          ) : selectedRevision?.content ? (
            <ScrollArea className="flex-1 pr-4 min-h-0">
              <ContentRenderer
                content={selectedRevision.content as JSONContent}
              />
            </ScrollArea>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No content.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
