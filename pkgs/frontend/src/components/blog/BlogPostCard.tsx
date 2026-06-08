import type { PostSummary } from "@shin-blog-app/shared";
import { Link } from "react-router-dom";
import { getTagColor } from "../../lib/tagColors.js";

export interface BlogPostCardProps {
  post: PostSummary;
  to: string;
}

/** Compute estimated read time from excerpt word count. */
function calcReadTime(excerpt: string): number {
  return Math.max(1, Math.ceil(excerpt.split(" ").length / 200));
}

/** Format ISO date string to locale date. */
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

/** Avatar placeholder using author initials. */
function AuthorAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <span
      aria-label={`${name}のアバター`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "var(--color-primary)",
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
}

/** Colored badge for a single tag. */
function TagBadge({ tag }: { tag: string }) {
  const color = getTagColor(tag);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        color: "#fff",
        background: color,
        marginRight: 4,
      }}
    >
      {tag}
    </span>
  );
}

export function BlogPostCard({ post, to }: BlogPostCardProps) {
  const { title, authorName, tags, createdAt, excerpt } = post;
  const readTime = calcReadTime(excerpt);
  const visibleTags = tags.slice(0, 3);

  return (
    <Link
      to={to}
      data-testid="blog-post-card"
      className="block h-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left no-underline shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card)]"
    >
      {/* Author row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <AuthorAvatar name={authorName} />
        <span
          style={{
            fontSize: 13,
            color: "var(--color-text-muted)",
            minWidth: 0,
          }}
        >
          {authorName}
          <span style={{ margin: "0 4px" }}>·</span>
          {formatDate(createdAt)}
        </span>
      </div>

      {/* Title */}
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          color: "var(--color-text-strong)",
        }}
      >
        {title}
      </h2>

      {/* Excerpt */}
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 14,
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {excerpt}
      </p>

      {/* Tags */}
      {visibleTags.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {visibleTags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}

      {/* Separator */}
      <hr
        style={{
          border: "none",
          borderTop: "1px solid var(--color-border)",
          margin: "8px 0",
        }}
      />

      {/* Footer: readTime + likes */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 13,
          color: "var(--color-text-subtle)",
        }}
      >
        <span aria-label="読了時間">⏱ {readTime}分</span>
      </div>
    </Link>
  );
}
