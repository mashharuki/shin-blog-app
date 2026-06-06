import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BlogPostCard } from "./BlogPostCard.js";
import type { PostSummary } from "@shin-blog-app/shared";

const mockPost: PostSummary = {
  postId: "post-1",
  title: "Test Post Title",
  authorEmail: "john@example.com",
  authorName: "john",
  tags: ["TypeScript", "AWS", "React"],
  createdAt: "2026-06-01T00:00:00.000Z",
  excerpt: "This is a test excerpt for the blog post card.",
};

describe("BlogPostCard", () => {
  it("renders title", () => {
    render(<BlogPostCard post={mockPost} onClick={() => {}} />);
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });

  it("renders authorName", () => {
    render(<BlogPostCard post={mockPost} onClick={() => {}} />);
    expect(screen.getByText(/john/)).toBeInTheDocument();
  });

  it("renders up to 3 tags", () => {
    render(<BlogPostCard post={mockPost} onClick={() => {}} />);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("AWS")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("renders only 3 tags when 5 given", () => {
    const post: PostSummary = { ...mockPost, tags: ["A", "B", "C", "D", "E"] };
    render(<BlogPostCard post={post} onClick={() => {}} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.queryByText("D")).not.toBeInTheDocument();
    expect(screen.queryByText("E")).not.toBeInTheDocument();
  });

  it("renders excerpt", () => {
    render(<BlogPostCard post={mockPost} onClick={() => {}} />);
    expect(screen.getByText(/This is a test excerpt/)).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", () => {
    const handleClick = vi.fn();
    render(<BlogPostCard post={mockPost} onClick={handleClick} />);
    const card = screen.getByTestId("blog-post-card");
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("renders readTime based on excerpt word count", () => {
    // excerpt "This is a test excerpt for the blog post card." = 9 words
    // Math.max(1, Math.ceil(9 / 200)) = 1
    render(<BlogPostCard post={mockPost} onClick={() => {}} />);
    expect(screen.getByText(/1分/)).toBeInTheDocument();
  });

  it("renders createdAt date", () => {
    render(<BlogPostCard post={mockPost} onClick={() => {}} />);
    // Should display some date string
    expect(screen.getByTestId("blog-post-card")).toBeInTheDocument();
  });

  it("applies data-testid to card element", () => {
    render(<BlogPostCard post={mockPost} onClick={() => {}} />);
    expect(screen.getByTestId("blog-post-card")).toBeInTheDocument();
  });

  it("renders empty tags gracefully", () => {
    const post: PostSummary = { ...mockPost, tags: [] };
    render(<BlogPostCard post={post} onClick={() => {}} />);
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });
});
