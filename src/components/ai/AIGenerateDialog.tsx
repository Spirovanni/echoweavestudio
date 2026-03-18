"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  Copy,
  BookOpen,
  Map,
  ScrollText,
  RotateCcw,
} from "lucide-react";

type GeneratorTool = "story" | "plot" | "outline";

interface ToolConfig {
  label: string;
  icon: React.ReactNode;
  description: string;
  endpoint: string;
}

const TOOLS: Record<GeneratorTool, ToolConfig> = {
  story: {
    label: "Story",
    icon: <BookOpen className="size-3.5" />,
    description: "Generate a story or story segment with vivid prose",
    endpoint: "/api/ai/generate/story",
  },
  plot: {
    label: "Plot",
    icon: <Map className="size-3.5" />,
    description: "Generate a structured plot with acts and turning points",
    endpoint: "/api/ai/generate/plot",
  },
  outline: {
    label: "Outline",
    icon: <ScrollText className="size-3.5" />,
    description: "Generate a chapter-by-chapter outline",
    endpoint: "/api/ai/generate/outline",
  },
};

const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Horror",
  "Literary Fiction",
  "Historical Fiction",
  "Young Adult",
  "Contemporary",
];

const TONES = [
  "Dark",
  "Lighthearted",
  "Suspenseful",
  "Whimsical",
  "Melancholy",
  "Hopeful",
  "Gritty",
  "Lyrical",
  "Humorous",
  "Epic",
];

interface AIGenerateDialogProps {
  children: React.ReactNode;
  projectId?: string;
  onInsert?: (text: string) => void;
}

