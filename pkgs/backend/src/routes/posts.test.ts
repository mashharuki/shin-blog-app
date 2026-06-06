import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { PostSummary, Post } from "@shin-blog-app/shared";

// Set required env vars BEFORE any module imports that might trigger auth module initialization
vi.stubEnv("COGNITO_USER_POOL_ID", "test-pool-id");
vi.stubEnv("COGNITO_CLIENT_ID", "test-client-id");

// Mock repository
const mockListPosts = vi.fn();
const mockGetPost = vi.fn();
const mockCreatePost = vi.fn();

vi.mock("../repositories/post.repository.js", () => ({
  DynamoDBPostRepository: vi.fn(() => ({
    listPosts: mockListPosts,
    getPost: mockGetPost,
    createPost: mockCreatePost,
  })),
}));

// Mock auth middleware - by default passes through with fake user
vi.mock("../middleware/auth.js", () => ({
  cognitoAuthMiddleware: vi.fn(
    async (
      c: { set: (key: string, value: unknown) => void },
      next: () => Promise<void>,
    ) => {
      c.set("jwtPayload", { sub: "user123", email: "test@example.com" });
      await next();
    },
  ),
}));

// Dynamic import AFTER mocks are set up
const { postsRouter } = await import("./posts.js");

// Helper to build the app
function buildApp() {
  const app = new Hono();
  app.route("/api/posts", postsRouter);
  return app;
}

// -----------------------------------------------------------------------
// Test data
// -----------------------------------------------------------------------
const samplePostSummary: PostSummary = {
  postId: "post-1",
  title: "Hello World",
  authorEmail: "test@example.com",
  authorName: "test",
  tags: ["TypeScript"],
  createdAt: "2024-01-01T00:00:00.000Z",
  excerpt: "This is an excerpt",
};

const samplePost: Post = {
  postId: "post-1",
  title: "Hello World",
  content: "Full content here",
  authorId: "user123",
  authorEmail: "test@example.com",
  authorName: "test",
  tags: ["TypeScript"],
  createdAt: "2024-01-01T00:00:00.000Z",
};

const createdPost: Post = {
  postId: "new-post-id",
  title: "New Post",
  content: "Post content",
  authorId: "user123",
  authorEmail: "test@example.com",
  authorName: "test",
  tags: [],
  createdAt: "2024-06-01T00:00:00.000Z",
};

// -----------------------------------------------------------------------
// GET /api/posts
// -----------------------------------------------------------------------
describe("GET /api/posts", () => {
  beforeEach(() => {
    mockListPosts.mockReset();
    mockGetPost.mockReset();
    mockCreatePost.mockReset();
  });

  it("returns 200 with posts array when no cursor provided", async () => {
    mockListPosts.mockResolvedValueOnce({
      posts: [samplePostSummary],
      nextCursor: undefined,
    });

    const app = buildApp();
    const res = await app.request("/api/posts");

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      posts: PostSummary[];
      nextCursor?: string;
    };
    expect(body.posts).toHaveLength(1);
    expect(body.posts[0].postId).toBe("post-1");
    expect(body.nextCursor).toBeUndefined();
    expect(mockListPosts).toHaveBeenCalledWith(undefined);
  });

  it("passes cursor query parameter to listPosts", async () => {
    mockListPosts.mockResolvedValueOnce({ posts: [], nextCursor: undefined });

    const app = buildApp();
    const res = await app.request("/api/posts?cursor=abc123");

    expect(res.status).toBe(200);
    expect(mockListPosts).toHaveBeenCalledWith("abc123");
  });

  it("returns nextCursor in response when repository returns one", async () => {
    mockListPosts.mockResolvedValueOnce({
      posts: [samplePostSummary],
      nextCursor: "next-cursor-value",
    });

    const app = buildApp();
    const res = await app.request("/api/posts");

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      posts: PostSummary[];
      nextCursor?: string;
    };
    expect(body.nextCursor).toBe("next-cursor-value");
  });
});

// -----------------------------------------------------------------------
// GET /api/posts/:id
// -----------------------------------------------------------------------
describe("GET /api/posts/:id", () => {
  beforeEach(() => {
    mockListPosts.mockReset();
    mockGetPost.mockReset();
    mockCreatePost.mockReset();
  });

  it("returns 200 with post when it exists", async () => {
    mockGetPost.mockResolvedValueOnce(samplePost);

    const app = buildApp();
    const res = await app.request("/api/posts/post-1");

    expect(res.status).toBe(200);
    const body = (await res.json()) as Post;
    expect(body.postId).toBe("post-1");
    expect(body.title).toBe("Hello World");
    expect(body.content).toBe("Full content here");
    expect(mockGetPost).toHaveBeenCalledWith("post-1");
  });

  it("returns 404 with error message when post does not exist", async () => {
    mockGetPost.mockResolvedValueOnce(null);

    const app = buildApp();
    const res = await app.request("/api/posts/nonexistent-id");

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Post not found");
  });
});

// -----------------------------------------------------------------------
// POST /api/posts
// -----------------------------------------------------------------------
describe("POST /api/posts", () => {
  beforeEach(() => {
    mockListPosts.mockReset();
    mockGetPost.mockReset();
    mockCreatePost.mockReset();
  });

  it("returns 201 with created post when valid body and auth provided", async () => {
    mockCreatePost.mockResolvedValueOnce(createdPost);

    const app = buildApp();
    const res = await app.request("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({ title: "New Post", content: "Post content" }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as Post;
    expect(body.postId).toBe("new-post-id");
    expect(body.title).toBe("New Post");
    expect(mockCreatePost).toHaveBeenCalledWith({
      title: "New Post",
      content: "Post content",
      tags: [],
      authorId: "user123",
      authorEmail: "test@example.com",
    });
  });

  it("returns 400 with validation error when title is missing", async () => {
    const app = buildApp();
    const res = await app.request("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({ content: "Post content without title" }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; details: unknown };
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeDefined();
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("returns 400 with validation error when content is missing", async () => {
    const app = buildApp();
    const res = await app.request("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-token",
      },
      body: JSON.stringify({ title: "Title only" }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; details: unknown };
    expect(body.error).toBe("Validation failed");
    expect(mockCreatePost).not.toHaveBeenCalled();
  });

  it("returns 401 when auth middleware rejects the request", async () => {
    const { cognitoAuthMiddleware } = await import("../middleware/auth.js");
    // Override mock for this test to simulate auth failure
    vi.mocked(cognitoAuthMiddleware).mockImplementationOnce(async (c) => {
      return c.json({ error: "Unauthorized" }, 401);
    });

    const app = buildApp();
    const res = await app.request("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Post", content: "Post content" }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Unauthorized");
    expect(mockCreatePost).not.toHaveBeenCalled();
  });
});
