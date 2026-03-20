import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, PlayCircle, BookOpen } from "lucide-react";

export const metadata = {
  title: "Book Release — Echo Weave Studio",
  description: "Read the latest published book and sample its soundtrack.",
};

export default async function PublicBookPage() {
  const supabase = await createClient();

  // 1. Find the first published project
  const { data: projectSettings } = await supabase
    .from("ews_project_settings")
    .select("project_id, settings")
    .eq("publishing_enabled", true)
    .limit(1)
    .single();

  if (!projectSettings) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Coming Soon</h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          There are currently no published books available. Check back later for releases.
        </p>
        <Link href="/public" className="mt-8">
          <Button variant="outline">Back to Public Directory</Button>
        </Link>
      </div>
    );
  }

  const projectId = projectSettings.project_id;
  const settings = (projectSettings.settings as Record<string, unknown>) || {};
  const coverImageUrl = settings.coverImageUrl as string | undefined;

  // 2. Fetch project details
  const { data: project } = await supabase
    .from("ews_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  // 3. Fetch authors
  const { data: members } = await supabase
    .from("ews_project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("role", "author");

  const authorIds = members?.map((m) => m.user_id) || [];
  let authors: { id: string; display_name: string; avatar_url: string | null }[] = [];
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("ews_profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds);
    authors = profiles || [];
  }

  // 4. Fetch sample chapters
  const { data: chapters } = await supabase
    .from("ews_chapters")
    .select("id, title, summary, order_index")
    .eq("project_id", projectId)
    .eq("status", "published")
    .order("order_index", { ascending: true })
    .limit(5);

  // 5. Fetch songs/soundtracks
  const { data: songs } = await supabase
    .from("ews_songs")
    .select("id, title, mood, audio_url")
    .eq("project_id", projectId)
    .limit(10);

  return (
    <div className="mx-auto max-w-5xl space-y-16 pb-16">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row gap-10 items-center md:items-start pt-8">
        <div className="w-full md:w-1/3 shrink-0 flex justify-center">
          {coverImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={coverImageUrl} 
              alt={`${project.title} Cover`}
              className="rounded-xl shadow-2xl object-cover aspect-[2/3] w-full max-w-sm"
            />
          ) : (
            <div className="bg-muted rounded-xl shadow-lg aspect-[2/3] w-full max-w-sm flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50">
              <BookOpen className="h-16 w-16 mb-4 opacity-50" />
              <span>No Cover Image</span>
            </div>
          )}
        </div>
        
        <div className="space-y-6 flex-1 text-center md:text-left">
          <Badge variant="secondary" className="mb-2">New Release</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            {project.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            {authors.map((author) => (
              <div key={author.id} className="flex items-center gap-2">
                {author.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={author.avatar_url} alt={author.display_name} className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {author.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-muted-foreground">{author.display_name}</span>
              </div>
            ))}
          </div>
          
          <div className="prose prose-sm sm:prose-base dark:prose-invert text-muted-foreground line-clamp-6">
            {project.description || "A new masterpiece from Echo Weave Studio."}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center md:justify-start">
            <Button size="lg" className="w-full sm:w-auto font-semibold shadow-lg">
              Pre-order / Purchase
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Subscribe for Updates
            </Button>
          </div>
        </div>
      </section>

      {/* Sample Chapters */}
      <section className="space-y-6 border-t border-border/50 pt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Sample Chapters</h2>
          <Badge variant="outline">{chapters?.length || 0} Available</Badge>
        </div>
        
        {!chapters || chapters.length === 0 ? (
          <p className="text-muted-foreground bg-muted/30 p-8 rounded-lg text-center border border-border/50">
            No sample chapters are available yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/public/chapters/${chapter.id}`}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 transition-all hover:bg-muted/50 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Chapter {chapter.order_index + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {chapter.title}
                  </h3>
                  {chapter.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {chapter.summary}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center text-sm font-medium text-primary">
                  Read chapter <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Official Soundtrack */}
      {songs && songs.length > 0 && (
        <section className="space-y-6 border-t border-border/50 pt-10">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Official Soundtrack</h2>
          </div>
          
          <div className="space-y-3">
            {songs.map((song) => (
              <div 
                key={song.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-4">
                  <PlayCircle className="h-8 w-8 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                  <div>
                    <h4 className="font-semibold">{song.title}</h4>
                    {song.mood && (
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                        {song.mood}
                      </p>
                    )}
                  </div>
                </div>
                {song.audio_url && (
                  <Button variant="ghost" size="sm" className="hidden sm:flex">
                    Listen Now
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