export function AIGenerateDialog({
  children,
  projectId,
  onInsert,
}: AIGenerateDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<GeneratorTool>("story");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Form state
  const [genre, setGenre] = useState("");
  const [tone, setTone] = useState("");
  const [themes, setThemes] = useState("");
  const [characters, setCharacters] = useState("");
  const [settings, setSettings] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [wordCount, setWordCount] = useState("");
  const [concept, setConcept] = useState("");
  const [chapterCount, setChapterCount] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  const resetForm = useCallback(() => {
    setGenre("");
    setTone("");
    setThemes("");
    setCharacters("");
    setSettings("");
    setCustomPrompt("");
    setWordCount("");
    setConcept("");
    setChapterCount("");
    setResult(null);
  }, []);

  const buildRequestBody = useCallback(() => {
    const base: Record<string, unknown> = {
      stream: true,
      project_id: projectId || undefined,
    };

    switch (activeTool) {
      case "story":
        return {
          ...base,
          genre: genre || undefined,
          tone: tone || undefined,
          themes: themes ? themes.split(",").map((t) => t.trim()) : undefined,
          characters: characters
            ? characters.split(",").map((c) => c.trim())
            : undefined,
          settings: settings || undefined,
          wordCount: wordCount ? parseInt(wordCount) : undefined,
          prompt: customPrompt || undefined,
        };
      case "plot":
        return {
          ...base,
          genre,
          tone,
          archetypes: themes
            ? themes.split(",").map((t) => t.trim())
            : undefined,
          characters: characters
            ? characters.split(",").map((c) => c.trim())
            : undefined,
          settings: settings || undefined,
        };
      case "outline":
        return {
          ...base,
          concept: concept || customPrompt,
          goals: undefined,
          chapterCount: chapterCount ? parseInt(chapterCount) : undefined,
          characters: characters
            ? characters.split(",").map((c) => c.trim())
            : undefined,
          themes: themes ? themes.split(",").map((t) => t.trim()) : undefined,
        };
    }
  }, [
    activeTool,
    genre,
    tone,
    themes,
    characters,
    settings,
    customPrompt,
    wordCount,
    concept,
    chapterCount,
    projectId,
  ]);

  const canGenerate = useCallback(() => {
    switch (activeTool) {
      case "story":
        return !!(genre || themes || customPrompt);
      case "plot":
        return !!(genre && tone);
      case "outline":
        return !!(concept || customPrompt);
    }
  }, [activeTool, genre, tone, themes, customPrompt, concept]);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate()) return;

    setGenerating(true);
    setResult("");
    abortRef.current = new AbortController();

    const tool = TOOLS[activeTool];
    const body = buildRequestBody();

    try {
      const res = await fetch(tool.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error || "Generation failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setResult(accumulated);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled
      } else {
        setResult(
          `Error: ${err instanceof Error ? err.message : "Generation failed"}`
        );
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [activeTool, buildRequestBody, canGenerate]);

  const handleCancel = () => {
    abortRef.current?.abort();
    setGenerating(false);
  };

  const handleCopy = () => {
    if (result) navigator.clipboard.writeText(result);
  };

  const handleInsert = () => {
    if (result && onInsert) {
      onInsert(result);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span />}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Generate</DialogTitle>
          <DialogDescription>
            Generate stories, plot structures, and outlines with AI
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Tool selection tabs */}
          <Tabs
            value={activeTool}
            onValueChange={(v) => {
              setActiveTool(v as GeneratorTool);
              setResult(null);
            }}
          >
            <TabsList>
              {(Object.entries(TOOLS) as [GeneratorTool, ToolConfig][]).map(
                ([key, tool]) => (
                  <TabsTrigger key={key} value={key}>
                    {tool.icon}
                    {tool.label}
                  </TabsTrigger>
                )
              )}
            </TabsList>

            {/* Story form */}
            <TabsContent value="story">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Genre
                  </label>
                  <Select
                    value={genre}
                    onValueChange={(v) => v && setGenre(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tone
                  </label>
                  <Select value={tone} onValueChange={(v) => v && setTone(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Themes
                  </label>
                  <Input
                    value={themes}
                    onChange={(e) => setThemes(e.target.value)}
                    placeholder="e.g. redemption, loss, hope"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Word count
                  </label>
                  <Input
                    type="number"
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value)}
                    placeholder="~1000"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Characters
                  </label>
                  <Input
                    value={characters}
                    onChange={(e) => setCharacters(e.target.value)}
                    placeholder="e.g. Elara, Kael, The Shadow King"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Additional direction
                  </label>
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Any specific direction or context for the story..."
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Plot form */}
            <TabsContent value="plot">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Genre <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={genre}
                    onValueChange={(v) => v && setGenre(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tone <span className="text-destructive">*</span>
                  </label>
                  <Select value={tone} onValueChange={(v) => v && setTone(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Characters
                  </label>
                  <Input
                    value={characters}
                    onChange={(e) => setCharacters(e.target.value)}
                    placeholder="e.g. A reluctant hero, A cunning villain"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Archetypes / themes
                  </label>
                  <Input
                    value={themes}
                    onChange={(e) => setThemes(e.target.value)}
                    placeholder="e.g. Hero's journey, Coming of age"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Settings
                  </label>
                  <Input
                    value={settings}
                    onChange={(e) => setSettings(e.target.value)}
                    placeholder="e.g. A war-torn kingdom, A futuristic city"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Outline form */}
            <TabsContent value="outline">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Concept <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder="Describe your book concept in a few sentences..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Chapter count
                  </label>
                  <Input
                    type="number"
                    value={chapterCount}
                    onChange={(e) => setChapterCount(e.target.value)}
                    placeholder="10-15"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Themes
                  </label>
                  <Input
                    value={themes}
                    onChange={(e) => setThemes(e.target.value)}
                    placeholder="e.g. identity, power, love"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Characters
                  </label>
                  <Input
                    value={characters}
                    onChange={(e) => setCharacters(e.target.value)}
                    placeholder="e.g. Maya, Daniel, Professor Lee"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Generate button */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerate}
              disabled={generating || !canGenerate()}
            >
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate
                </>
              )}
            </Button>
            {generating && (
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            )}
            {result && !generating && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            )}
            <Badge variant="outline" className="ml-auto text-xs">
              {TOOLS[activeTool].label}
            </Badge>
          </div>

          {/* Output area */}
          {(result || generating) && (
            <div className="flex flex-col gap-2 overflow-hidden">
              <div className="flex-1 overflow-y-auto rounded-md border border-border bg-muted/50 p-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                  {result}
                  {generating && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground/70 animate-pulse" />
                  )}
                </pre>
              </div>

              {!generating && result && !result.startsWith("Error:") && (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                  {onInsert && (
                    <Button size="sm" onClick={handleInsert}>
                      <BookOpen className="size-3.5" />
                      Insert into editor
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
