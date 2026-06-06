import { createPostSchema } from "@shin-blog-app/shared";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MarkdownEditor } from "../components/blog/MarkdownEditor.js";
import { api } from "../lib/api.js";

interface FieldErrors {
  title?: string;
  content?: string;
  tags?: string;
}

export function BlogCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Tag helpers ──────────────────────────────────────────────
  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.length >= 5) return;
    if (tags.includes(trimmed)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with zod
    const result = createPostSchema.safeParse({ title, content, tags });
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const post = await api.createPost(result.data);
      navigate(`/posts/${post.postId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "投稿に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = !title.trim() || isSubmitting;

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "32px 16px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <form onSubmit={(e) => void handleSubmit(e)}>
        {/* Title input – inline editable header style */}
        <div style={{ marginBottom: 24 }}>
          <input
            data-testid="title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="記事タイトルを入力してください"
            style={{
              width: "100%",
              fontSize: 32,
              fontWeight: 800,
              border: "none",
              borderBottom: errors.title
                ? "2px solid #ef4444"
                : "2px solid transparent",
              outline: "none",
              padding: "4px 0",
              color: "#1e293b",
              background: "transparent",
              boxSizing: "border-box",
            }}
          />
          {errors.title && (
            <p
              data-testid="title-error"
              style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}
            >
              {errors.title}
            </p>
          )}
        </div>

        {/* Tag input */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 8,
            }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                data-testid={`tag-chip-${tag}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  background: "#e0e7ff",
                  color: "#4338ca",
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {tag}
                <button
                  type="button"
                  data-testid={`tag-remove-${tag}`}
                  onClick={() => removeTag(tag)}
                  aria-label={`${tag}を削除`}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 14,
                    color: "#4338ca",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            data-testid="tag-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            disabled={tags.length >= 5}
            placeholder={
              tags.length >= 5
                ? "タグは最大5件です"
                : "タグを入力してEnterで追加 (最大5件)"
            }
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
              background: tags.length >= 5 ? "#f8fafc" : "#fff",
              color: tags.length >= 5 ? "#94a3b8" : "inherit",
            }}
          />
          {errors.tags && (
            <p
              data-testid="tags-error"
              style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}
            >
              {errors.tags}
            </p>
          )}
        </div>

        {/* Markdown editor */}
        <div style={{ marginBottom: 24 }}>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="本文をMarkdownで入力してください..."
          />
          {errors.content && (
            <p
              data-testid="content-error"
              style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}
            >
              {errors.content}
            </p>
          )}
        </div>

        {/* Submit error */}
        {submitError && (
          <p
            data-testid="submit-error"
            style={{
              color: "#ef4444",
              fontSize: 14,
              marginBottom: 16,
              padding: "8px 12px",
              background: "#fff1f1",
              border: "1px solid #fecaca",
              borderRadius: 8,
            }}
          >
            {submitError}
          </p>
        )}

        {/* Submit button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            data-testid="submit-button"
            disabled={isSubmitDisabled}
            style={{
              padding: "10px 32px",
              background: isSubmitDisabled ? "#94a3b8" : "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: isSubmitDisabled ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {isSubmitting ? "投稿中..." : "投稿する"}
          </button>
        </div>
      </form>
    </div>
  );
}
