import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImagesGalleryView } from "./images-gallery-view";
import type { Image } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock the ImageUpload component since it depends on Supabase storage
vi.mock("@/components/images/image-upload", () => ({
  ImageUpload: () => <div data-testid="image-upload">Image Upload Mock</div>,
}));

const mockImages: Image[] = [
  {
    id: "img-1",
    project_id: "proj-1",
    title: "Sunset Scene",
    image_url: "https://example.com/sunset.jpg",
    caption: "A beautiful sunset over the mountains",
    symbolism: "hope",
    published: false,
    created_by: "user-1",
    created_at: "2026-03-19T00:00:00Z",
    updated_at: "2026-03-19T00:00:00Z",
  },
  {
    id: "img-2",
    project_id: "proj-1",
    title: "Dark Forest",
    image_url: "https://example.com/forest.jpg",
    caption: null,
    symbolism: null,
    published: false,
    created_by: "user-1",
    created_at: "2026-03-18T00:00:00Z",
    updated_at: "2026-03-18T00:00:00Z",
  },
];

describe("ImagesGalleryView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all images", () => {
    render(<ImagesGalleryView images={mockImages} projectId="proj-1" />);

    expect(screen.getByText("Sunset Scene")).toBeInTheDocument();
    expect(screen.getByText("Dark Forest")).toBeInTheDocument();
  });

  it("displays image captions", () => {
    render(<ImagesGalleryView images={mockImages} projectId="proj-1" />);

    expect(
      screen.getByText("A beautiful sunset over the mountains")
    ).toBeInTheDocument();
  });

  it("renders images with correct src", () => {
    render(<ImagesGalleryView images={mockImages} projectId="proj-1" />);

    const img = screen.getByAltText("Sunset Scene");
    expect(img).toHaveAttribute("src", "https://example.com/sunset.jpg");
  });

  it("links to image detail pages", () => {
    render(<ImagesGalleryView images={mockImages} projectId="proj-1" />);

    const link = screen.getByText("Sunset Scene").closest("a");
    expect(link).toHaveAttribute("href", "/images/img-1");
  });

  it("shows empty state when no images", () => {
    render(<ImagesGalleryView images={[]} projectId="proj-1" />);

    expect(
      screen.getByText("No images yet. Click 'New Image' to add one.")
    ).toBeInTheDocument();
  });

  it("shows project required message when no projectId", () => {
    render(<ImagesGalleryView images={[]} projectId={null} />);

    expect(
      screen.getByText("Create a project to add images")
    ).toBeInTheDocument();
  });
});
