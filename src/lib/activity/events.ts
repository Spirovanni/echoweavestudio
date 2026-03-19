/**
 * Activity Event Logging Service
 *
 * Server-side service for logging user and system actions to the activity events table.
 * Used for audit trails, activity feeds, and analytics.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supported event types
 */
export type ActivityEventType =
  | "created"
  | "updated"
  | "deleted"
  | "status_changed"
  | "linked"
  | "unlinked"
  | "ai_generated"
  | "exported"
  | "imported"
  | "member_added"
  | "member_removed"
  | "settings_changed";

/**
 * Supported entity types
 */
export type ActivityEntityType =
  | "project"
  | "chapter"
  | "song"
  | "image"
  | "conversation"
  | "character"
  | "theme"
  | "note";

/**
 * Parameters for logging an activity event
 */
export interface LogActivityEventParams {
  /** Project this event belongs to */
  projectId: string;
  /** User who performed the action */
  userId: string;
  /** Type of event */
  eventType: ActivityEventType;
  /** Type of entity affected */
  entityType?: ActivityEntityType;
  /** ID of the entity affected */
  entityId?: string;
  /** Additional metadata (flexible JSONB) */
  metadata?: Record<string, unknown>;
}

/**
 * Activity event record from database
 */
export interface ActivityEvent {
  id: string;
  project_id: string;
  user_id: string;
  event_type: ActivityEventType;
  entity_type: ActivityEntityType | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Log an activity event to the database
 *
 * @param supabase - Supabase client
 * @param params - Event parameters
 * @returns The created event ID, or null if logging failed
 *
 * @example
 * ```typescript
 * await logActivityEvent(supabase, {
 *   projectId: "proj-123",
 *   userId: "user-456",
 *   eventType: "created",
 *   entityType: "chapter",
 *   entityId: "chapter-789",
 *   metadata: { title: "Chapter 1" },
 * });
 * ```
 */
export async function logActivityEvent(
  supabase: SupabaseClient,
  params: LogActivityEventParams
): Promise<string | null> {
  const {
    projectId,
    userId,
    eventType,
    entityType = null,
    entityId = null,
    metadata = {},
  } = params;

  try {
    const { data, error } = await supabase
      .from("ews_activity_events")
      .insert({
        project_id: projectId,
        user_id: userId,
        event_type: eventType,
        entity_type: entityType,
        entity_id: entityId,
        metadata,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to log activity event:", error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error("Unexpected error logging activity event:", error);
    return null;
  }
}

/**
 * Log multiple activity events in a batch
 *
 * @param supabase - Supabase client
 * @param events - Array of event parameters
 * @returns Array of created event IDs
 */
export async function logActivityEventsBatch(
  supabase: SupabaseClient,
  events: LogActivityEventParams[]
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("ews_activity_events")
      .insert(
        events.map((params) => ({
          project_id: params.projectId,
          user_id: params.userId,
          event_type: params.eventType,
          entity_type: params.entityType || null,
          entity_id: params.entityId || null,
          metadata: params.metadata || {},
        }))
      )
      .select("id");

    if (error) {
      console.error("Failed to log activity events batch:", error);
      return [];
    }

    return data?.map((row) => row.id) || [];
  } catch (error) {
    console.error("Unexpected error logging activity events batch:", error);
    return [];
  }
}

/**
 * Fetch activity events with filtering and pagination
 *
 * @param supabase - Supabase client
 * @param projectId - Project ID to filter by
 * @param options - Filtering and pagination options
 * @returns Array of activity events
 */
export interface FetchActivityEventsOptions {
  /** Filter by event type */
  eventType?: ActivityEventType;
  /** Filter by entity type */
  entityType?: ActivityEntityType;
  /** Filter by entity ID */
  entityId?: string;
  /** Filter by user ID */
  userId?: string;
  /** Maximum number of events to return */
  limit?: number;
  /** Number of events to skip */
  offset?: number;
}

export async function fetchActivityEvents(
  supabase: SupabaseClient,
  projectId: string,
  options: FetchActivityEventsOptions = {}
): Promise<ActivityEvent[]> {
  const {
    eventType,
    entityType,
    entityId,
    userId,
    limit = 50,
    offset = 0,
  } = options;

  try {
    let query = supabase
      .from("ews_activity_events")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    if (entityId) {
      query = query.eq("entity_id", entityId);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch activity events:", error);
      return [];
    }

    return (data as ActivityEvent[]) || [];
  } catch (error) {
    console.error("Unexpected error fetching activity events:", error);
    return [];
  }
}

/**
 * Helper: Log a "created" event
 */
export async function logCreatedEvent(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  entityType: ActivityEntityType,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivityEvent(supabase, {
    projectId,
    userId,
    eventType: "created",
    entityType,
    entityId,
    metadata,
  });
}

/**
 * Helper: Log an "updated" event
 */
export async function logUpdatedEvent(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  entityType: ActivityEntityType,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivityEvent(supabase, {
    projectId,
    userId,
    eventType: "updated",
    entityType,
    entityId,
    metadata,
  });
}

/**
 * Helper: Log a "deleted" event
 */
export async function logDeletedEvent(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  entityType: ActivityEntityType,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivityEvent(supabase, {
    projectId,
    userId,
    eventType: "deleted",
    entityType,
    entityId,
    metadata,
  });
}

/**
 * Helper: Log a "status_changed" event
 */
export async function logStatusChangedEvent(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  entityType: ActivityEntityType,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivityEvent(supabase, {
    projectId,
    userId,
    eventType: "status_changed",
    entityType,
    entityId,
    metadata: {
      ...metadata,
      oldStatus,
      newStatus,
    },
  });
}

/**
 * Helper: Log a "linked" event
 */
export async function logLinkedEvent(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  sourceEntityType: ActivityEntityType,
  sourceEntityId: string,
  targetEntityType: ActivityEntityType,
  targetEntityId: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivityEvent(supabase, {
    projectId,
    userId,
    eventType: "linked",
    entityType: sourceEntityType,
    entityId: sourceEntityId,
    metadata: {
      ...metadata,
      targetEntityType,
      targetEntityId,
    },
  });
}

/**
 * Helper: Log an "unlinked" event
 */
export async function logUnlinkedEvent(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  sourceEntityType: ActivityEntityType,
  sourceEntityId: string,
  targetEntityType: ActivityEntityType,
  targetEntityId: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  return logActivityEvent(supabase, {
    projectId,
    userId,
    eventType: "unlinked",
    entityType: sourceEntityType,
    entityId: sourceEntityId,
    metadata: {
      ...metadata,
      targetEntityType,
      targetEntityId,
    },
  });
}
