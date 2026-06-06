import type { Post } from "@shin-blog-app/shared";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoisted mocks ────────────────────────────────────────────────
const { mockCreatePost, mockNavigate } = vi.hoisted(() => ({
  mockCreatePost: vi.fn(),
  mockNavigate: vi.fn(),
}));

// Mock API
vi.mock("../lib/api.js", () => ({
  api: {
    createPost: mockCreatePost,
  },
}));

// Mock MarkdownEditor → simple textarea for tests
vi.mock("../components/blog/MarkdownEditor.js", () => ({
  MarkdownEditor: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      data-testid="markdown-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { BlogCreatePage } from "./BlogCreatePage.js";

const mockPost: Post = {
  postId: "new-post-id",
  title: "My New Post",
  content: "This is the content of the post.",
  authorId: "user-123",
  authorEmail: "author@example.com",
  authorName: "Test Author",
  tags: ["TypeScript"],
  createdAt: "2026-06-06T10:00:00.000Z",
};

function renderBlogCreatePage() {
  return render(
    <MemoryRouter>
      <BlogCreatePage />
    </MemoryRouter>,
  );
}

describe("BlogCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────
  // Requirement 5.1 – タイトル入力・マークダウンエディタ
  // ──────────────────────────────────────────────────────────────
  describe("Requirement 5.1 – タイトル入力・マークダウンエディタ", () => {
    it("タイトル入力欄が表示される", () => {
      renderBlogCreatePage();
      expect(screen.getByTestId("title-input")).toBeInTheDocument();
    });

    it("タグ入力欄が表示される", () => {
      renderBlogCreatePage();
      expect(screen.getByTestId("tag-input")).toBeInTheDocument();
    });

    it("MarkdownEditor が表示される", () => {
      renderBlogCreatePage();
      expect(screen.getByTestId("markdown-editor")).toBeInTheDocument();
    });

    it("投稿ボタンが表示される", () => {
      renderBlogCreatePage();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    });

    it("タイトルを入力できる", () => {
      renderBlogCreatePage();
      const titleInput = screen.getByTestId("title-input");
      fireEvent.change(titleInput, { target: { value: "My Post Title" } });
      expect(titleInput).toHaveValue("My Post Title");
    });

    it("MarkdownEditor の内容を変更できる", () => {
      renderBlogCreatePage();
      const editor = screen.getByTestId("markdown-editor");
      fireEvent.change(editor, { target: { value: "Some content" } });
      expect(editor).toHaveValue("Some content");
    });
  });

  // ──────────────────────────────────────────────────────────────
  // タグ入力 (Enter追加・×削除・最大5件)
  // ──────────────────────────────────────────────────────────────
  describe("タグ入力機能", () => {
    it("Enterキーでタグが追加される", () => {
      renderBlogCreatePage();
      const tagInput = screen.getByTestId("tag-input");
      fireEvent.change(tagInput, { target: { value: "TypeScript" } });
      fireEvent.keyDown(tagInput, { key: "Enter" });
      expect(screen.getByTestId("tag-chip-TypeScript")).toBeInTheDocument();
    });

    it("タグを×ボタンで削除できる", () => {
      renderBlogCreatePage();
      const tagInput = screen.getByTestId("tag-input");
      fireEvent.change(tagInput, { target: { value: "TypeScript" } });
      fireEvent.keyDown(tagInput, { key: "Enter" });
      expect(screen.getByTestId("tag-chip-TypeScript")).toBeInTheDocument();
      fireEvent.click(screen.getByTestId("tag-remove-TypeScript"));
      expect(
        screen.queryByTestId("tag-chip-TypeScript"),
      ).not.toBeInTheDocument();
    });

    it("タグ追加後に入力欄がクリアされる", () => {
      renderBlogCreatePage();
      const tagInput = screen.getByTestId("tag-input");
      fireEvent.change(tagInput, { target: { value: "React" } });
      fireEvent.keyDown(tagInput, { key: "Enter" });
      expect(tagInput).toHaveValue("");
    });

    it("重複タグは追加されない", () => {
      renderBlogCreatePage();
      const tagInput = screen.getByTestId("tag-input");
      fireEvent.change(tagInput, { target: { value: "TypeScript" } });
      fireEvent.keyDown(tagInput, { key: "Enter" });
      fireEvent.change(tagInput, { target: { value: "TypeScript" } });
      fireEvent.keyDown(tagInput, { key: "Enter" });
      expect(screen.getAllByTestId(/^tag-chip-/)).toHaveLength(1);
    });

    it("タグが5件のとき入力欄が disabled になる", () => {
      renderBlogCreatePage();
      const tagInput = screen.getByTestId("tag-input");
      for (const tag of ["A", "B", "C", "D", "E"]) {
        fireEvent.change(tagInput, { target: { value: tag } });
        fireEvent.keyDown(tagInput, { key: "Enter" });
      }
      expect(tagInput).toBeDisabled();
    });

    it("空文字のタグは追加されない", () => {
      renderBlogCreatePage();
      const tagInput = screen.getByTestId("tag-input");
      fireEvent.change(tagInput, { target: { value: "   " } });
      fireEvent.keyDown(tagInput, { key: "Enter" });
      expect(screen.queryAllByTestId(/^tag-chip-/)).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Requirement 5.4 – バリデーション・エラー表示
  // ──────────────────────────────────────────────────────────────
  describe("Requirement 5.4 – バリデーション・エラー表示", () => {
    it("タイトルが空のとき投稿ボタンが disabled", () => {
      renderBlogCreatePage();
      expect(screen.getByTestId("submit-button")).toBeDisabled();
    });

    it("タイトルを入力すると投稿ボタンが enabled になる", () => {
      renderBlogCreatePage();
      fireEvent.change(screen.getByTestId("title-input"), {
        target: { value: "Hello" },
      });
      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    });

    it("本文が空のまま投稿するとエラーが表示される", async () => {
      renderBlogCreatePage();
      fireEvent.change(screen.getByTestId("title-input"), {
        target: { value: "Valid Title" },
      });
      // content is empty
      fireEvent.click(screen.getByTestId("submit-button"));
      await waitFor(() => {
        expect(screen.getByTestId("content-error")).toBeInTheDocument();
      });
    });

    it("本文エラーメッセージに「本文は必須」が含まれる", async () => {
      renderBlogCreatePage();
      fireEvent.change(screen.getByTestId("title-input"), {
        target: { value: "Valid Title" },
      });
      fireEvent.click(screen.getByTestId("submit-button"));
      await waitFor(() => {
        expect(screen.getByTestId("content-error")).toHaveTextContent(
          "本文は必須",
        );
      });
    });

    it("バリデーションエラー時に API が呼ばれない", async () => {
      renderBlogCreatePage();
      fireEvent.change(screen.getByTestId("title-input"), {
        target: { value: "Valid Title" },
      });
      // content empty → validation fails
      fireEvent.click(screen.getByTestId("submit-button"));
      await waitFor(() => screen.getByTestId("content-error"));
      expect(mockCreatePost).not.toHaveBeenCalled();
    });

    it("タイトルが空の場合に投稿ボタン押下でも API が呼ばれない", async () => {
      renderBlogCreatePage();
      // submit button is disabled → clicking does nothing
      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toBeDisabled();
      // Even if we force-click, api should not be called
      fireEvent.click(submitButton);
      expect(mockCreatePost).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // Requirement 5.3 – 投稿成功後の遷移
  // ──────────────────────────────────────────────────────────────
  describe("Requirement 5.3 – 投稿成功後の遷移", () => {
    it("投稿成功後に /posts/{postId} へ遷移する", async () => {
      mockCreatePost.mockResolvedValue(mockPost);
      renderBlogCreatePage();
      fireEvent.change(screen.getByTestId("title-input"), {
        target: { value: "My New Post" },
      });
      fireEvent.change(screen.getByTestId("markdown-editor"), {
        target: { value: "Some content here" },
      });
      fireEvent.click(screen.getByTestId("submit-button"));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/posts/new-post-id");
      });
    });

    it("api.createPost が正しい引数で呼ばれる", async () => {
      mockCreatePost.mockResolvedValue(mockPost);
      renderBlogCreatePage();
      fireEvent.change(screen.getByTestId("title-input"), {
        target: { value: "My New Post" },
      });
      fireEvent.change(screen.getByTestId("markdown-editor"), {
        target: { value: "Some content here" },
      });
      // Add a tag
      const tagInput = screen.getByTestId("tag-input");
      fireEvent.change(tagInput, { target: { value: "TypeScript" } });
      fireEvent.keyDown(tagInput, { key: "Enter" });
      fireEvent.click(screen.getByTestId("submit-button"));
      await waitFor(() => {
        expect(mockCreatePost).toHaveBeenCalledWith({
          title: "My New Post",
          content: "Some content here",
          tags: ["TypeScript"],
        });
      });
    });

    it("タグなしで投稿すると tags が空配列で渡される", async () => {
      mockCreatePost.mockResolvedValue(mockPost);
      renderBlogCreatePage();
      fireEvent.change(screen.getByTestId("title-input"), {
        target: { value: "My New Post" },
      });
      fireEvent.change(screen.getByTestId("markdown-editor"), {
        target: { value: "Some content" },
      });
      fireEvent.click(screen.getByTestId("submit-button"));
      await waitFor(() => {
        expect(mockCreatePost).toHaveBeenCalledWith({
          title: "My New Post",
          content: "Some content",
          tags: [],
        });
      });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // 投稿中の状態
  // ──────────────────────────────────────────────────────────────
  describe("投稿中の状態", () => {
    it("投稿中は投稿ボタンが disabled になる", async () => {
      // Never resolve to stay in submitting state
      mockCreatePost.mockReturnValue(new Promise(() => {}));
      renderBlogCreatePage();
      fireEvent.change(screen.getByTestId("title-input"), {
        target: { value: "My Post" },
      });
      fireEvent.change(screen.getByTestId("markdown-editor"), {
        target: { value: "Content" },
      });
      fireEvent.click(screen.getByTestId("submit-button"));
      await waitFor(() => {
        expect(screen.getByTestId("submit-button")).toBeDisabled();
      });
    });
  });

  // ──────────────────────────────────────────────────────────────
  // API エラー
  // ──────────────────────────────────────────────────────────────
  describe("API エラー", () => {
    it("API エラー時に submit-error が表示される", async () => {
      mockCreatePost.mockRejectedValue(new Error("API error: 500"));
      renderBlogCreatePage();
      fireEvent.change(screen.getByTestId("title-input"), {
        target: { value: "My Post" },
      });
      fireEvent.change(screen.getByTestId("markdown-editor"), {
        target: { value: "Content" },
      });
      fireEvent.click(screen.getByTestId("submit-button"));
      await waitFor(() => {
        expect(screen.getByTestId("submit-error")).toBeInTheDocument();
      });
    });
  });
});
