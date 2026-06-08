import type { PostSummary } from "@shin-blog-app/shared";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Use vi.hoisted so these mocks are available inside the vi.mock factory
const { mockGetPosts } = vi.hoisted(() => ({
  mockGetPosts: vi.fn(),
}));

// Mock API
vi.mock("../lib/api.js", () => ({
  api: {
    getPosts: mockGetPosts,
  },
}));

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
class MockIntersectionObserver {
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
}
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

import { TopPage } from "./TopPage.js";

// Helper: build N mock PostSummary objects
const makePosts = (n: number): PostSummary[] =>
  Array.from({ length: n }, (_, i) => ({
    postId: `post-${i}`,
    title: `Post ${i}`,
    authorEmail: `author${i}@example.com`,
    authorName: `Author ${i}`,
    tags: i % 2 === 0 ? ["TypeScript"] : ["AWS"],
    createdAt: new Date(2026, 0, i + 1).toISOString(),
    excerpt: `Excerpt for post ${i}`,
  }));

function renderTopPage() {
  return render(
    <MemoryRouter>
      <TopPage />
    </MemoryRouter>,
  );
}

describe("TopPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────
  // 3.1 トップ画面に記事概要一覧表示
  // ──────────────────────────────────────────────────────────────
  describe("Requirement 3.1 – 記事一覧表示", () => {
    it("API から取得した投稿を BlogPostCard グリッドに表示する", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(3),
        nextCursor: undefined,
      });
      renderTopPage();
      await waitFor(() => {
        expect(screen.getAllByTestId("blog-post-card")).toHaveLength(3);
      });
    });

    it("page-grid data-testid が存在する", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(1),
        nextCursor: undefined,
      });
      renderTopPage();
      await waitFor(() => {
        expect(screen.getByTestId("post-grid")).toBeInTheDocument();
      });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 3.2 投稿日時の降順（新着順）
  // ──────────────────────────────────────────────────────────────
  describe("Requirement 3.2 – 新着タブ (最新)", () => {
    it("最新タブが最初から選択されている", async () => {
      mockGetPosts.mockResolvedValue({ posts: [], nextCursor: undefined });
      renderTopPage();
      await waitFor(() => {
        expect(screen.getByTestId("tab-latest")).toBeInTheDocument();
      });
      const latestTab = screen.getByTestId("tab-latest");
      expect(latestTab).toHaveAttribute("aria-selected", "true");
    });

    it("トレンドタブに切り替えられる", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(2),
        nextCursor: undefined,
      });
      renderTopPage();
      await waitFor(() => screen.getByTestId("tab-trending"));
      fireEvent.click(screen.getByTestId("tab-trending"));
      expect(screen.getByTestId("tab-trending")).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 3.3 記事クリック → 詳細画面遷移
  // ──────────────────────────────────────────────────────────────
  describe("Requirement 3.3 – 詳細画面へ遷移", () => {
    it("カードが /posts/:postId へのリンクとして表示される", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(1),
        nextCursor: undefined,
      });
      renderTopPage();
      await waitFor(() => screen.getByTestId("blog-post-card"));
      expect(screen.getByTestId("blog-post-card")).toHaveAttribute(
        "href",
        "/posts/post-0",
      );
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 3.4 記事0件 → 空状態メッセージ
  // ──────────────────────────────────────────────────────────────
  describe("Requirement 3.4 – 空状態メッセージ", () => {
    it("記事が0件のとき empty-state が表示される", async () => {
      mockGetPosts.mockResolvedValue({ posts: [], nextCursor: undefined });
      renderTopPage();
      await waitFor(() => {
        expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      });
    });

    it("空状態メッセージに「記事がありません」が含まれる", async () => {
      mockGetPosts.mockResolvedValue({ posts: [], nextCursor: undefined });
      renderTopPage();
      await waitFor(() => {
        expect(screen.getByTestId("empty-state")).toHaveTextContent(
          "記事がありません",
        );
      });
    });

    it("記事が1件以上あるとき empty-state は表示されない", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(1),
        nextCursor: undefined,
      });
      renderTopPage();
      await waitFor(() => screen.getByTestId("blog-post-card"));
      expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 3.5 未認証でも閲覧可 (API 認証不要で呼ばれることを確認)
  // ──────────────────────────────────────────────────────────────
  describe("Requirement 3.5 – 未認証でも閲覧可", () => {
    it("マウント時に api.getPosts が認証ヘッダーなしで呼ばれる", async () => {
      mockGetPosts.mockResolvedValue({ posts: [], nextCursor: undefined });
      renderTopPage();
      await waitFor(() => {
        expect(mockGetPosts).toHaveBeenCalledWith(undefined);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // キーワード検索
  // ──────────────────────────────────────────────────────────────
  describe("キーワード検索", () => {
    it("タイトル検索でマッチするカードのみ表示される", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(3),
        nextCursor: undefined,
      });
      renderTopPage();
      await waitFor(() => screen.getAllByTestId("blog-post-card"));
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "Post 1" },
      });
      expect(screen.getAllByTestId("blog-post-card")).toHaveLength(1);
    });

    it("検索クエリ有のときクリアボタンが表示される", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(1),
        nextCursor: undefined,
      });
      renderTopPage();
      await waitFor(() => screen.getByTestId("search-input"));
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "hello" },
      });
      expect(screen.getByTestId("search-clear")).toBeInTheDocument();
    });

    it("クリアボタンクリックで検索がリセットされ全件表示に戻る", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(3),
        nextCursor: undefined,
      });
      renderTopPage();
      await waitFor(() => screen.getAllByTestId("blog-post-card"));
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "Post 0" },
      });
      expect(screen.getAllByTestId("blog-post-card")).toHaveLength(1);
      fireEvent.click(screen.getByTestId("search-clear"));
      expect(screen.getByTestId("search-input")).toHaveValue("");
      expect(screen.getAllByTestId("blog-post-card")).toHaveLength(3);
    });

    it("タグ名でもフィルタリングされる（大文字小文字無視）", async () => {
      const posts: PostSummary[] = [
        {
          postId: "a",
          title: "Alpha",
          authorEmail: "a@a.com",
          authorName: "A",
          tags: ["TypeScript"],
          createdAt: "2026-01-01T00:00:00.000Z",
          excerpt: "ex",
        },
        {
          postId: "b",
          title: "Beta",
          authorEmail: "b@b.com",
          authorName: "B",
          tags: ["AWS"],
          createdAt: "2026-01-02T00:00:00.000Z",
          excerpt: "ex",
        },
      ];
      mockGetPosts.mockResolvedValue({ posts, nextCursor: undefined });
      renderTopPage();
      await waitFor(() => screen.getAllByTestId("blog-post-card"));
      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "typescript" },
      });
      expect(screen.getAllByTestId("blog-post-card")).toHaveLength(1);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // タグフィルターチップ
  // ──────────────────────────────────────────────────────────────
  describe("タグフィルターチップ", () => {
    it("ロードした投稿のユニークタグがチップとして表示される", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(2),
        nextCursor: undefined,
      });
      renderTopPage();
      await waitFor(() => {
        expect(screen.getByTestId("tag-chip-TypeScript")).toBeInTheDocument();
        expect(screen.getByTestId("tag-chip-AWS")).toBeInTheDocument();
      });
    });

    it("タグチップをクリックするとそのタグを持つ記事のみ表示される", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(4), // 0,2=TypeScript 1,3=AWS
        nextCursor: undefined,
      });
      renderTopPage();
      await waitFor(() => screen.getByTestId("tag-chip-TypeScript"));
      fireEvent.click(screen.getByTestId("tag-chip-TypeScript"));
      // posts 0 and 2 have TypeScript
      expect(screen.getAllByTestId("blog-post-card")).toHaveLength(2);
    });

    it("選択済みタグチップを再クリックするとフィルター解除される", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(4),
        nextCursor: undefined,
      });
      renderTopPage();
      await waitFor(() => screen.getByTestId("tag-chip-TypeScript"));
      fireEvent.click(screen.getByTestId("tag-chip-TypeScript"));
      expect(screen.getAllByTestId("blog-post-card")).toHaveLength(2);
      fireEvent.click(screen.getByTestId("tag-chip-TypeScript"));
      expect(screen.getAllByTestId("blog-post-card")).toHaveLength(4);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 無限スクロール
  // ──────────────────────────────────────────────────────────────
  describe("無限スクロール (IntersectionObserver)", () => {
    it("sentinel 要素が observe される", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(3),
        nextCursor: "cursor1",
      });
      renderTopPage();
      await waitFor(() => {
        expect(mockObserve).toHaveBeenCalled();
      });
    });

    it("nextCursor がない場合でも sentinel が observe される", async () => {
      mockGetPosts.mockResolvedValue({
        posts: makePosts(2),
        nextCursor: undefined,
      });
      renderTopPage();
      await waitFor(() => {
        expect(mockObserve).toHaveBeenCalled();
      });
    });
  });
});
