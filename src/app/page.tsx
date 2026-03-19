import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Music,
  ImageIcon,
  Users,
  Sparkles,
  Palette,
  MessageSquare,
  Wand2,
  GitBranch,
  PenTool,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: BookOpen,
      title: "Chapter Management",
      description:
        "Organize your story with rich text editing, status tracking, and collaborative chapter-by-chapter workflow.",
    },
    {
      icon: Sparkles,
      title: "AI Writing Assistant",
      description:
        "Generate plots, outlines, and story segments. Get AI-powered suggestions for grammar, style, and continuation.",
    },
    {
      icon: Music,
      title: "Songs & Lyrics",
      description:
        "Capture the emotional tone of your narrative with integrated song lyrics and mood tracking.",
    },
    {
      icon: ImageIcon,
      title: "Visual Gallery",
      description:
        "Store artwork, character portraits, and symbolic imagery with detailed annotations and meanings.",
    },
    {
      icon: Users,
      title: "Collaborative Workspace",
      description:
        "Real-time co-authoring designed for two writers working on shared creative projects together.",
    },
    {
      icon: GitBranch,
      title: "Version History",
      description:
        "Track changes, compare revisions, and never lose a brilliant idea with automatic chapter versioning.",
    },
    {
      icon: MessageSquare,
      title: "Conversations & Notes",
      description:
        "Capture dialogue snippets, brainstorm ideas, and discuss plot points with threaded conversations.",
    },
    {
      icon: Palette,
      title: "Themes & Characters",
      description:
        "Build rich character profiles and track recurring themes throughout your narrative arc.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <PenTool className="size-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">
              Echo Weave Studio
            </span>
          </div>
          <Link href="/login">
            <Button variant="default">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Wand2 className="size-4" />
            AI-Powered Collaborative Writing
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Where Two Authors
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Weave One Story
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            A collaborative creative workspace built for co-authors. Manage
            chapters, integrate AI writing tools, track characters and themes,
            and bring your shared narrative vision to life.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                <Sparkles className="mr-2 size-4" />
                Start Writing Together
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <BookOpen className="mr-2 size-4" />
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Co-Author
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Powerful tools designed for collaborative storytelling, from first
            draft to final manuscript.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="transition-all hover:shadow-lg hover:scale-[1.02]">
                <CardHeader>
                  <div className="mb-2 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-12 text-center shadow-xl">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Start Your Story?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join Echo Weave Studio and transform the way you collaborate
            on creative writing projects.
          </p>
          <Link href="/login">
            <Button size="lg" className="text-lg">
              <Sparkles className="mr-2 size-5" />
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80 py-12">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2026 Echo Weave Studio. Built for storytellers.</p>
        </div>
      </footer>
    </div>
  );
}
