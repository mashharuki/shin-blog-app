import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(200),
  content: z.string().min(1, "本文は必須です").max(50000),
  tags: z.array(z.string().max(30)).max(5).optional().default([]),
});

export const postIdSchema = z.string().uuid();
