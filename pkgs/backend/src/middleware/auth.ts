import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../types.js";

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;
if (!userPoolId || !clientId) {
  throw new Error(
    "COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID env vars are required",
  );
}

// Created once at module scope to reuse JWKS cache across warm Lambda invocations
const verifier = CognitoJwtVerifier.create({
  userPoolId,
  tokenUse: "id",
  clientId,
});

export const cognitoAuthMiddleware: MiddlewareHandler<HonoEnv> = async (
  c,
  next,
) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifier.verify(token);
    const email = payload.email;
    if (typeof email !== "string") {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("jwtPayload", { sub: payload.sub, email });
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
};
