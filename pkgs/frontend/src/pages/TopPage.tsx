import type { PostSummary } from "@shin-blog-app/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlogPostCard } from "../components/blog/BlogPostCard.js";
import { api } from "../lib/api.js";

type Tab = "latest" | "trending";

export function TopPage() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  // Keep a ref to the latest nextCursor so the IntersectionObserver callback
  // can access the most-recent value without a stale closure.
  const nextCursorRef = useRef<string | undefined>(undefined);
  const isLoadingRef = useRef(false);

  // ── Data fetching ─────────────────────────────────────────────
  const loadPosts = useCallback(async (cursor?: string) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const result = await api.getPosts(cursor);
      setPosts((prev) => (cursor ? [...prev, ...result.posts] : result.posts));
      setNextCursor(result.nextCursor);
      nextCursorRef.current = result.nextCursor;
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void loadPosts(undefined);
  }, [loadPosts]);

  // ── Infinite scroll ───────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (
        entry.isIntersecting &&
        nextCursorRef.current &&
        !isLoadingRef.current
      ) {
        void loadPosts(nextCursorRef.current);
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadPosts]);

  // Keep nextCursorRef in sync with state so the observer callback is fresh
  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  // ── Derived data ──────────────────────────────────────────────
  // All unique tags from loaded posts
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));

  // Filter + sort
  const displayedPosts = posts
    .filter((post) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = post.title.toLowerCase().includes(q);
        const tagMatch = post.tags.some((t) => t.toLowerCase().includes(q));
        if (!titleMatch && !tagMatch) return false;
      }
      if (selectedTag && !post.tags.includes(selectedTag)) return false;
      return true;
    })
    .sort((a, b) => {
      if (activeTab === "trending") {
        // Simulate trending (no likes field): keep API order (createdAt DESC)
        return 0;
      }
      // latest: createdAt DESC
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // ── Handlers ─────────────────────────────────────────────────
  const handleTagChipClick = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
  };

  const handleCardClick = (postId: string) => {
    navigate(`/posts/${postId}`);
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Page title */}
      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginBottom: 24,
          color: "#1e293b",
        }}
      >
        Tech Blog
      </h1>

      {/* Tab switcher */}
      <div
        role="tablist"
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          borderBottom: "2px solid #e2e8f0",
        }}
      >
        {(["latest", "trending"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            data-testid={tab === "latest" ? "tab-latest" : "tab-trending"}
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 15,
              color: activeTab === tab ? "#6366f1" : "#64748b",
              borderBottom:
                activeTab === tab
                  ? "2px solid #6366f1"
                  : "2px solid transparent",
              marginBottom: -2,
              transition: "color 0.2s",
            }}
          >
            {tab === "latest" ? "最新" : "トレンド"}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 480 }}>
        <input
          data-testid="search-input"
          type="text"
          placeholder="タイトル・タグで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 40px 10px 14px",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {searchQuery && (
          <button
            type="button"
            data-testid="search-clear"
            onClick={() => setSearchQuery("")}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: "#94a3b8",
              lineHeight: 1,
            }}
            aria-label="検索をクリア"
          >
            ×
          </button>
        )}
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div
          data-testid="tag-chips"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              data-testid={`tag-chip-${tag}`}
              onClick={() => handleTagChipClick(tag)}
              style={{
                padding: "4px 14px",
                borderRadius: 9999,
                border:
                  selectedTag === tag
                    ? "2px solid #6366f1"
                    : "1px solid #e2e8f0",
                background: selectedTag === tag ? "#eef2ff" : "#f8fafc",
                color: selectedTag === tag ? "#4f46e5" : "#475569",
                fontWeight: selectedTag === tag ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && posts.length === 0 && (
        <p
          data-testid="loading"
          style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}
        >
          読み込み中...
        </p>
      )}

      {/* Empty state */}
      {!isLoading && displayedPosts.length === 0 && (
        <div
          data-testid="empty-state"
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "#94a3b8",
          }}
        >
          <p style={{ fontSize: 48, marginBottom: 16 }}>📭</p>
          <p style={{ fontSize: 18, fontWeight: 600 }}>記事がありません</p>
          <p style={{ fontSize: 14, marginTop: 8 }}>
            まだ投稿された記事はありません。
          </p>
        </div>
      )}

      {/* Post grid */}
      {displayedPosts.length > 0 && (
        <div
          data-testid="post-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {displayedPosts.map((post) => (
            <BlogPostCard
              key={post.postId}
              post={post}
              onClick={() => handleCardClick(post.postId)}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div
        ref={sentinelRef}
        data-testid="scroll-sentinel"
        style={{ height: 1 }}
      />

      {/* Loading more indicator */}
      {isLoading && posts.length > 0 && (
        <p
          data-testid="loading-more"
          style={{ color: "#94a3b8", textAlign: "center", padding: "16px 0" }}
        >
          読み込み中...
        </p>
      )}
    </div>
  );
}
