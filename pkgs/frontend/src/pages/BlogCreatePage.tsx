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
        color: "var(--color-text)",
      }}
    >
      <form onSubmit={(e) => void handleSubmit(e)}>
        {/* Title input – inline editable header style */}
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="post-title" className="sr-only">
            記事タイトル
          </label>
          <input
            id="post-title"
            data-testid="title-input"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={errors.title ? "true" : undefined}
            aria-describedby={errors.title ? "title-error" : undefined}
            placeholder="記事タイトルを入力してください"
            autoComplete="off"
            style={{
              width: "100%",
              fontSize: 32,
              fontWeight: 800,
              border: "none",
              borderBottom: errors.title
                ? "2px solid var(--color-danger)"
                : "2px solid transparent",
              padding: "4px 0",
              color: "var(--color-text-strong)",
              background: "transparent",
              boxSizing: "border-box",
            }}
          />
          {errors.title && (
            <p
              id="title-error"
              data-testid="title-error"
              style={{
                color: "var(--color-danger)",
                fontSize: 13,
                marginTop: 4,
              }}
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
                  background: "var(--color-primary-soft)",
                  color: "var(--color-primary-strong)",
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
                    color: "var(--color-primary-strong)",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <label htmlFor="post-tags" className="sr-only">
            タグ
          </label>
          <input
            id="post-tags"
            data-testid="tag-input"
            name="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            disabled={tags.length >= 5}
            aria-invalid={errors.tags ? "true" : undefined}
            aria-describedby={errors.tags ? "tags-error" : undefined}
            autoComplete="off"
            placeholder={
              tags.length >= 5
                ? "タグは最大5件です"
                : "タグを入力してEnterで追加 (最大5件)"
            }
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 14,
              boxSizing: "border-box",
              background:
                tags.length >= 5
                  ? "var(--color-surface-muted)"
                  : "var(--color-surface)",
              color: tags.length >= 5 ? "var(--color-text-subtle)" : "inherit",
            }}
          />
          {errors.tags && (
            <p
              id="tags-error"
              data-testid="tags-error"
              style={{
                color: "var(--color-danger)",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {errors.tags}
            </p>
          )}
        </div>

        {/* Markdown editor */}
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="post-content" className="sr-only">
            本文
          </label>
          <MarkdownEditor
            id="post-content"
            name="content"
            value={content}
            onChange={setContent}
            placeholder="本文をMarkdownで入力してください…"
            ariaDescribedBy={errors.content ? "content-error" : undefined}
            ariaInvalid={Boolean(errors.content)}
          />
          {errors.content && (
            <p
              id="content-error"
              data-testid="content-error"
              style={{
                color: "var(--color-danger)",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {errors.content}
            </p>
          )}
        </div>

        {/* Submit error */}
        {submitError && (
          <p
            data-testid="submit-error"
            role="alert"
            aria-live="polite"
            style={{
              color: "var(--color-danger)",
              fontSize: 14,
              marginBottom: 16,
              padding: "8px 12px",
              background: "var(--color-danger-soft)",
              border: "1px solid var(--color-danger)",
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
              background: isSubmitDisabled
                ? "var(--color-text-subtle)"
                : "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: isSubmitDisabled ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {isSubmitting ? "投稿中…" : "投稿する"}
          </button>
        </div>
      </form>
    </div>
  );
}
