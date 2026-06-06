import { Hono } from "hono";
import type { HonoEnv } from "../types.js";
import { cognitoAuthMiddleware } from "../middleware/auth.js";
import { DynamoDBPostRepository } from "../repositories/post.repository.js";
import { createPostSchema } from "@shin-blog-app/shared";

const postsRouter = new Hono<HonoEnv>();
const repository = new DynamoDBPostRepository();

// GET /api/posts — list posts (no auth required)
postsRouter.get("/", async (c) => {
  const cursor = c.req.query("cursor");
  const result = await repository.listPosts(cursor);
  return c.json(result);
});

// GET /api/posts/:id — get single post (no auth required)
postsRouter.get("/:id", async (c) => {
  const postId = c.req.param("id");
  const post = await repository.getPost(postId);
  if (!post) {
    return c.json({ error: "Post not found" }, 404);
  }
  return c.json(post);
});

// POST /api/posts — create a post (auth required)
postsRouter.post("/", cognitoAuthMiddleware, async (c) => {
  const body = await c.req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      400,
    );
  }

  const jwtPayload = c.get("jwtPayload");
  const post = await repository.createPost({
    ...parsed.data,
    authorId: jwtPayload.sub,
    authorEmail: jwtPayload.email,
  });

  return c.json(post, 201);
});

export { postsRouter };
