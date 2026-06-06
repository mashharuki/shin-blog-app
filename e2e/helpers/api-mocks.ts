import type { Page } from "@playwright/test";

/**
 * API mocking helpers for E2E tests.
 *
 * Intercepts calls to the Hono backend (`http://localhost:3000/api/...`) and
 * returns deterministic fixture data so tests don't need a running backend.
 */

export interface MockPost {
  postId: string;
  title: string;
  content: string;
  authorName: string;
  authorId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MockPostSummary {
  postId: string;
  title: string;
  excerpt: string;
  authorName: string;
  authorId: string;
  tags: string[];
  createdAt: string;
}

export const MOCK_POST: MockPost = {
  postId: "post-e2e-001",
  title: "E2Eテスト用記事",
  content:
    "# E2Eテスト用記事\n\nこれはPlaywrightのE2Eテスト用に作成されたサンプル記事です。\n\n## セクション1\n\n本文テキストです。",
  authorName: "テストユーザー",
  authorId: "test-user-id",
  tags: ["テスト", "E2E"],
  createdAt: "2024-01-15T10:00:00.000Z",
  updatedAt: "2024-01-15T10:00:00.000Z",
};

export const MOCK_POSTS_SUMMARY: MockPostSummary[] = [
  {
    postId: MOCK_POST.postId,
    title: MOCK_POST.title,
    excerpt: "これはPlaywrightのE2Eテスト用に作成されたサンプル記事です。",
    authorName: MOCK_POST.authorName,
    authorId: MOCK_POST.authorId,
    tags: MOCK_POST.tags,
    createdAt: MOCK_POST.createdAt,
  },
];

/**
 * Registers route handlers that mock all backend API calls.
 * Must be called before page.goto().
 */
export async function mockApiRoutes(
  page: Page,
  overrides: { createdPost?: MockPost } = {},
): Promise<void> {
  const createdPost = overrides.createdPost ?? MOCK_POST;

  // GET /api/posts  (list)
  await page.route("**/api/posts", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          posts: MOCK_POSTS_SUMMARY,
          nextCursor: undefined,
        }),
      });
    } else if (request.method() === "POST") {
      // POST /api/posts  (create)
      const body = JSON.parse(request.postData() ?? "{}") as {
        title?: string;
        content?: string;
        tags?: string[];
      };
      const newPost: MockPost = {
        postId: "post-e2e-new-" + Date.now(),
        title: body.title ?? createdPost.title,
        content: body.content ?? createdPost.content,
        authorName: createdPost.authorName,
        authorId: createdPost.authorId,
        tags: body.tags ?? createdPost.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(newPost),
      });
    } else {
      await route.continue();
    }
  });

  // GET /api/posts/:id  (detail)
  await page.route("**/api/posts/*", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(createdPost),
      });
    } else {
      await route.continue();
    }
  });
}
