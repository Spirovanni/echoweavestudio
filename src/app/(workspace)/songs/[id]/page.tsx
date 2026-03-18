import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil, Music, ExternalLink } from "lucide-react";
import type { Song } from "@/lib/types";

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const supabase = await createClient();

  const { data: song } = await supabase
    .from("ews_songs")
    .select("*")
    .eq("id", id)
    .single<Song>();

  if (!song) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Song not found</p>
        <Link href="/songs">
          <Button variant="outline">Back to Songs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/songs">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Music className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {song.title}
            </h1>
            {song.mood && (
              <Badge variant="outline" className="mt-1">
                {song.mood}
              </Badge>
            )}
          </div>
        </div>
        <Link href={`/songs/${id}/edit`}>
          <Button size="sm">
            <Pencil />
            Edit
          </Button>
        </Link>
      </div>

      {/* Metadata */}
      <div className="mb-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>Created {new Date(song.created_at).toLocaleDateString()}</span>
        <span>Updated {new Date(song.updated_at).toLocaleDateString()}</span>
      </div>

      {/* Audio link */}
      {song.audio_url && (
        <div className="mb-6">
          <a
            href={song.audio_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-4 hover:text-primary/80"
          >
            <ExternalLink className="size-3.5" />
            Listen to audio
          </a>
        </div>
      )}

      <Separator className="mb-6" />

      {/* Lyrics */}
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Lyrics
        </h2>
        {song.lyrics ? (
          <div className="whitespace-pre-wrap text-base leading-relaxed">
            {song.lyrics}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No lyrics yet.{" "}
            <Link
              href={`/songs/${id}/edit`}
              className="text-primary underline underline-offset-4"
            >
              Add lyrics
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
