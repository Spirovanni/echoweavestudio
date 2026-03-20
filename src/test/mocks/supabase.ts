import { vi } from "vitest";

/**
 * Creates a mock Supabase client for testing.
 *
 * Usage:
 *   const { supabase, mockFrom } = createMockSupabaseClient();
 *   mockFrom.mockReturnValue(mockQueryBuilder({ data: [...], error: null }));
 */
export function createMockSupabaseClient() {
  const mockFrom = vi.fn();

  const supabase = {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "test-user-id",
            email: "test@example.com",
          },
        },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "test.png" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://test.com/test.png" } }),
      }),
    },
  };

  return { supabase, mockFrom };
}

/**
 * Creates a mock Supabase query builder chain.
 * Returns an object that mimics the fluent API (.select().eq().single() etc).
 *
 * Usage:
 *   mockFrom.mockReturnValue(
 *     mockQueryBuilder({ data: [{ id: "1", name: "Test" }], error: null })
 *   );
 */
export function mockQueryBuilder(result: { data: unknown; error: unknown; count?: number }) {
  const builder: Record<string, unknown> = {};

  const chainMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "like",
    "ilike",
    "is",
    "in",
    "contains",
    "containedBy",
    "range",
    "or",
    "not",
    "filter",
    "match",
    "order",
    "limit",
    "single",
    "maybeSingle",
    "csv",
    "returns",
  ];

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // Make it thenable so await works
  builder.then = (resolve: (value: unknown) => unknown) =>
    resolve({ ...result, count: result.count ?? null });

  return builder;
}

/**
 * Mock for `@/lib/supabase/server` createClient
 */
export function mockCreateClient() {
  const { supabase, mockFrom } = createMockSupabaseClient();
  return { supabase, mockFrom };
}

/**
 * Mock for `@/lib/api/helpers` getAuthenticatedClient
 */
export function mockGetAuthenticatedClient() {
  const { supabase, mockFrom } = createMockSupabaseClient();

  const getAuthenticatedClient = vi.fn().mockResolvedValue({
    supabase,
    user: { id: "test-user-id", email: "test@example.com" },
    error: null,
  });

  return { getAuthenticatedClient, supabase, mockFrom };
}
