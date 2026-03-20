import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DashboardView } from "./dashboard-view";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockStats = {
  chapters: {
    total: 10,
    byStatus: { idea: 2, draft: 3, revision: 2, complete: 2, published: 1 },
    completionPercent: 30,
    completedCount: 3,
  },
  songs: { total: 5 },
  images: { total: 8 },
  characters: { total: 4 },
  themes: { total: 3 },
  notes: { total: 12 },
  conversations: { total: 6 },
  linkedAssets: { themeLinks: 7, characterLinks: 5, conversationLinks: 3 },
};

const mockRecent = {
  data: [
    { id: "1", type: "chapter", title: "Chapter One", updated_at: "2026-03-19T00:00:00Z" },
    { id: "2", type: "song", title: "Opening Theme", updated_at: "2026-03-18T00:00:00Z" },
  ],
};

function setupFetchMock(statsResponse = mockStats, recentResponse = mockRecent) {
  global.fetch = vi.fn().mockImplementation((url: string) => {
    if (url.includes("/api/dashboard/stats")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(statsResponse),
      });
    }
    if (url.includes("/api/dashboard/recent")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(recentResponse),
      });
    }
    return Promise.resolve({ ok: false });
  });
}

describe("DashboardView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading spinner initially", () => {
    setupFetchMock();
    render(<DashboardView />);
    // The loading spinner should be visible before data loads
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders entity count cards after loading", async () => {
    setupFetchMock();
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument(); // Chapters
    });

    expect(screen.getByText("Chapters")).toBeInTheDocument();
    expect(screen.getByText("Songs")).toBeInTheDocument();
    expect(screen.getByText("Images")).toBeInTheDocument();
    expect(screen.getByText("Characters")).toBeInTheDocument();
    expect(screen.getByText("Themes")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Conversations")).toBeInTheDocument();
    // Verify a unique count renders
    expect(screen.getByText("12")).toBeInTheDocument(); // Notes count (unique)
  });

  it("renders completion bar with percentage", async () => {
    setupFetchMock();
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText("30%")).toBeInTheDocument();
    });

    expect(screen.getByText("Book Completion")).toBeInTheDocument();
    expect(
      screen.getByText("3 of 10 chapters complete or published")
    ).toBeInTheDocument();
  });

  it("renders chapter status breakdown", async () => {
    setupFetchMock();
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText("Chapter Progress")).toBeInTheDocument();
    });

    expect(screen.getByText("Idea")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("renders linked asset counts", async () => {
    setupFetchMock();
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText("Linked Assets")).toBeInTheDocument();
    });

    expect(screen.getByText("Theme links")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Character links")).toBeInTheDocument();
    expect(screen.getByText("Conversation links")).toBeInTheDocument();
  });

  it("renders recent activity", async () => {
    setupFetchMock();
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText("Chapter One")).toBeInTheDocument();
    });

    expect(screen.getByText("Opening Theme")).toBeInTheDocument();
  });

  it("shows empty state when no chapters exist", async () => {
    const emptyStats = {
      ...mockStats,
      chapters: { total: 0, byStatus: {}, completionPercent: 0, completedCount: 0 },
    };
    setupFetchMock(emptyStats, { data: [] });
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText("Create your first chapter")).toBeInTheDocument();
    });
  });

  it("shows no recent activity message when empty", async () => {
    setupFetchMock(mockStats, { data: [] });
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText("No recent activity")).toBeInTheDocument();
    });
  });
});
