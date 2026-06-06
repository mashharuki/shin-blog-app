import type { Post, PostSummary } from "@shin-blog-app/shared";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate, useParams } from "react-router-dom";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { api } from "../lib/api.js";
import { getTagColor } from "../lib/tagColors.js";

// ── Utilities ──────────────────────────────────────────────────

interface TocHeading {
  level: number;
  text: string;
  id: string;
}

/** Extract h1-h3 headings from raw markdown using a regex. */
function extractHeadings(content: string): TocHeading[] {
  const regex = /^(#{1,3})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let match = regex.exec(content);
  while (match !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ level, text, id });
    match = regex.exec(content);
  }
  return headings;
}

/** Format ISO date string to Japanese locale. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Estimate reading time (words / 200, minimum 1 min). */
function calcReadTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
}

// ── Sub-components ─────────────────────────────────────────────

function AuthorAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <span
      data-testid="author-avatar"
      aria-label={`${name}のアバター`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "#6366f1",
        color: "#fff",
        fontWeight: 700,
        fontSize: 18,
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
}

function TagBadge({ tag }: { tag: string }) {
  const color = getTagColor(tag);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        color: "#fff",
        background: color,
        marginRight: 6,
      }}
    >
      {tag}
    </span>
  );
}

/**
 * Table of Contents component.
 * Renders a mobile accordion (data-testid="toc-toggle") and
 * a desktop sticky sidebar — both inside one data-testid="toc" wrapper.
 */
