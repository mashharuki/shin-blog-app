import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { CreatePostInput, Post, PostSummary } from "@shin-blog-app/shared";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME ?? "BlogTable";

export interface PostRepository {
  listPosts(
    cursor?: string,
  ): Promise<{ posts: PostSummary[]; nextCursor?: string }>;
  getPost(postId: string): Promise<Post | null>;
  createPost(
    input: CreatePostInput & { authorId: string; authorEmail: string },
  ): Promise<Post>;
}

export class DynamoDBPostRepository implements PostRepository {
  async listPosts(
    cursor?: string,
  ): Promise<{ posts: PostSummary[]; nextCursor?: string }> {
    const exclusiveStartKey = cursor
      ? (JSON.parse(Buffer.from(cursor, "base64").toString("utf-8")) as Record<
          string,
          unknown
        >)
      : undefined;

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "byCreatedAt",
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: { ":pk": "POST" },
        ScanIndexForward: false,
        Limit: 20,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    const posts: PostSummary[] = (result.Items ?? []).map((item) => ({
      postId: item.postId as string,
      title: item.title as string,
      authorEmail: item.authorEmail as string,
      authorName: item.authorName as string,
      tags: (item.tags as string[] | undefined) ?? [],
      createdAt: item.createdAt as string,
      excerpt: (item.content as string).slice(0, 200),
    }));

    const nextCursor = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
      : undefined;

    return { posts, nextCursor };
  }

  async getPost(postId: string): Promise<Post | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: `POST#${postId}`, sk: "#METADATA" },
      }),
    );

    if (!result.Item) return null;

    const item = result.Item;
    return {
      postId: item.postId as string,
      title: item.title as string,
      content: item.content as string,
      authorId: item.authorId as string,
      authorEmail: item.authorEmail as string,
      authorName: item.authorName as string,
      tags: (item.tags as string[] | undefined) ?? [],
      createdAt: item.createdAt as string,
    };
  }

  async createPost(
    input: CreatePostInput & { authorId: string; authorEmail: string },
  ): Promise<Post> {
    const postId = uuidv4();
    const createdAt = new Date().toISOString();
    const authorName = input.authorEmail.split("@")[0];
    const tags = input.tags ?? [];

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: `POST#${postId}`,
          sk: "#METADATA",
          gsi1pk: "POST",
          gsi1sk: createdAt,
          postId,
          title: input.title,
          content: input.content,
          authorId: input.authorId,
          authorEmail: input.authorEmail,
          authorName,
          tags,
          createdAt,
        },
        ConditionExpression: "attribute_not_exists(pk)",
      }),
    );

    return {
      postId,
      title: input.title,
      content: input.content,
      authorId: input.authorId,
      authorEmail: input.authorEmail,
      authorName,
      tags,
      createdAt,
    };
  }
}
