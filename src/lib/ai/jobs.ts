import { SupabaseClient } from "@supabase/supabase-js";
import { PipelineState, PipelineStatus } from "./pipeline-types";

/**
 * Save or update a pipeline state in the database
 */
export async function savePipelineState(
  supabase: SupabaseClient,
  state: PipelineState
): Promise<boolean> {
  try {
    const { executionId, pipelineId, status, userId, projectId } = state;

    if (!projectId) {
      console.warn("Cannot save pipeline state without a projectId");
      return false;
    }

    const { error } = await supabase
      .from("ews_pipeline_jobs")
      .upsert(
        {
          id: executionId,
          project_id: projectId,
          user_id: userId,
          pipeline_id: pipelineId,
          status,
          state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("Error saving pipeline state:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception saving pipeline state:", error);
    return false;
  }
}

/**
 * Retrieve a pipeline state from the database by ID
 */
export async function getPipelineState(
  supabase: SupabaseClient,
  executionId: string
): Promise<PipelineState | null> {
  try {
    const { data, error } = await supabase
      .from("ews_pipeline_jobs")
      .select("state")
      .eq("id", executionId)
      .single();

    if (error || !data) {
      console.error("Error retrieving pipeline state:", error);
      return null;
    }

    return data.state as PipelineState;
  } catch (error) {
    console.error("Exception retrieving pipeline state:", error);
    return null;
  }
}

/**
 * Update just the status of a pipeline job
 */
export async function updatePipelineStatus(
  supabase: SupabaseClient,
  executionId: string,
  status: PipelineStatus
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("ews_pipeline_jobs")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", executionId);

    if (error) {
      console.error("Error updating pipeline status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception updating pipeline status:", error);
    return false;
  }
}
