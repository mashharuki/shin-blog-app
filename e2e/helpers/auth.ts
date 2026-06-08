import type { Page } from "@playwright/test";

/**
 * Auth helpers for E2E tests.
 *
 * Since the app uses AWS Amplify / Cognito for authentication, these helpers
 * provide a way to inject a mock auth session directly into localStorage
 * (using Amplify v6's key format) and mock Cognito API calls at the network
 * level via page.route().
 *
 * With VITE_COGNITO_CLIENT_ID="test-client-id-for-e2e" (set in playwright.config.ts), the Amplify
 * localStorage keys become:
 *   CognitoIdentityServiceProvider.test-client-id-for-e2e.LastAuthUser
 *   CognitoIdentityServiceProvider.test-client-id-for-e2e.{username}.idToken
 *   etc.
 *
 * Post-logout navigation: call skipNextAuthInjection(page) before page.goto() to prevent
 * addInitScript from re-injecting auth tokens on the next full page load.
 */

export interface MockUser {
  sub: string;
  email: string;
  username?: string;
}

export interface MockCognitoRoutesOptions {
  /** When true, skips localStorage token injection (use for tests that test the login flow itself). */
  skipInjection?: boolean;
}

/**
 * Sets a sessionStorage flag that causes the next page load's addInitScript to skip
 * auth token injection. Use this before page.goto() when testing post-logout navigation.
 *
 * sessionStorage persists across same-origin full page navigations within the same tab,
 * so setting this flag before page.goto() ensures the flag is visible to addInitScript.
 */
export async function skipNextAuthInjection(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.setItem("__e2e_skip_auth_injection__", "true");
  });
}

/**
 * Creates a structurally valid (but NOT cryptographically signed) JWT
 * that Amplify v6 can parse to extract the payload.
 */
export function createFakeJwt(
  payload: Record<string, unknown>,
  expiresInSec = 3600,
): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { iat: now, exp: now + expiresInSec, ...payload };

  const header = { alg: "RS256", typ: "JWT" };
  const headerB64 = Buffer.from(JSON.stringify(header))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // Signature is a placeholder; Amplify v6 does NOT verify signatures
  // client-side – it just decodes the payload for local use.
  return `${headerB64}.${payloadB64}.fake-e2e-signature`;
}

/**
 * Injects Amplify v6 auth tokens into the page's localStorage so that
 * useAuth() / fetchAuthSession() returns a valid session without hitting
 * the real Cognito API.
 *
 * Must be called BEFORE the page navigates to any route (or right after
 * `page.goto(url, { waitUntil: 'commit' })`).
 *
 * The clientId key comes from `VITE_COGNITO_CLIENT_ID` ("test-client-id-for-e2e" in
 * the test environment), so keys are prefixed with "CognitoIdentityServiceProvider.test-client-id-for-e2e.".
 *
 * If sessionStorage.__e2e_skip_auth_injection__ is "true", injection is skipped
 * (flag is NOT removed here; the caller script removes it after all init scripts run).
 */
export async function injectAuthState(
  page: Page,
  user: MockUser,
): Promise<void> {
  const { sub, email, username = email } = user;
  const clientId = "test-client-id-for-e2e"; // matches VITE_COGNITO_CLIENT_ID in playwright.config.ts

  const idToken = createFakeJwt({
    sub,
    email,
    "cognito:username": username,
    token_use: "id",
  });

  const accessToken = createFakeJwt({
    sub,
    username,
    token_use: "access",
  });

  // Inject via page.addInitScript so it runs before React/Amplify initialises.
  // Checks skip flag but does NOT remove it (removal is done by the last addInitScript
  // registered in mockCognitoRoutes to ensure all scripts see the flag).
  await page.addInitScript(
    ({
      clientId,
      username,
      idToken,
      accessToken,
    }: {
      clientId: string;
      username: string;
      idToken: string;
      accessToken: string;
    }) => {
      if (sessionStorage.getItem("__e2e_skip_auth_injection__") === "true") {
        return; // skip injection; flag cleared by the subsequent addInitScript
      }
      const prefix = `CognitoIdentityServiceProvider.${clientId}`;
      localStorage.setItem(`${prefix}.LastAuthUser`, username);
      localStorage.setItem(`${prefix}.${username}.idToken`, idToken);
      localStorage.setItem(`${prefix}.${username}.accessToken`, accessToken);
      localStorage.setItem(
        `${prefix}.${username}.refreshToken`,
        "fake-refresh-token",
      );
      localStorage.setItem(`${prefix}.${username}.clockDrift`, "0");
    },
    { clientId, username, idToken, accessToken },
  );
}

