import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient } from "@/lib/api/helpers";
import { getAIProvider, aiStreamToReadableStream } from "@/lib/ai";
import { logAIGeneration } from "@/lib/ai/generations";

const SYSTEM_PROMPT = `You are a masterful creative writer. Generate a compelling story or story segment.

Return your response as valid JSON with this structure:
{
  "title": "Story title",
  "genre": "Genre classification",
  "content": "The full story text with proper paragraphs (use \\n\\n for paragraph breaks)",
  "characters_introduced": [
    { "name": "Character name", "role": "Their role in the story", "description": "Brief description" }
  ],
  "themes": ["Theme 1", "Theme 2"],
  "mood": "The overall mood/atmosphere",
  "word_count": 0,
  "continuation_hooks": ["Possible direction 1", "Possible direction 2"]
}

Write with vivid prose, authentic dialogue, and meaningful character development.
Aim for literary quality while remaining accessible. Show, don't tell.
Always return valid JSON only — no markdown fences or extra text.`;

/**
 * POST /api/ai/generate/story
 * Generate a story or story segment.
 * Body: { themes?, genre?, characters?, settings?, tone?, wordCount?, project_id?, stream? }
 */
export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const body = await request.json();
  const {
    themes, genre, characters, settings, tone,
    wordCount, prompt: customPrompt,
    project_id, stream: shouldStream = false,
  } = body;

  if (!genre && !themes && !customPrompt) {
    return NextResponse.json(
      { error: "At least one of genre, themes, or prompt is required" },
      { status: 400 }
    );
  }

  const parts = [
    genre ? `Genre: ${genre}` : null,
    tone ? `Tone: ${tone}` : null,
    themes ? `Themes: ${Array.isArray(themes) ? themes.join(", ") : themes}` : null,
    characters ? `Characters: ${Array.isArray(characters) ? characters.join(", ") : characters}` : null,
    settings ? `Settings: ${settings}` : null,
    wordCount ? `Target word count: ~${wordCount}` : "Target word count: ~1000",
    customPrompt ? `Additional direction: ${customPrompt}` : null,
  ].filter(Boolean);

  const userPrompt = `Write a story with:\n${parts.join("\n")}`;

  const provider = getAIProvider();
  const startTime = Date.now();
  const messages = [{ role: "user" as const, content: userPrompt }];

  if (shouldStream) {
    const aiStream = provider.stream({ messages, system: SYSTEM_PROMPT, temperature: 0.9, maxTokens: 8192 });

    return new Response(aiStreamToReadableStream(aiStream), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  try {
    const result = await provider.generate({ messages, system: SYSTEM_PROMPT, temperature: 0.9, maxTokens: 8192 });
    const durationMs = Date.now() - startTime;

    // Log AI generation if project_id is provided
    if (project_id) {
      await logAIGeneration(supabase!, {
        projectId: project_id,
        toolType: "story",
        prompt: userPrompt,
        output: result.text,
        metadata: {
          themes,
          genre,
          characters,
          settings,
          tone,
          wordCount,
          model: result.model,
          provider: provider.name,
          usage: result.usage,
          durationMs,
        },
        userId: user!.id,
      });
    }

    let parsed;
    try { parsed = JSON.parse(result.text); } catch { parsed = null; }

    return NextResponse.json({
      text: result.text,
      structured: parsed,
      model: result.model,
      usage: result.usage,
      durationMs,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Story generation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
