"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Music,
  ImageIcon,
  Users,
  Palette,
  StickyNote,
  MessageSquare,
  Loader2,
  TrendingUp,
  LinkIcon,
  CheckCircle2,
} from "lucide-react";

type DashboardStats = {
  chapters: {
    total: number;
    byStatus: Record<string, number>;
    completionPercent: number;
    completedCount: number;
  };
  songs: { total: number };
  images: { total: number };
  characters: { total: number };
  themes: { total: number };
  notes: { total: number };
  conversations: { total: number };
  linkedAssets: {
    themeLinks: number;
    characterLinks: number;
    conversationLinks: number;
  };
};

type RecentActivity = {
  id: string;
  type: string;
  title: string;
  updated_at: string;
};

const ENTITY_CONFIG = {
  chapter: { icon: BookOpen, label: "Chapter", href: "/chapters" },
  song: { icon: Music, label: "Song", href: "/songs" },
  image: { icon: ImageIcon, label: "Image", href: "/images" },
  character: { icon: Users, label: "Character", href: "/characters" },
  theme: { icon: Palette, label: "Theme", href: "/themes" },
  note: { icon: StickyNote, label: "Note", href: "/notes" },
  conversation: { icon: MessageSquare, label: "Conversation", href: "/conversations" },
};

const STATUS_ORDER = ["idea", "outline", "draft", "revision", "complete", "published"];

const STATUS_LABELS: Record<string, string> = {
  idea: "Idea",
  outline: "Outline",
  draft: "Draft",
  revision: "Revision",
  complete: "Complete",
  published: "Published",
};

const STATUS_COLORS: Record<string, string> = {
  idea: "bg-zinc-400",
  outline: "bg-amber-400",
  draft: "bg-blue-400",
  revision: "bg-violet-400",
  complete: "bg-emerald-400",
  published: "bg-green-500",
};

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, recentRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/recent?limit=10"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (recentRes.ok) {
          const recentData = await recentRes.json();
          setRecent(recentData.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const entityCounts = [
    { icon: BookOpen, label: "Chapters", count: stats?.chapters.total ?? 0, href: "/chapters" },
    { icon: Music, label: "Songs", count: stats?.songs.total ?? 0, href: "/songs" },
    { icon: ImageIcon, label: "Images", count: stats?.images.total ?? 0, href: "/images" },
    { icon: Users, label: "Characters", count: stats?.characters.total ?? 0, href: "/characters" },
    { icon: Palette, label: "Themes", count: stats?.themes.total ?? 0, href: "/themes" },
    { icon: StickyNote, label: "Notes", count: stats?.notes.total ?? 0, href: "/notes" },
    { icon: MessageSquare, label: "Conversations", count: stats?.conversations.total ?? 0, href: "/conversations" },
  ];

  const chaptersTotal = stats?.chapters.total ?? 0;
  const completionPercent = stats?.chapters.completionPercent ?? 0;
  const completedCount = stats?.chapters.completedCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {entityCounts.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Completion bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">
                  Book Completion
                </span>
                <span className="text-sm font-bold text-primary">
                  {completionPercent}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {completedCount} of {chaptersTotal} chapters complete or published
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chapter status breakdown with segmented bar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Chapter Progress</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            {chaptersTotal === 0 ? (
              <p className="text-sm text-muted-foreground">
                No chapters yet.{" "}
                <Link href="/chapters" className="text-primary underline underline-offset-4">
                  Create your first chapter
                </Link>
              </p>
            ) : (
              <div className="space-y-4">
                {/* Segmented status bar */}
                <div className="flex h-4 w-full overflow-hidden rounded-full">
                  {STATUS_ORDER.map((status) => {
                    const count = stats?.chapters.byStatus[status] ?? 0;
                    if (count === 0) return null;
                    const pct = (count / chaptersTotal) * 100;
                    return (
                      <div
                        key={status}
                        className={`${STATUS_COLORS[status]} transition-all`}
                        style={{ width: `${pct}%` }}
                        title={`${STATUS_LABELS[status]}: ${count}`}
                      />
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3">
                  {STATUS_ORDER.map((status) => {
                    const count = stats?.chapters.byStatus[status] ?? 0;
                    if (count === 0) return null;
                    return (
                      <div key={status} className="flex items-center gap-1.5">
                        <div
                          className={`size-2.5 rounded-full ${STATUS_COLORS[status]}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {STATUS_LABELS[status]} ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Per-status bars */}
                <div className="space-y-2">
                  {STATUS_ORDER.map((status) => {
                    const count = stats?.chapters.byStatus[status] ?? 0;
                    if (count === 0) return null;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {STATUS_LABELS[status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{count}</span>
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full ${STATUS_COLORS[status]}`}
                              style={{
                                width: `${(count / chaptersTotal) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column: recent activity + linked assets */}
        <div className="space-y-6">
          {/* Linked assets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="size-4" />
                Linked Assets
              </CardTitle>
              <CardDescription>Connections between chapters and entities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Palette className="size-4 text-muted-foreground" />
                    <span>Theme links</span>
                  </div>
                  <span className="font-medium">
                    {stats?.linkedAssets.themeLinks ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <span>Character links</span>
                  </div>
                  <span className="font-medium">
                    {stats?.linkedAssets.characterLinks ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-4 text-muted-foreground" />
                    <span>Conversation links</span>
                  </div>
                  <span className="font-medium">
                    {stats?.linkedAssets.conversationLinks ?? 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4" />
                Recent Activity
              </CardTitle>
              <CardDescription>Last 10 updates</CardDescription>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recent.map((item) => {
                    const config = ENTITY_CONFIG[item.type as keyof typeof ENTITY_CONFIG];
                    if (!config) return null;
                    const Icon = config.icon;

                    return (
                      <Link
                        key={`${item.type}-${item.id}`}
                        href={`${config.href}/${item.id}`}
                        className="flex items-start gap-2 text-sm transition-colors hover:text-primary"
                      >
                        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.updated_at).toLocaleDateString()} •{" "}
                            {config.label}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
