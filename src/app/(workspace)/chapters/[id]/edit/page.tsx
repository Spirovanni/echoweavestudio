import { ChapterEditView } from "./chapter-edit-view";

export default async function ChapterEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ChapterEditView chapterId={id} />;
}
