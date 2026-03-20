import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import { CharacterDetailView } from "./character-detail-view";

interface LinkedChapter {
  id: string;
  title: string;
  status: string;
  orderIndex: number;
  linkedAt: string;
}

interface Character {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  symbolism: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: character } = await supabase
    .from("ews_characters")
    .select("*")
    .eq("id", id)
    .single<Character>();

  if (!character) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Character not found</p>
        <Link href="/characters">
          <Button variant="outline">Back to Characters</Button>
        </Link>
      </div>
    );
  }

  // Fetch linked chapters via junction table
  const { data: linkedChapters } = await supabase
    .from("ews_chapter_characters")
    .select(
      `
      chapter_id,
      created_at,
      ews_chapters!inner(id, title, status, order_index)
    `
    )
    .eq("character_id", id);

  const chapters: LinkedChapter[] = (linkedChapters || []).map((link: any) => {
    const chapter = Array.isArray(link.ews_chapters)
      ? link.ews_chapters[0]
      : link.ews_chapters;
    return {
      id: chapter.id,
      title: chapter.title,
      status: chapter.status,
      orderIndex: chapter.order_index,
      linkedAt: link.created_at,
    };
  });

  return <CharacterDetailView character={character} chapters={chapters} />;
}