/**
 * Mocks all Cognito IdentityProvider API calls so tests don't hit the real
 * AWS endpoint.  Covers:
 *   - InitiateAuth  → returns direct auth success (USER_PASSWORD_AUTH compatible)
 *   - RespondToAuthChallenge → returns tokens
 *   - GetUser → returns user attributes
 *   - GlobalSignOut → success
 *   - RevokeToken → success
 *
 * @param options.skipInjection - When true, skips localStorage token injection.
 *   Use for tests that exercise the actual login UI flow (signIn() call), where
 *   pre-existing tokens would cause "There is already a signed in user" errors.
 */
export async function mockCognitoRoutes(
  page: Page,
  user: MockUser,
  options: MockCognitoRoutesOptions = {},
): Promise<void> {
  const { sub, email, username = email } = user;
  const clientId = "test-client-id-for-e2e";
  const { skipInjection = false } = options;

  const idToken = createFakeJwt({
    sub,
    email,
    "cognito:username": username,
    token_use: "id",
  });
  const accessToken = createFakeJwt({
    sub,
    username,
    token_use: "access",
  });

  await page.route(
    (url) => url.hostname.includes("cognito-idp"),
    async (route) => {
      const request = route.request();
      const target = request.headers()["x-amz-target"] ?? "";

      if (target.includes("InitiateAuth")) {
        await route.fulfill({
          status: 200,
          contentType: "application/x-amz-json-1.1",
          body: JSON.stringify({
            AuthenticationResult: {
              AccessToken: accessToken,
              IdToken: idToken,
              RefreshToken: "fake-refresh-token",
              TokenType: "Bearer",
              ExpiresIn: 3600,
            },
          }),
        });
      } else if (target.includes("RespondToAuthChallenge")) {
        await route.fulfill({
          status: 200,
          contentType: "application/x-amz-json-1.1",
          body: JSON.stringify({
            AuthenticationResult: {
              AccessToken: accessToken,
              IdToken: idToken,
              RefreshToken: "fake-refresh-token",
              TokenType: "Bearer",
              ExpiresIn: 3600,
            },
          }),
        });
      } else if (target.includes("GetUser")) {
        await route.fulfill({
          status: 200,
          contentType: "application/x-amz-json-1.1",
          body: JSON.stringify({
            Username: username,
            UserAttributes: [
              { Name: "sub", Value: sub },
              { Name: "email", Value: email },
            ],
          }),
        });
      } else if (
        target.includes("GlobalSignOut") ||
        target.includes("RevokeToken")
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/x-amz-json-1.1",
          body: JSON.stringify({}),
        });
      } else {
        // For any other Cognito calls, return a generic success
        await route.fulfill({
          status: 200,
          contentType: "application/x-amz-json-1.1",
          body: JSON.stringify({}),
        });
      }
    },
  );

  // Also mock the Amplify v6 token-refresh endpoint pattern
  await page.route("**/oauth2/token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: accessToken,
        id_token: idToken,
        refresh_token: "fake-refresh-token",
        token_type: "Bearer",
        expires_in: 3600,
      }),
    });
  });

  if (!skipInjection) {
    // Inject tokens into localStorage for session restoration
    await injectAuthState(page, { sub, email, username });

    // This is the LAST addInitScript registered; it is responsible for removing
    // the __e2e_skip_auth_injection__ flag after all init scripts have been checked.
    await page.addInitScript(
      ({
        sub,
        email,
        clientId,
      }: { sub: string; email: string; clientId: string }) => {
        const shouldSkip =
          sessionStorage.getItem("__e2e_skip_auth_injection__") === "true";
        // Always remove the flag here (this is the last addInitScript)
        sessionStorage.removeItem("__e2e_skip_auth_injection__");

        if (shouldSkip) return;

        // Store mock user info so the app can read it
        const prefix = `CognitoIdentityServiceProvider.${clientId}`;
        // Ensure LastAuthUser is set (belt-and-suspenders with injectAuthState)
        if (!localStorage.getItem(`${prefix}.LastAuthUser`)) {
          localStorage.setItem(`${prefix}.LastAuthUser`, email);
        }
        // Tag this session so test helpers can detect it
        localStorage.setItem("__e2e_mock_user_sub__", sub);
        localStorage.setItem("__e2e_mock_user_email__", email);
      },
      { sub, email, clientId },
    );
  }
}
