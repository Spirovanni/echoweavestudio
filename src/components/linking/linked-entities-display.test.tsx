import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LinkedEntitiesDisplay } from "./linked-entities-display";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock AlertDialog components (Base UI)
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, open }: any) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  AlertDialogAction: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

const mockLinks = [
  {
    chapter_id: "chapter-1",
    entity_id: "song-1",
    entity_type: "song" as const,
    entity: { title: "Opening Theme" },
    created_at: "2026-03-19T00:00:00Z",
  },
  {
    chapter_id: "chapter-1",
    entity_id: "song-2",
    entity_type: "song" as const,
    entity: { title: "Battle Hymn" },
    created_at: "2026-03-18T00:00:00Z",
  },
  {
    chapter_id: "chapter-1",
    entity_id: "theme-1",
    entity_type: "theme" as const,
    entity: { name: "Redemption" },
    created_at: "2026-03-17T00:00:00Z",
  },
];

function setupFetchMock(links = mockLinks) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: links }),
  });
}

describe("LinkedEntitiesDisplay", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state initially", () => {
    setupFetchMock();
    render(
      <LinkedEntitiesDisplay chapterId="chapter-1" entityType="song" />
    );
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("displays linked entities filtered by type", async () => {
    setupFetchMock();
    render(
      <LinkedEntitiesDisplay chapterId="chapter-1" entityType="song" />
    );

    await waitFor(() => {
      expect(screen.getByText("Opening Theme")).toBeInTheDocument();
    });
    expect(screen.getByText("Battle Hymn")).toBeInTheDocument();
    // Should NOT show theme entities when filtering for songs
    expect(screen.queryByText("Redemption")).not.toBeInTheDocument();
  });

  it("shows empty state when no linked entities", async () => {
    setupFetchMock([]);
    render(
      <LinkedEntitiesDisplay chapterId="chapter-1" entityType="character" />
    );

    await waitFor(() => {
      expect(
        screen.getByText("No linked characters yet.")
      ).toBeInTheDocument();
    });
  });

  it("renders entity links with correct hrefs", async () => {
    setupFetchMock();
    render(
      <LinkedEntitiesDisplay chapterId="chapter-1" entityType="song" />
    );

    await waitFor(() => {
      expect(screen.getByText("Opening Theme")).toBeInTheDocument();
    });

    const link = screen.getByText("Opening Theme").closest("a");
    expect(link).toHaveAttribute("href", "/songs/song-1");
  });

  it("does not show remove buttons when not editable", async () => {
    setupFetchMock();
    render(
      <LinkedEntitiesDisplay chapterId="chapter-1" entityType="song" />
    );

    await waitFor(() => {
      expect(screen.getByText("Opening Theme")).toBeInTheDocument();
    });

    // Should not have any buttons (no remove buttons)
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("shows remove buttons when editable", async () => {
    setupFetchMock();
    render(
      <LinkedEntitiesDisplay
        chapterId="chapter-1"
        entityType="song"
        editable
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Opening Theme")).toBeInTheDocument();
    });

    // Should have remove buttons (one per linked entity)
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("calls onUnlink callback after successful unlink", async () => {
    const onUnlink = vi.fn();
    const user = userEvent.setup();

    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === "DELETE") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockLinks }),
      });
    });

    render(
      <LinkedEntitiesDisplay
        chapterId="chapter-1"
        entityType="song"
        editable
        onUnlink={onUnlink}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Opening Theme")).toBeInTheDocument();
    });

    // Click remove button on first song
    const removeButtons = screen.getAllByRole("button");
    await user.click(removeButtons[0]);

    // Confirm unlink in dialog
    await waitFor(() => {
      expect(screen.getByText("Unlink")).toBeInTheDocument();
    });
    await user.click(screen.getByText("Unlink"));

    await waitFor(() => {
      expect(onUnlink).toHaveBeenCalledWith("song-1");
    });
  });

  it("handles theme entities with name field", async () => {
    setupFetchMock();
    render(
      <LinkedEntitiesDisplay chapterId="chapter-1" entityType="theme" />
    );

    await waitFor(() => {
      expect(screen.getByText("Redemption")).toBeInTheDocument();
    });

    const link = screen.getByText("Redemption").closest("a");
    expect(link).toHaveAttribute("href", "/themes/theme-1");
  });
});
