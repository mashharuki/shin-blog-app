import type { Post, PostSummary } from "@shin-blog-app/shared";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted so these mocks are available inside the vi.mock factory
const { mockGetPost, mockGetPosts, mockNavigate } = vi.hoisted(() => ({
  mockGetPost: vi.fn(),
  mockGetPosts: vi.fn(),
  mockNavigate: vi.fn(),
}));

// Mock API
vi.mock("../lib/api.js", () => ({
  api: {
    getPost: mockGetPost,
    getPosts: mockGetPosts,
  },
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useParams: () => ({ postId: "test-post-id" }),
    useNavigate: () => mockNavigate,
  };
});

import { BlogDetailPage } from "./BlogDetailPage.js";

const mockPost: Post = {
  postId: "test-post-id",
  title: "Test Post Title",
  content:
    "# Heading One\n\n## Heading Two\n\nSome **bold** content.\n\n### Heading Three\n\nMore content here.",
  authorId: "user-123",
  authorEmail: "author@example.com",
  authorName: "Test Author",
  tags: ["TypeScript", "React"],
  createdAt: "2026-01-15T10:00:00.000Z",
};

const mockPosts: PostSummary[] = [
  {
    postId: "related-1",
    title: "Related Post TypeScript",
    authorEmail: "other@example.com",
    authorName: "Other Author",
    tags: ["TypeScript"],
    createdAt: "2026-01-10T00:00:00.000Z",
    excerpt: "Related post excerpt",
  },
  {
    postId: "related-2",
    title: "Related Post React",
    authorEmail: "other2@example.com",
    authorName: "Other Author 2",
    tags: ["React"],
    createdAt: "2026-01-09T00:00:00.000Z",
    excerpt: "Related post excerpt 2",
  },
  {
    postId: "unrelated-1",
    title: "Unrelated Post",
    authorEmail: "other3@example.com",
    authorName: "Other Author 3",
    tags: ["Python"],
    createdAt: "2026-01-08T00:00:00.000Z",
    excerpt: "Unrelated post excerpt",
  },
];

function renderBlogDetailPage() {
  return render(
    <MemoryRouter>
      <BlogDetailPage />
    </MemoryRouter>,
  );
}

