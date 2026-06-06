export interface Post {
  postId: string;
  title: string;
  content: string; // raw markdown
  authorId: string; // Cognito sub
  authorEmail: string;
  authorName: string; // display name of the author
  tags: string[]; // e.g. ["TypeScript", "AWS"]
  createdAt: string; // ISO 8601
}

export type PostSummary = Pick<
  Post,
  "postId" | "title" | "authorEmail" | "authorName" | "tags" | "createdAt"
> & {
  excerpt: string; // first 200 characters of content
};

export interface CreatePostInput {
  title: string;
  content: string;
  tags?: string[]; // optional, defaults to []
}
