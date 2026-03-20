import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentThread } from "./CommentThread";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockComments = [
  {
    id: "c-1",
    entity_type: "chapter",
    entity_id: "ch-1",
    content: "Great opening paragraph!",
    user_id: "user-1",
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60000).toISOString(),
    user: {
      id: "user-1",
      display_name: "Alice Writer",
      email: "alice@example.com",
      avatar_url: null,
    },
  },
  {
    id: "c-2",
    entity_type: "chapter",
    entity_id: "ch-1",
    content: "Consider revising the dialogue here.",
    user_id: "user-2",
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    user: {
      id: "user-2",
      display_name: "Bob Editor",
      email: "bob@example.com",
      avatar_url: null,
    },
  },
];

function mockFetch(comments = mockComments, total = 2) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: comments, total }),
  });
}

describe("CommentThread", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state initially", () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    render(<CommentThread entityType="chapter" entityId="ch-1" />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders comments", async () => {
    mockFetch();

    render(<CommentThread entityType="chapter" entityId="ch-1" />);

    await waitFor(() => {
      expect(screen.getByText("Alice Writer")).toBeInTheDocument();
    });

    expect(screen.getByText("Great opening paragraph!")).toBeInTheDocument();
    expect(screen.getByText("Bob Editor")).toBeInTheDocument();
    expect(
      screen.getByText("Consider revising the dialogue here.")
    ).toBeInTheDocument();
  });

  it("shows comment count", async () => {
    mockFetch();

    render(<CommentThread entityType="chapter" entityId="ch-1" />);

    await waitFor(() => {
      expect(screen.getByText("2 comments")).toBeInTheDocument();
    });
  });

  it("shows singular comment text for one comment", async () => {
    mockFetch([mockComments[0]], 1);

    render(<CommentThread entityType="chapter" entityId="ch-1" />);

    await waitFor(() => {
      expect(screen.getByText("1 comment")).toBeInTheDocument();
    });
  });

  it("shows empty state when no comments", async () => {
    mockFetch([], 0);

    render(<CommentThread entityType="chapter" entityId="ch-1" />);

    await waitFor(() => {
      expect(screen.getByText(/No comments yet/)).toBeInTheDocument();
    });
  });

  it("shows delete button only for current user comments", async () => {
    mockFetch();

    render(
      <CommentThread
        entityType="chapter"
        entityId="ch-1"
        currentUserId="user-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Alice Writer")).toBeInTheDocument();
    });

    // Should have exactly 1 delete button (for user-1's comment only)
    const deleteButtons = document.querySelectorAll("button[class*='size-6']");
    expect(deleteButtons).toHaveLength(1);
  });

  it("renders comment form", async () => {
    mockFetch();

    render(<CommentThread entityType="chapter" entityId="ch-1" />);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Add a comment...")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /post comment/i })
    ).toBeInTheDocument();
  });

  it("shows relative timestamps", async () => {
    mockFetch();

    render(<CommentThread entityType="chapter" entityId="ch-1" />);

    await waitFor(() => {
      expect(screen.getByText("5m ago")).toBeInTheDocument();
    });

    expect(screen.getByText("2h ago")).toBeInTheDocument();
  });
});
