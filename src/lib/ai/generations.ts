import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIToolType, EntityType } from "@/lib/types";

export interface LogGenerationParams {
  projectId: string;
  toolType: AIToolType;
  prompt: string;
  output: string;
  sourceEntityType?: EntityType;
  sourceEntityId?: string;
  metadata?: Record<string, unknown>;
  userId: string;
}

/**
 * Log an AI generation to the database for tracking and history.
 *
 * @param supabase - Supabase client
 * @param params - Generation parameters
 * @returns The created AI generation record ID, or null on error
 */
export async function logAIGeneration(
  supabase: SupabaseClient,
  params: LogGenerationParams
): Promise<string | null> {
  const {
    projectId,
    toolType,
    prompt,
    output,
    sourceEntityType,
    sourceEntityId,
    metadata = {},
    userId,
  } = params;

  try {
    const { data, error } = await supabase
      .from("ews_ai_generations")
      .insert({
        project_id: projectId,
        tool_type: toolType,
        prompt,
        output,
        source_entity_type: sourceEntityType || null,
        source_entity_id: sourceEntityId || null,
        metadata,
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error logging AI generation:", error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error("Error logging AI generation:", error);
    return null;
  }
}

/**
 * Fetch AI generations for a project with optional filters.
 *
 * @param supabase - Supabase client
 * @param projectId - Project ID
 * @param options - Filter options
 * @returns Array of AI generation records
 */
export async function fetchAIGenerations(
  supabase: SupabaseClient,
  projectId: string,
  options: {
    toolType?: AIToolType;
    sourceEntityType?: EntityType;
    sourceEntityId?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const {
    toolType,
    sourceEntityType,
    sourceEntityId,
    limit = 50,
    offset = 0,
  } = options;

  let query = supabase
    .from("ews_ai_generations")
    .select("*", { count: "exact" })
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (toolType) {
    query = query.eq("tool_type", toolType);
  }

  if (sourceEntityType) {
    query = query.eq("source_entity_type", sourceEntityType);
  }

  if (sourceEntityId) {
    query = query.eq("source_entity_id", sourceEntityId);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching AI generations:", error);
    return { data: [], count: 0, error };
  }

  return { data: data || [], count: count || 0, error: null };
}