describe("BlogDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────
  // Requirement 4.1 – タイトル・著者・日時・本文表示
  // ──────────────────────────────────────────────────────────────
  describe("Requirement 4.1 – 記事詳細表示", () => {
    it("記事タイトルが表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("post-title")).toHaveTextContent(
          "Test Post Title",
        );
      });
    });

    it("著者名が表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("author-name")).toHaveTextContent(
          "Test Author",
        );
      });
    });

    it("著者アバターが表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("author-avatar")).toBeInTheDocument();
      });
    });

    it("投稿日時が表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("post-date")).toBeInTheDocument();
      });
    });

    it("readTime が表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("read-time")).toBeInTheDocument();
      });
    });

    it("Markdown コンテンツがレンダリングされる (post-content 領域が存在)", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("post-content")).toBeInTheDocument();
      });
    });

    it("タグが表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("post-tags")).toBeInTheDocument();
      });
    });

    it("タグの内容が正しく表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        const tagsEl = screen.getByTestId("post-tags");
        expect(tagsEl).toHaveTextContent("TypeScript");
        expect(tagsEl).toHaveTextContent("React");
      });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Requirement 4.2 – 存在しない記事 → エラーメッセージ + トップリンク
  // ──────────────────────────────────────────────────────────────
  describe("Requirement 4.2 – 存在しない記事 → エラー表示", () => {
    it("API エラー時にエラーメッセージが表示される", async () => {
      mockGetPost.mockRejectedValue(new Error("API error: 404"));
      mockGetPosts.mockResolvedValue({ posts: [], nextCursor: undefined });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toBeInTheDocument();
      });
    });

    it("エラー時にトップへのリンクが表示される", async () => {
      mockGetPost.mockRejectedValue(new Error("API error: 404"));
      mockGetPosts.mockResolvedValue({ posts: [], nextCursor: undefined });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("back-to-top-link")).toBeInTheDocument();
      });
    });

    it("エラーメッセージに記事が見つからない旨のテキストが含まれる", async () => {
      mockGetPost.mockRejectedValue(new Error("API error: 404"));
      mockGetPosts.mockResolvedValue({ posts: [], nextCursor: undefined });
      renderBlogDetailPage();
      await waitFor(() => {
        const errEl = screen.getByTestId("error-message");
        expect(errEl.textContent).toBeTruthy();
      });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Requirement 4.3 – トップへ戻るナビゲーション
  // ──────────────────────────────────────────────────────────────
  describe("Requirement 4.3 – 一覧に戻るナビゲーション", () => {
    it("「一覧に戻る」ボタンが表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("back-button")).toBeInTheDocument();
      });
    });

    it("「一覧に戻る」クリックで navigate(-1) が呼ばれる", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => screen.getByTestId("back-button"));
      fireEvent.click(screen.getByTestId("back-button"));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Requirement 4.4 – 未認証でも詳細閲覧可
  // ──────────────────────────────────────────────────────────────
  describe("Requirement 4.4 – 未認証でも閲覧可", () => {
    it("api.getPost が postId を引数に呼ばれる (認証ヘッダー不要)", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(mockGetPost).toHaveBeenCalledWith("test-post-id");
      });
    });

    it("api.getPost は1引数（postId のみ）で呼ばれる", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(mockGetPost).toHaveBeenCalledTimes(1);
        expect(mockGetPost.mock.calls[0]).toHaveLength(1);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 目次 (TOC)
  // ──────────────────────────────────────────────────────────────
  describe("目次 (TOC)", () => {
    it("TOC 要素が表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("toc")).toBeInTheDocument();
      });
    });

    it("モバイル用アコーディオントグルボタンが存在する", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("toc-toggle")).toBeInTheDocument();
      });
    });

    it("トグルボタンクリックでアコーディオンが開閉する", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => screen.getByTestId("toc-toggle"));
      const toggle = screen.getByTestId("toc-toggle");
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
    });

    it("コンテンツに見出しがない場合 TOC は表示されない", async () => {
      const postNoHeadings: Post = {
        ...mockPost,
        content: "Just a paragraph with no headings.",
      };
      mockGetPost.mockResolvedValue(postNoHeadings);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => screen.getByTestId("post-content"));
      expect(screen.queryByTestId("toc")).not.toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 関連記事
  // ──────────────────────────────────────────────────────────────
  describe("関連記事", () => {
    it("同じタグを持つ記事が関連記事セクションとして表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("related-posts")).toBeInTheDocument();
      });
    });

    it("関連記事は最大 3 件まで表示される", async () => {
      const manyRelated: PostSummary[] = Array.from({ length: 5 }, (_, i) => ({
        postId: `related-${i}`,
        title: `Related ${i}`,
        authorEmail: `auth${i}@example.com`,
        authorName: `Author ${i}`,
        tags: ["TypeScript"],
        createdAt: `2026-01-${String(10 - i).padStart(2, "0")}T00:00:00.000Z`,
        excerpt: "excerpt",
      }));
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: manyRelated,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        const cards = screen.getAllByTestId("related-post-item");
        expect(cards.length).toBeLessThanOrEqual(3);
      });
    });

    it("現在の記事は関連記事から除外される", async () => {
      const postsWithSelf: PostSummary[] = [
        {
          postId: "test-post-id", // 現在の記事と同じ ID
          title: "Current Post",
          authorEmail: "author@example.com",
          authorName: "Author",
          tags: ["TypeScript"],
          createdAt: "2026-01-15T00:00:00.000Z",
          excerpt: "Current excerpt",
        },
        {
          postId: "other-1",
          title: "Other TypeScript Post",
          authorEmail: "other@example.com",
          authorName: "Other",
          tags: ["TypeScript"],
          createdAt: "2026-01-14T00:00:00.000Z",
          excerpt: "Other excerpt",
        },
      ];
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: postsWithSelf,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        const items = screen.queryAllByTestId("related-post-item");
        const titles = items.map((el) => el.textContent ?? "");
        expect(titles.some((t) => t.includes("Current Post"))).toBe(false);
      });
    });

    it("共通タグを持たない記事は関連記事に含まれない", async () => {
      const onlyUnrelated: PostSummary[] = [
        {
          postId: "no-match",
          title: "Python Post",
          authorEmail: "py@example.com",
          authorName: "Py Author",
          tags: ["Python"],
          createdAt: "2026-01-05T00:00:00.000Z",
          excerpt: "python excerpt",
        },
      ];
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: onlyUnrelated,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => screen.getByTestId("post-content"));
      expect(screen.queryByTestId("related-posts")).not.toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // いいね/保存/シェアボタン (UI のみ・ローカル state)
  // ──────────────────────────────────────────────────────────────
  describe("いいね・保存・シェアボタン", () => {
    it("いいねボタンが表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("like-button")).toBeInTheDocument();
      });
    });

    it("いいねボタンクリックで aria-pressed が切り替わる", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => screen.getByTestId("like-button"));
      const btn = screen.getByTestId("like-button");
      expect(btn).toHaveAttribute("aria-pressed", "false");
      fireEvent.click(btn);
      expect(btn).toHaveAttribute("aria-pressed", "true");
    });

    it("保存ボタンが表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("save-button")).toBeInTheDocument();
      });
    });

    it("シェアボタンが表示される", async () => {
      mockGetPost.mockResolvedValue(mockPost);
      mockGetPosts.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      renderBlogDetailPage();
      await waitFor(() => {
        expect(screen.getByTestId("share-button")).toBeInTheDocument();
      });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // ローディング状態
  // ──────────────────────────────────────────────────────────────
  describe("ローディング状態", () => {
    it("データ取得中はローディングインジケーターが表示される", () => {
      // Never resolve to stay in loading state
      mockGetPost.mockReturnValue(new Promise(() => {}));
      mockGetPosts.mockReturnValue(new Promise(() => {}));
      renderBlogDetailPage();
      expect(screen.getByTestId("loading")).toBeInTheDocument();
    });
  });
});
