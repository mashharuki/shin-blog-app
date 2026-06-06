import type { CreatePostInput, Post, PostSummary } from "@shin-blog-app/shared";
import { fetchAuthSession } from "aws-amplify/auth";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

async function getAuthHeader(): Promise<Record<string, string>> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async getPosts(
    cursor?: string,
  ): Promise<{ posts: PostSummary[]; nextCursor?: string }> {
    const url = new URL(`${baseUrl}/api/posts`);
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url.toString());
    return handleResponse(res);
  },

  async getPost(postId: string): Promise<Post> {
    const res = await fetch(`${baseUrl}/api/posts/${postId}`);
    return handleResponse(res);
  },

  async createPost(input: CreatePostInput): Promise<Post> {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(input),
    });
    return handleResponse(res);
  },
};
