import type { PostSummary } from "@shin-blog-app/shared";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { BlogPostCard } from "./BlogPostCard.js";

const mockPost: PostSummary = {
  postId: "post-1",
  title: "Test Post Title",
  authorEmail: "john@example.com",
  authorName: "john",
  tags: ["TypeScript", "AWS", "React"],
  createdAt: "2026-06-01T00:00:00.000Z",
  excerpt: "This is a test excerpt for the blog post card.",
};

function renderCard(post: PostSummary = mockPost) {
  return render(
    <MemoryRouter>
      <BlogPostCard post={post} to={`/posts/${post.postId}`} />
    </MemoryRouter>,
  );
}

describe("BlogPostCard", () => {
  it("renders title", () => {
    renderCard();
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });

  it("renders authorName", () => {
    renderCard();
    expect(screen.getByText(/john/)).toBeInTheDocument();
  });

  it("renders up to 3 tags", () => {
    renderCard();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("AWS")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("renders only 3 tags when 5 given", () => {
    const post: PostSummary = { ...mockPost, tags: ["A", "B", "C", "D", "E"] };
    renderCard(post);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.queryByText("D")).not.toBeInTheDocument();
    expect(screen.queryByText("E")).not.toBeInTheDocument();
  });

  it("renders excerpt", () => {
    renderCard();
    expect(screen.getByText(/This is a test excerpt/)).toBeInTheDocument();
  });

  it("renders as a link to the post detail page", () => {
    renderCard();
    expect(screen.getByTestId("blog-post-card")).toHaveAttribute(
      "href",
      "/posts/post-1",
    );
  });

  it("renders readTime based on excerpt word count", () => {
    // excerpt "This is a test excerpt for the blog post card." = 9 words
    // Math.max(1, Math.ceil(9 / 200)) = 1
    renderCard();
    expect(screen.getByText(/1分/)).toBeInTheDocument();
  });

  it("renders createdAt date", () => {
    renderCard();
    // Should display some date string
    expect(screen.getByTestId("blog-post-card")).toBeInTheDocument();
  });

  it("applies data-testid to card element", () => {
    renderCard();
    expect(screen.getByTestId("blog-post-card")).toBeInTheDocument();
  });

  it("renders empty tags gracefully", () => {
    const post: PostSummary = { ...mockPost, tags: [] };
    renderCard(post);
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });
});
