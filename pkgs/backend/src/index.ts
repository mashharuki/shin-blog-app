import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/aws-lambda";
import { serve } from "@hono/node-server";
import type { HonoEnv } from "./types.js";
import { postsRouter } from "./routes/posts.js";

const app = new Hono<HonoEnv>();

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(
  "*",
  cors({
    origin: corsOrigin,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  }),
);

app.route("/api/posts", postsRouter);

// Lambda handler export
export const handler = handle(app);

// Local development server
if (process.env.NODE_ENV !== "production") {
  serve({ fetch: app.fetch, port: 3000 }, (info) => {
    console.log(`Server running on http://localhost:${info.port}`);
  });
}
