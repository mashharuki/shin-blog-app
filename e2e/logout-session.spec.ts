import { expect, test } from "@playwright/test";
import { mockApiRoutes } from "./helpers/api-mocks.js";
import { mockCognitoRoutes, skipNextAuthInjection } from "./helpers/auth.js";

/**
 * テスト4: ログアウト → セッション切断
 *
 * 要件 2.2: 認証済みユーザーがログアウト操作を実行した場合、現在の認証状態を
 *           終了しログイン画面に遷移する
 * 要件 2.3: ログアウト後にブラウザの戻るボタンで認証必須画面に戻ろうとした
 *           場合、ログイン画面にリダイレクトする
 *
 * Auth state: Pre-injected (authenticated), then signed out
 */

const MOCK_USER = {
  sub: "e2e-logout-test-user-id",
  email: "logout-test@example.com",
};

test.describe("ログアウト → セッション切断", () => {
  test.beforeEach(async ({ page }) => {
    await mockCognitoRoutes(page, MOCK_USER);
    await mockApiRoutes(page);
  });

  test("ログアウト後にログインページに遷移する", async ({ page }) => {
    // Start on home page as authenticated user
    await page.goto("/");
    // Wait for auth to resolve – NavBar shows logout UI for authenticated users
    await expect(page.getByTestId("avatar-dropdown-trigger")).toBeVisible({
      timeout: 10_000,
    });

    // Open avatar dropdown and click logout button
    await page.getByTestId("avatar-dropdown-trigger").click();
    await expect(page.getByTestId("avatar-dropdown")).toBeVisible();
    await page.getByTestId("nav-logout-button").click();

    // Should navigate to /login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 8_000 });
    await expect(page.getByTestId("login-form")).toBeVisible();
  });

  test("ログアウト後にブラウザの戻るボタンで /create に戻れない", async ({
    page,
  }) => {
    // Start on home page as authenticated user (full page load – auth injected here)
    await page.goto("/");
    await expect(page.getByTestId("avatar-dropdown-trigger")).toBeVisible({
      timeout: 10_000,
    });

    // Navigate to /create via SPA (clicking the NavBar button) so that /create
    // is in the SPA history stack but NOT as a separate full-page document.
    // This way page.goBack() later will trigger a popstate (SPA navigation) back
    // to /create rather than a full document restore, ensuring React Router and
    // ProtectedRoute can re-evaluate auth state correctly.
    await page.getByTestId("nav-create-button").click();
    await expect(page).toHaveURL(/.*\/create/, { timeout: 8_000 });

    // Log out from /create via NavBar avatar dropdown
    await page.getByTestId("avatar-dropdown-trigger").click();
    await expect(page.getByTestId("avatar-dropdown")).toBeVisible();
    await page.getByTestId("nav-logout-button").click();

    // Wait for redirect to login page
    await expect(page).toHaveURL(/.*\/login/, { timeout: 8_000 });

    // Press the browser back button – goes to /create (SPA popstate, same document).
    // ProtectedRoute re-mounts, fetchAuthSession() returns empty (tokens cleared by
    // signOut), user = null → redirects to /login.
    await page.goBack();

    // After going back, ProtectedRoute detects no auth and redirects to /login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 8_000 });
    // The login form should be shown, not the create page
    await expect(page.getByTestId("login-form")).toBeVisible();
  });

  test("ログアウト後 /create に直接アクセスしてもリダイレクトされる", async ({
    page,
  }) => {
    // Start authenticated
    await page.goto("/");
    await expect(page.getByTestId("avatar-dropdown-trigger")).toBeVisible({
      timeout: 10_000,
    });

    // Log out via NavBar
    await page.getByTestId("avatar-dropdown-trigger").click();
    await page.getByTestId("nav-logout-button").click();
    await expect(page).toHaveURL(/.*\/login/, { timeout: 8_000 });

    // Prevent addInitScript from re-injecting auth tokens on the next full page
    // load (sessionStorage persists across same-origin page.goto() calls).
    await skipNextAuthInjection(page);

    // Try to navigate directly to /create while logged out
    await page.goto("/create");
    await expect(page).toHaveURL(/.*\/login/, { timeout: 8_000 });
    await expect(page.getByTestId("login-form")).toBeVisible();
  });

  test("ログアウト後にログインボタンが NavBar に表示される", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("avatar-dropdown-trigger")).toBeVisible({
      timeout: 10_000,
    });

    // Log out
    await page.getByTestId("avatar-dropdown-trigger").click();
    await page.getByTestId("nav-logout-button").click();
    await expect(page).toHaveURL(/.*\/login/, { timeout: 8_000 });

    // Navigate to top page via SPA (click the "ホーム" NavBar link) to avoid
    // a full page.goto("/") which would re-inject auth tokens via addInitScript.
    await page.getByTestId("nav-home").click();
    await expect(page).toHaveURL("/", { timeout: 5_000 });

    // NavBar should now show the login button (not the create/avatar buttons)
    await expect(page.getByTestId("nav-login-button")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByTestId("nav-create-button")).not.toBeVisible();
  });

  test("モバイルメニューからもログアウトできる", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("navbar")).toBeVisible({
      timeout: 10_000,
    });

    // Open mobile menu
    await page.getByTestId("mobile-menu-toggle").click();
    await expect(page.getByTestId("mobile-menu")).toBeVisible();

    // Click mobile logout button
    await page.getByTestId("mobile-logout-button").click();

    // Should navigate to /login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 8_000 });
  });
});
