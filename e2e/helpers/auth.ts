import type { Page } from "@playwright/test";

/**
 * Auth helpers for E2E tests.
 *
 * Since the app uses AWS Amplify / Cognito for authentication, these helpers
 * provide a way to inject a mock auth session directly into localStorage
 * (using Amplify v6's key format) and mock Cognito API calls at the network
 * level via page.route().
 *
 * With VITE_COGNITO_CLIENT_ID="" (empty string in test env), the Amplify
 * localStorage keys become:
 *   CognitoIdentityServiceProvider..LastAuthUser
 *   CognitoIdentityServiceProvider...{username}.idToken
 *   etc.
 */

export interface MockUser {
  sub: string;
  email: string;
  username?: string;
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
 * The clientId key comes from `VITE_COGNITO_CLIENT_ID` which is empty ("") in
 * the test environment, so keys are prefixed with "CognitoIdentityServiceProvider..".
 */
export async function injectAuthState(
  page: Page,
  user: MockUser,
): Promise<void> {
  const { sub, email, username = email } = user;
  const clientId = ""; // matches VITE_COGNITO_CLIENT_ID="" in test env

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

  // Inject via page.addInitScript so it runs before React/Amplify initialises
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
 *   - InitiateAuth  → returns USER_SRP_AUTH or direct auth success
 *   - RespondToAuthChallenge → returns tokens
 *   - GetUser → returns user attributes
 *   - GlobalSignOut → success
 *   - RevokeToken → success
 */
export async function mockCognitoRoutes(
  page: Page,
  user: MockUser,
): Promise<void> {
  const { sub, email, username = email } = user;
  const clientId = "";

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
  await page.route(`**/oauth2/token`, async (route) => {
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

  // Inject tokens into localStorage for session restoration
  await injectAuthState(page, { sub, email, username });

  // Override Amplify's getCurrentUser to return mock data
  await page.addInitScript(
    ({ sub, email, clientId }: { sub: string; email: string; clientId: string }) => {
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