function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (headings.length === 0) return null;

  const tocItems = (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {headings.map((h, idx) => (
        <li
          // biome-ignore lint/suspicious/noArrayIndexKey: heading list is static for a given post
          key={idx}
          style={{ paddingLeft: (h.level - 1) * 12, marginBottom: 6 }}
        >
          <a
            href={`#${h.id}`}
            style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <nav data-testid="toc" aria-label="目次">
      {/* Mobile: accordion */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          data-testid="toc-toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 16px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: mobileOpen ? "8px 8px 0 0" : 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            color: "#1e293b",
          }}
        >
          <span>目次</span>
          <span style={{ fontSize: 10 }}>{mobileOpen ? "▲" : "▼"}</span>
        </button>
        {mobileOpen && (
          <div
            style={{
              padding: "12px 16px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
            }}
          >
            {tocItems}
          </div>
        )}
      </div>

      {/* Desktop: always-open sticky panel (visible via CSS) */}
      <div
        style={{
          position: "sticky",
          top: 24,
          padding: "16px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}
      >
        <p
          style={{
            fontWeight: 700,
            fontSize: 13,
            marginTop: 0,
            marginBottom: 12,
            color: "#1e293b",
          }}
        >
          目次
        </p>
        {tocItems}
      </div>
    </nav>
  );
}

// ── Main page component ────────────────────────────────────────

export function BlogDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [allPosts, setAllPosts] = useState<PostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!postId) return;

    setIsLoading(true);
    setError(null);

    void Promise.all([api.getPost(postId), api.getPosts()])
      .then(([fetchedPost, { posts }]) => {
        setPost(fetchedPost);
        setAllPosts(posts);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "記事の取得に失敗しました",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [postId]);

  const handleBack = () => {
    navigate(-1);
  };

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "40px 16px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p data-testid="loading" style={{ color: "#94a3b8" }}>
          読み込み中...
        </p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error || !post) {
    return (
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "40px 16px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p
          data-testid="error-message"
          style={{ fontSize: 18, color: "#ef4444", marginBottom: 16 }}
        >
          {error ?? "記事が見つかりません"}
        </p>
        <a
          data-testid="back-to-top-link"
          href="/"
          style={{
            color: "#6366f1",
            textDecoration: "underline",
            fontSize: 15,
          }}
        >
          トップページへ戻る
        </a>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────
  const headings = extractHeadings(post.content);
  const readTime = calcReadTime(post.content);

  // Related posts: same tags, exclude current post, top 3
  const relatedPosts = allPosts
    .filter(
      (p) => p.postId !== postId && p.tags.some((t) => post.tags.includes(t)),
    )
    .slice(0, 3);

  // ── Render ───────────────────────────────────────────────────
  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Back navigation */}
      <button
        type="button"
        data-testid="back-button"
        onClick={handleBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          background: "none",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 14,
          color: "#64748b",
          marginBottom: 28,
        }}
      >
        ← 一覧に戻る
      </button>

      {/* Content layout: article + TOC sidebar */}
      <div
        style={{
          display: "flex",
          gap: 40,
          alignItems: "flex-start",
        }}
      >
        {/* Main article */}
        <article style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <h1
            data-testid="post-title"
            style={{
              fontSize: 32,
              fontWeight: 800,
              lineHeight: 1.3,
              color: "#1e293b",
              marginTop: 0,
              marginBottom: 20,
            }}
          >
            {post.title}
          </h1>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div data-testid="post-tags" style={{ marginBottom: 16 }}>
              {post.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}

          {/* Meta bar: avatar, author, date, read time, actions */}
          <div
            data-testid="post-meta"
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 32,
              paddingBottom: 20,
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <AuthorAvatar name={post.authorName} />
            <div style={{ flex: 1 }}>
              <div
                data-testid="author-name"
                style={{ fontWeight: 600, fontSize: 15, color: "#1e293b" }}
              >
                {post.authorName}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 2,
                  fontSize: 13,
                  color: "#64748b",
                  flexWrap: "wrap",
                }}
              >
                <span data-testid="post-date">
                  {formatDate(post.createdAt)}
                </span>
                <span data-testid="read-time">⏱ {readTime}分で読めます</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button
                type="button"
                data-testid="like-button"
                onClick={() => setLiked((v) => !v)}
                aria-pressed={liked}
                aria-label="いいね"
                style={{
                  padding: "6px 14px",
                  border: liked ? "2px solid #ef4444" : "1px solid #e2e8f0",
                  borderRadius: 8,
                  background: liked ? "#fff1f1" : "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  color: liked ? "#ef4444" : "#64748b",
                }}
              >
                {liked ? "❤️" : "🤍"}
              </button>
              <button
                type="button"
                data-testid="save-button"
                onClick={() => setSaved((v) => !v)}
                aria-pressed={saved}
                aria-label="保存"
                style={{
                  padding: "6px 14px",
                  border: saved ? "2px solid #6366f1" : "1px solid #e2e8f0",
                  borderRadius: 8,
                  background: saved ? "#eef2ff" : "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  color: saved ? "#6366f1" : "#64748b",
                }}
              >
                🔖
              </button>
              <button
                type="button"
                data-testid="share-button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    void navigator.clipboard.writeText(window.location.href);
                  }
                }}
                aria-label="シェア"
                style={{
                  padding: "6px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#64748b",
                }}
              >
                共有
              </button>
            </div>
          </div>

          {/* Markdown content */}
          <div
            data-testid="post-content"
            style={{ lineHeight: 1.8, color: "#334155", fontSize: 16 }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </article>

        {/* Desktop sticky TOC sidebar */}
        <aside
          style={{
            flexShrink: 0,
            width: 260,
          }}
        >
          <TableOfContents headings={headings} />
        </aside>
      </div>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section
          data-testid="related-posts"
          style={{
            marginTop: 48,
            paddingTop: 32,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#1e293b",
              marginTop: 0,
              marginBottom: 20,
            }}
          >
            関連記事
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {relatedPosts.map((p) => (
              <a
                key={p.postId}
                data-testid="related-post-item"
                href={`/posts/${p.postId}`}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  textDecoration: "none",
                  color: "inherit",
                  background: "#fff",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  {p.tags.slice(0, 2).map((tag) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#1e293b",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {p.title}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    marginTop: 6,
                    marginBottom: 0,
                  }}
                >
                  {p.authorName} · {formatDate(p.createdAt)}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
