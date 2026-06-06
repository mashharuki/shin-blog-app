import { describe, it, expect } from "vitest";
import { createPostSchema, postIdSchema } from "./post.js";

describe("createPostSchema", () => {
  it("valid data passes", () => {
    const result = createPostSchema.safeParse({
      title: "Hello World",
      content: "Some content here.",
      tags: ["typescript", "blog"],
    });
    expect(result.success).toBe(true);
  });

  it("valid data without tags passes (tags optional, defaults to [])", () => {
    const result = createPostSchema.safeParse({
      title: "Hello",
      content: "Content",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it("empty title fails with required message", () => {
    const result = createPostSchema.safeParse({
      title: "",
      content: "Some content",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const titleError = result.error.issues.find((i) =>
        i.path.includes("title"),
      );
      expect(titleError?.message).toBe("タイトルは必須です");
    }
  });

  it("empty content fails with required message", () => {
    const result = createPostSchema.safeParse({
      title: "A title",
      content: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const contentError = result.error.issues.find((i) =>
        i.path.includes("content"),
      );
      expect(contentError?.message).toBe("本文は必須です");
    }
  });

  it("title exceeding 200 chars fails", () => {
    const result = createPostSchema.safeParse({
      title: "a".repeat(201),
      content: "Some content",
    });
    expect(result.success).toBe(false);
  });

  it("title of exactly 200 chars passes", () => {
    const result = createPostSchema.safeParse({
      title: "a".repeat(200),
      content: "Some content",
    });
    expect(result.success).toBe(true);
  });

  it("content exceeding 50000 chars fails", () => {
    const result = createPostSchema.safeParse({
      title: "A title",
      content: "a".repeat(50001),
    });
    expect(result.success).toBe(false);
  });

  it("content of exactly 50000 chars passes", () => {
    const result = createPostSchema.safeParse({
      title: "A title",
      content: "a".repeat(50000),
    });
    expect(result.success).toBe(true);
  });

  it("6 tags fails (max 5)", () => {
    const result = createPostSchema.safeParse({
      title: "A title",
      content: "Some content",
      tags: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.success).toBe(false);
  });

  it("exactly 5 tags passes", () => {
    const result = createPostSchema.safeParse({
      title: "A title",
      content: "Some content",
      tags: ["a", "b", "c", "d", "e"],
    });
    expect(result.success).toBe(true);
  });

  it("tag exceeding 30 chars fails", () => {
    const result = createPostSchema.safeParse({
      title: "A title",
      content: "Some content",
      tags: ["a".repeat(31)],
    });
    expect(result.success).toBe(false);
  });

  it("parse() throws on empty title", () => {
    expect(() =>
      createPostSchema.parse({ title: "", content: "content" }),
    ).toThrow();
  });

  it("parse() throws on empty content", () => {
    expect(() =>
      createPostSchema.parse({ title: "title", content: "" }),
    ).toThrow();
  });

  it("parse() throws on 6 tags", () => {
    expect(() =>
      createPostSchema.parse({
        title: "title",
        content: "content",
        tags: ["a", "b", "c", "d", "e", "f"],
      }),
    ).toThrow();
  });
});

describe("postIdSchema", () => {
  it("valid UUID passes", () => {
    const result = postIdSchema.safeParse(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    expect(result.success).toBe(true);
  });

  it("non-UUID string fails", () => {
    const result = postIdSchema.safeParse("not-a-uuid");
    expect(result.success).toBe(false);
  });

  it("empty string fails", () => {
    const result = postIdSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("numeric string fails", () => {
    const result = postIdSchema.safeParse("12345");
    expect(result.success).toBe(false);
  });
});
