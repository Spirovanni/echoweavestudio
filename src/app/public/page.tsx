import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Published Works — Echo Weave Studio",
  description: "Explore published chapters and artwork from Echo Weave Studio.",
};

export default function PublicHomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Published Works
        </h1>
        <p className="text-muted-foreground">
          Explore published chapters and artwork from Echo Weave Studio.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/public/chapters"
          className="rounded-lg border border-border p-6 transition-colors hover:bg-muted/50"
        >
          <h2 className="text-lg font-semibold">Chapters</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Read published chapters and stories.
          </p>
        </Link>

        <Link
          href="/public/images"
          className="rounded-lg border border-border p-6 transition-colors hover:bg-muted/50"
        >
          <h2 className="text-lg font-semibold">Artwork</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse published artwork and illustrations.
          </p>
        </Link>
      </div>
    </div>
  );
}
