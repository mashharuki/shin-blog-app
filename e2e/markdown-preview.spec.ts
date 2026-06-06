import { expect, test } from "@playwright/test";
import { mockApiRoutes } from "./helpers/api-mocks.js";
import { mockCognitoRoutes } from "./helpers/auth.js";

/**
 * テスト3: マークダウンプレビュー
 *
 * 要件 5.1: 認証済みユーザーがブログ投稿画面にいる場合、タイトル入力欄・
 *           マークダウン本文エディタ・リアルタイムプレビューエリアを提供する
 * 要件 5.2: ユーザーがマークダウン本文エディタに入力した場合、プレビューエリアに
 *           入力と同時にHTMLとしてレンダリングされた内容を反映する
 *
 * Auth state: Mocked (injected via localStorage + Cognito route mock)
 */

const MOCK_USER = {
  sub: "e2e-test-user-id",
  email: "e2e@example.com",
};

test.describe("マークダウンプレビュー", () => {
  test.beforeEach(async ({ page }) => {
    // Set up auth and API mocks before any navigation
    await mockCognitoRoutes(page, MOCK_USER);
    await mockApiRoutes(page);
  });

  test("投稿画面にタイトル入力欄・エディタ・プレビューエリアが表示される", async ({
    page,
  }) => {
    await page.goto("/create");

    // Wait until we are NOT on the login page (auth resolved)
    await expect(page).not.toHaveURL(/.*\/login/, { timeout: 10_000 });

    // Verify editor components are present
    await expect(page.getByTestId("title-input")).toBeVisible();
    await expect(page.getByTestId("submit-button")).toBeVisible();

    // The MarkdownEditor renders mode tabs; default is "edit"
    // Click the "プレビュー" tab to show the preview pane
    await page.getByRole("button", { name: "プレビュー" }).click();
    await expect(page.getByTestId("preview-pane")).toBeVisible();
  });

  test("マークダウン入力後プレビューエリアにリアルタイムに反映される", async ({
    page,
  }) => {
    await page.goto("/create");
    await expect(page).not.toHaveURL(/.*\/login/, { timeout: 10_000 });

    // Switch to split (分割) mode to see editor and preview simultaneously
    await page.getByRole("button", { name: "分割" }).click();

    // The textarea is visible in edit/split mode
    const textarea = page.locator("textarea");
    await textarea.fill("# Hello Playwright\n\nThis is a **bold** test.");

    // Preview pane should render the markdown immediately
    const previewPane = page.getByTestId("preview-pane");
    await expect(previewPane).toBeVisible();

    // React-markdown renders `# Hello Playwright` as an <h1>
    await expect(previewPane.locator("h1")).toHaveText("Hello Playwright");

    // Bold text becomes <strong>
    await expect(previewPane.locator("strong")).toHaveText("bold");
  });

  test("分割モードでエディタとプレビューが並列表示される", async ({ page }) => {
    await page.goto("/create");
    await expect(page).not.toHaveURL(/.*\/login/, { timeout: 10_000 });

    // Switch to split mode
    await page.getByRole("button", { name: "分割" }).click();

    // Both textarea (editor) and preview pane should be visible
    await expect(page.locator("textarea")).toBeVisible();
    await expect(page.getByTestId("preview-pane")).toBeVisible();
  });

  test("プレビューモードではエディタが非表示になりプレビューのみ表示される", async ({
    page,
  }) => {
    await page.goto("/create");
    await expect(page).not.toHaveURL(/.*\/login/, { timeout: 10_000 });

    // Type some markdown in edit mode first
    const textarea = page.locator("textarea");
    await textarea.fill("## プレビュー専用テスト");

    // Switch to preview mode
    await page.getByRole("button", { name: "プレビュー" }).click();

    // Preview pane visible; textarea hidden
    await expect(page.getByTestId("preview-pane")).toBeVisible();
    await expect(page.locator("textarea")).not.toBeVisible();

    // H2 is rendered from the markdown input
    await expect(page.getByTestId("preview-pane").locator("h2")).toHaveText(
      "プレビュー専用テスト",
    );
  });

  test("ツールバーのBoldボタンで選択テキストに**が挿入される", async ({
    page,
  }) => {
    await page.goto("/create");
    await expect(page).not.toHaveURL(/.*\/login/, { timeout: 10_000 });

    const textarea = page.locator("textarea");
    await textarea.fill("hello world");

    // Select all and click Bold button
    await textarea.focus();
    await textarea.selectText();
    await page.getByTitle("Bold").click();

    // The textarea value should now wrap the text with **
    const value = await textarea.inputValue();
    expect(value).toContain("**");
  });

  test("コードブロックのMarkdownがプレビューでレンダリングされる", async ({
    page,
  }) => {
    await page.goto("/create");
    await expect(page).not.toHaveURL(/.*\/login/, { timeout: 10_000 });

    await page.getByRole("button", { name: "分割" }).click();
    const textarea = page.locator("textarea");
    await textarea.fill("```typescript\nconst x = 42;\n```");

    const previewPane = page.getByTestId("preview-pane");
    // rehype-highlight wraps code in <code>
    await expect(previewPane.locator("code")).toBeVisible();
  });
});
