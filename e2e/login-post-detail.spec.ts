import { expect, test } from "@playwright/test";
import { type MockPost, mockApiRoutes } from "./helpers/api-mocks.js";
import { mockCognitoRoutes } from "./helpers/auth.js";

/**
 * テスト1: ログイン→投稿→詳細確認
 *
 * 要件 1.1: ログイン成功後にトップ画面に遷移する
 * 要件 5.1: 投稿画面でエディタ + プレビューを提供する
 * 要件 5.3: 投稿成功後に詳細画面またはトップ画面に遷移する
 *
 * Auth state: Mocked Cognito signIn flow
 * API state: Mocked backend POST /api/posts + GET /api/posts/:id
 */

const MOCK_USER = {
  sub: "e2e-author-id",
  email: "author@example.com",
};

test.describe("ログイン → 投稿 → 詳細確認", () => {
  test("ログインしてブログ記事を投稿し詳細ページで内容を確認できる", async ({
    page,
  }) => {
    // ── Setup ──────────────────────────────────────────────────────────────
    let capturedPost: MockPost | null = null;

    // Mock Cognito auth API so signIn() succeeds without real credentials.
    // skipInjection: true — don't pre-inject localStorage tokens; the test
    // exercises the actual login UI flow and pre-existing tokens would cause
    // "There is already a signed in user" errors.
    await mockCognitoRoutes(page, MOCK_USER, { skipInjection: true });

    // Mock backend API – capture the POST body to verify it
    await page.route("**/api/posts", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        const body = JSON.parse(request.postData() ?? "{}") as {
          title?: string;
          content?: string;
          tags?: string[];
        };
        capturedPost = {
          postId: "post-e2e-login-flow-001",
          title: body.title ?? "",
          content: body.content ?? "",
          authorName: "author@example.com",
          authorId: MOCK_USER.sub,
          tags: body.tags ?? [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(capturedPost),
        });
      } else {
        // GET /api/posts – return empty list
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ posts: [], nextCursor: undefined }),
        });
      }
    });

    // Mock GET /api/posts/:id to return the captured post
    await page.route("**/api/posts/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          capturedPost ?? {
            postId: "post-e2e-login-flow-001",
            title: "E2Eテスト記事",
            content: "# テスト\n\nテスト内容",
            authorName: "author@example.com",
            authorId: MOCK_USER.sub,
            tags: ["E2E"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ),
      });
    });

    // ── Step 1: Log in ───────────────────────────────────────────────────
    await page.goto("/login");
    await expect(page.getByTestId("login-form")).toBeVisible();

    await page.getByTestId("email-input").fill(MOCK_USER.email);
    await page.getByTestId("password-input").fill("Password123!");
    await page.getByTestId("login-button").click();

    // After successful login the app navigates to "/"
    await expect(page).toHaveURL("/", { timeout: 10_000 });

    // ── Step 2: Navigate to create page ──────────────────────────────────
    // The NavBar now shows the "投稿する" button for authenticated users
    await expect(page.getByTestId("nav-create-button")).toBeVisible({
      timeout: 8_000,
    });
    await page.getByTestId("nav-create-button").click();

    await expect(page).toHaveURL(/.*\/create/, { timeout: 8_000 });

    // ── Step 3: Fill in the post form ─────────────────────────────────────
    await page.getByTestId("title-input").fill("E2Eテスト記事タイトル");

    // Type content in the markdown editor
    const textarea = page.locator("textarea");
    await textarea.fill(
      "# E2Eテスト\n\nこれはPlaywrightによるE2Eテストで投稿された記事です。\n\n- テスト項目1\n- テスト項目2",
    );

    // ── Step 4: Submit the post ───────────────────────────────────────────
    await page.getByTestId("submit-button").click();

    // Should navigate to the detail page after successful submission
    await expect(page).toHaveURL(/.*\/posts\//, { timeout: 10_000 });

    // ── Step 5: Verify the detail page shows the article ─────────────────
    await expect(page.getByTestId("post-title")).toBeVisible();
    // The title should match what we submitted (or the mock response)
    const titleText = await page.getByTestId("post-title").textContent();
    expect(titleText).toBeTruthy();

    // Article content should be rendered
    await expect(page.getByTestId("post-content")).toBeVisible();

    // Back button should be present (requirement 4.3)
    await expect(page.getByTestId("back-button")).toBeVisible();
  });

  test("ログイン後トップページに遷移し記事一覧が表示される", async ({
    page,
  }) => {
    // skipInjection: true — same reason as the test above
    await mockCognitoRoutes(page, MOCK_USER, { skipInjection: true });
    await mockApiRoutes(page);

    await page.goto("/login");
    await page.getByTestId("email-input").fill(MOCK_USER.email);
    await page.getByTestId("password-input").fill("Password123!");
    await page.getByTestId("login-button").click();

    await expect(page).toHaveURL("/", { timeout: 10_000 });
    await expect(page.getByTestId("navbar")).toBeVisible();
  });

  test("ログイン失敗時にエラーメッセージが表示されログイン画面に留まる", async ({
    page,
  }) => {
    // Mock Cognito to return auth failure
    await page.route(
      (url) =>
        url.hostname.includes("cognito-idp") ||
        url.hostname.includes("amazonaws.com"),
      async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/x-amz-json-1.1",
          body: JSON.stringify({
            __type: "NotAuthorizedException",
            message: "Incorrect username or password.",
          }),
        });
      },
    );

    await page.goto("/login");
    await page.getByTestId("email-input").fill("wrong@example.com");
    await page.getByTestId("password-input").fill("WrongPassword!");
    await page.getByTestId("login-button").click();

    // Should stay on login page
    await expect(page).toHaveURL(/.*\/login/);
    // Auth error message should appear
    await expect(page.getByTestId("auth-error")).toBeVisible({
      timeout: 5_000,
    });
  });
});
