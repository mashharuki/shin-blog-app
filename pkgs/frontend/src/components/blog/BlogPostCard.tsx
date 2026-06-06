import type { PostSummary } from '@shin-blog-app/shared';
import { getTagColor } from '../../lib/tagColors.js';

export interface BlogPostCardProps {
  post: PostSummary;
  onClick: () => void;
}

/** Compute estimated read time from excerpt word count. */
function calcReadTime(excerpt: string): number {
  return Math.max(1, Math.ceil(excerpt.split(' ').length / 200));
}

/** Format ISO date string to locale date. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: '#6366f1',
        color: '#fff',
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
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        background: color,
        marginRight: 4,
      }}
    >
      {tag}
    </span>
  );
}

export function BlogPostCard({ post, onClick }: BlogPostCardProps) {
  const { title, authorName, tags, createdAt, excerpt } = post;
  const readTime = calcReadTime(excerpt);
  const visibleTags = tags.slice(0, 3);

  return (
    <button
      type="button"
      data-testid="blog-post-card"
      onClick={onClick}
      style={{
        all: 'unset',
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '20px 24px',
        cursor: 'pointer',
        background: '#fff',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = '#6366f1';
        el.style.boxShadow = '0 8px 24px rgba(99,102,241,0.15)';
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = '#e2e8f0';
        el.style.boxShadow = '';
        el.style.transform = '';
      }}
    >
      {/* Author row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <AuthorAvatar name={authorName} />
        <span style={{ fontSize: 13, color: '#64748b' }}>
          {authorName}
          <span style={{ margin: '0 4px' }}>·</span>
          {formatDate(createdAt)}
        </span>
      </div>

      {/* Title */}
      <h2
        style={{
          margin: '0 0 8px',
          fontSize: 18,
          fontWeight: 700,
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          color: '#1e293b',
        }}
      >
        {title}
      </h2>

      {/* Excerpt */}
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 14,
          color: '#64748b',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
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
      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />

      {/* Footer: readTime + likes */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 13,
          color: '#94a3b8',
        }}
      >
        <span aria-label="読了時間">⏱ {readTime}分</span>
      </div>
    </button>
  );
}
