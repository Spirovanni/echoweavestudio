import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PipelineExecutor } from "@/lib/ai/pipeline-executor";
import { savePipelineState, getPipelineState } from "@/lib/ai/jobs";
import { PipelineDefinition, StepInput, PipelineState } from "@/lib/ai/pipeline-types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // using service role for internal job tracking

export async function POST(req: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    const { action, jobId, input, projectId, userId } = body;

    if (!userId || !projectId) {
      return NextResponse.json({ error: "userId and projectId are required" }, { status: 400 });
    }

    let executor: PipelineExecutor;
    let def: PipelineDefinition;

    if (action === "resume") {
      if (!jobId) {
        return NextResponse.json({ error: "jobId required for resume" }, { status: 400 });
      }

      // Fetch existing state
      const state = await getPipelineState(supabase, jobId);
      if (!state) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      // Re-hydrate pipeline definition from outline context
      // Note: for production, we might store the dynamic definition or generate it predictably
      const outline = state.initialInput?.params?.outline as Array<Record<string, unknown>>;
      def = buildDynamicBookPipeline(outline);

      executor = PipelineExecutor.fromState(state, def, {
        input: state.initialInput,
        userId,
        projectId,
        persistState: true,
      });
      
    } else {
      // action === "start"
      if (!input || !input.params || !input.params.outline) {
        return NextResponse.json({ error: "input.params.outline is required for new book generation" }, { status: 400 });
      }

      def = buildDynamicBookPipeline(input.params.outline);
      executor = new PipelineExecutor(def, {
        input,
        userId,
        projectId,
        persistState: true,
      });
    }

    // Set up SSE Stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const sendEvent = (type: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Hack to inject stream callbacks into the generic executor options without breaking existing typescript
          (executor as unknown as { options: { onStatusChange: (status: string) => Promise<void> } }).options.onStatusChange = async (status: string) => {
            sendEvent("status", { status });
            // Save state to DB on status change
            if (["paused", "completed", "failed"].includes(status)) {
              await savePipelineState(supabase, executor.getState());
            }
          };

          (executor as unknown as { options: { onStepComplete: (step: {id: string}, output: {structured?: unknown, text: string}) => Promise<void> } }).options.onStepComplete = async (step: {id: string}, output: {structured?: unknown, text: string}) => {
            sendEvent("step_complete", { stepId: step.id, output: output.structured || output.text });
            // Save state periodically to not lose progress
            await savePipelineState(supabase, executor.getState());
            
            // PAUSE after each chapter by default so author can review!
            if (step.id.startsWith("chapter_")) {
              executor.pause();
            }
          };

          sendEvent("connected", { executionId: executor.getState().executionId });

          // Run or resume
          let result;
          if (action === "resume") {
             result = await executor.resume();
          } else {
             result = await executor.execute();
          }

          sendEvent("complete", result);
          controller.close();
        } catch (error: unknown) {
          // If paused, it throws "Pipeline paused" intentionally
          if (error instanceof Error && error.message === "Pipeline paused") {
             sendEvent("paused", { state: executor.getState() });
          } else {
             sendEvent("error", { message: error instanceof Error ? error.message : "Unknown error" });
          }
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Error in book generation endpoint:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Helper to build a dynamic pipeline that generates chapters one by one
 * based on the provided outline array.
 */
function buildDynamicBookPipeline(outline: Array<Record<string, unknown>>): PipelineDefinition {
  const steps = outline.map((chap, idx) => {
    return {
      id: `chapter_${idx + 1}`,
      name: `Chapter ${idx + 1}: ${chap.title || ""}`,
      description: `Generates chapter ${idx + 1}`,
      systemPrompt: `You are an expert novelist. Write highly engaging, vividly descriptive chapter content.

Return valid JSON with this structure:
{
  "chapter": {
    "number": ${idx + 1},
    "title": "Chapter title",
    "content": "Full chapter text with proper paragraphs (use \\n\\n for breaks)",
    "word_count": 0
  }
}`,
      buildPrompt: (input: StepInput) => {
        const characters = input.params?.characters || "None provided";
        const goals = input.params?.goals || "None provided";
        
        // Include previously generated chapters for context
        let previousContext = "";
        if (input.previousOutputs && input.previousOutputs.length > 0) {
           previousContext = "Previously in the story:\n";
           input.previousOutputs.forEach(out => {
             const prevChap = (out.structured as { chapter?: { number: number; content: string } })?.chapter;
             if (prevChap) {
                // Just include summaries or full text based on token limits. Here we include full text but in prod we might summarize.
                previousContext += `Chapter ${prevChap.number}:\n${prevChap.content}\n\n`;
             }
           });
        }

        return `Write Chapter ${idx + 1} of this book.

Goals: ${goals}
Characters: ${typeof characters === 'string' ? characters : JSON.stringify(characters)}
Outline for this chapter: ${typeof chap === 'string' ? chap : JSON.stringify(chap)}

${previousContext}

Write the full chapter content. Remember to output ONLY valid JSON.`;
      },
      options: {
        temperature: 0.8,
        maxTokens: 6144, // Allow long chapters
      },
    }
  });

  return {
    id: "book_generation_dynamic",
    name: "Book Generation",
    description: "Generates chapters dynamically based on an outline",
    steps: steps,
    config: {
      saveIntermediateResults: true,
      allowPause: true,
      timeout: 3600000, // 1 hour (though individual calls will be short because we pause)
    }
  };
}
