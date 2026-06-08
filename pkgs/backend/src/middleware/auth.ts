import { CognitoJwtVerifier } from "aws-jwt-verify";
import * as dotenv from "dotenv";
import type { MiddlewareHandler } from "hono";
import type { HonoEnv } from "../types.js";

dotenv.config();

const isLocalDev = process.env.LOCAL_DEV === "true";

const userPoolId = process.env.COGNITO_USER_POOL_ID;
const clientId = process.env.COGNITO_CLIENT_ID;

if (!isLocalDev && (!userPoolId || !clientId)) {
  throw new Error(
    "COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID env vars are required",
  );
}

// Created once at module scope to reuse JWKS cache across warm Lambda invocations
const verifier =
  !isLocalDev && userPoolId && clientId
    ? CognitoJwtVerifier.create({
        userPoolId,
        tokenUse: "id",
        clientId,
      })
    : null;

export const cognitoAuthMiddleware: MiddlewareHandler<HonoEnv> = async (
  c,
  next,
) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);

  // LOCAL_DEV=true: accept any JWT-shaped token without signature verification.
  // Generate tokens with: ./scripts/dev-token.sh [email]
  if (isLocalDev) {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return c.json({ error: "Unauthorized" }, 401);
      const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
      const payload = JSON.parse(payloadJson) as {
        sub?: string;
        email?: string;
      };
      if (!payload.sub || !payload.email) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      c.set("jwtPayload", { sub: payload.sub, email: payload.email });
      return next();
    } catch {
      return c.json({ error: "Unauthorized" }, 401);
    }
  }

  if (!verifier) return c.json({ error: "Unauthorized" }, 401);

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
