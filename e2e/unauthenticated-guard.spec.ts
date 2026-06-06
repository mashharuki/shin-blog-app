import { test, expect } from "@playwright/test";
import { mockApiRoutes } from "./helpers/api-mocks.js";

/**
 * テスト2: 未認証ガード
 *
 * 要件 1.4: 未認証のユーザーがブログ投稿画面にアクセスしようとした場合、
 *           ログイン画面にリダイレクトする
 * 要件 2.3: ログアウト後にブラウザの戻るボタンで認証必須画面に戻ろうとした
 *           場合、ログイン画面にリダイレクトする
 *
 * Auth state: None (unauthenticated)
 * Mock: Top page API calls only (no auth needed)
 */

test.describe("未認証ガード", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API calls so the top page doesn't show network errors
    await mockApiRoutes(page);
    // Ensure localStorage is empty (no auth tokens)
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test("未ログイン状態で /create にアクセスするとログインページにリダイレクトされる", async ({
    page,
  }) => {
    // Navigate to the protected route
    await page.goto("/create");

    // ProtectedRoute shows loading spinner first, then redirects.
    // Wait until the URL is /login (allow up to 10 seconds for Amplify
    // to determine there is no valid session and redirect).
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10_000 });

    // Verify the login page is rendered
    await expect(page.getByTestId("login-form")).toBeVisible();
    await expect(page.getByTestId("login-title")).toHaveText("ログイン");
  });

  test("/create への直接アクセスはトップページからも保護されている", async ({
    page,
  }) => {
    // Visit top page first
    await page.goto("/");
    // Then try to navigate to create
    await page.goto("/create");

    await expect(page).toHaveURL(/.*\/login/, { timeout: 10_000 });
  });

  test("ログインページ自体は未認証でもアクセス可能", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByTestId("login-form")).toBeVisible();
  });

  test("トップページは未認証でもアクセス可能", async ({ page }) => {
    await page.goto("/");
    // Should NOT redirect to login
    await expect(page).not.toHaveURL(/.*\/login/);
    // NavBar is always rendered
    await expect(page.getByTestId("navbar")).toBeVisible();
  });

  test("ログインページにメールとパスワード入力フォームが表示される", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByTestId("email-input")).toBeVisible();
    await expect(page.getByTestId("password-input")).toBeVisible();
    await expect(page.getByTestId("login-button")).toBeVisible();
  });

  test("未入力でログインボタンを押すとバリデーションエラーが表示される", async ({
    page,
  }) => {
    await page.goto("/login");
    // Submit with empty fields
    await page.getByTestId("login-button").click();
    await expect(page.getByTestId("email-error")).toBeVisible();
    await expect(page.getByTestId("password-error")).toBeVisible();
  });
});
