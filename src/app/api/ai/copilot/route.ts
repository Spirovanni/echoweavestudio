import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedClient } from "@/lib/api/helpers";
import { getAIProvider, aiStreamToReadableStream } from "@/lib/ai";
import type { AIMessage } from "@/lib/ai";

const COPILOT_SYSTEM = `You are The Muse, an AI creative writing assistant for the Echo Weave Studio.
You help two co-authors (Xavier and Natalie) brainstorm, develop characters, refine themes,
suggest plot directions, and improve their writing. Be creative, supportive, and insightful.
Keep responses concise unless asked to elaborate.`;

/**
 * POST /api/ai/copilot
 * The Muse AI assistant for creative writing help.
 *
 * Body: { prompt: string, messages?: AIMessage[], projectId?: string, stream?: boolean }
 */
export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthenticatedClient();
  if (error) return error;

  const body = await request.json();
  const { prompt, messages: history, projectId, stream: shouldStream = false } = body;

  if (!prompt && (!history || history.length === 0)) {
    return NextResponse.json(
      { error: "prompt or messages are required" },
      { status: 400 }
    );
  }

  const messages: AIMessage[] = history?.length
    ? history
    : [{ role: "user" as const, content: prompt }];

  const provider = getAIProvider();

  if (shouldStream) {
    const aiStream = provider.stream({
      messages,
      system: COPILOT_SYSTEM,
    });

    return new Response(aiStreamToReadableStream(aiStream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  }

  try {
    const result = await provider.generate({
      messages,
      system: COPILOT_SYSTEM,
    });

    // Log to ai_generations (best-effort, don't fail the response)
    await supabase!
      .from("ews_ai_generations")
      .insert({
        user_id: user!.id,
        project_id: projectId || null,
        tool: "copilot",
        prompt: prompt || messages[messages.length - 1]?.content || "",
        result: result.text,
        model: result.model,
        provider: provider.name,
        prompt_tokens: result.usage.promptTokens,
        completion_tokens: result.usage.completionTokens,
        total_tokens: result.usage.totalTokens,
        status: "completed",
      });

    return NextResponse.json({
      result: result.text,
      model: result.model,
      usage: result.usage,
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
