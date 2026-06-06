import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock DynamoDB modules before importing the repository
const mockSend = vi.fn();

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({ send: mockSend })),
  },
  QueryCommand: vi.fn((params: unknown) => params),
  GetCommand: vi.fn((params: unknown) => params),
  PutCommand: vi.fn((params: unknown) => params),
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(() => ({})),
}));

vi.mock('uuid', () => ({ v4: vi.fn(() => 'test-uuid') }));

// Import after mocks are set up
const { DynamoDBPostRepository } = await import('./post.repository.js');

describe('DynamoDBPostRepository', () => {
  let repo: InstanceType<typeof DynamoDBPostRepository>;

  beforeEach(() => {
    mockSend.mockReset();
    repo = new DynamoDBPostRepository();
  });

  // ----------------------------------------------------------------
  // listPosts
  // ----------------------------------------------------------------
  describe('listPosts', () => {
    it('returns posts mapped to PostSummary with excerpt truncated to 200 chars', async () => {
      const longContent = 'x'.repeat(300);
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            postId: 'post-1',
            title: 'Hello World',
            content: longContent,
            authorId: 'user-1',
            authorEmail: 'alice@example.com',
            authorName: 'alice',
            tags: ['TypeScript'],
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        LastEvaluatedKey: undefined,
      });

      const result = await repo.listPosts();

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].postId).toBe('post-1');
      expect(result.posts[0].title).toBe('Hello World');
      expect(result.posts[0].excerpt).toBe('x'.repeat(200));
      expect(result.posts[0].authorName).toBe('alice');
      expect(result.nextCursor).toBeUndefined();
    });

    it('returns nextCursor when LastEvaluatedKey is present', async () => {
      const lastKey = { pk: 'POST#post-1', sk: '#METADATA', gsi1pk: 'POST', gsi1sk: '2024-01-01T00:00:00.000Z' };
      mockSend.mockResolvedValueOnce({
        Items: [
          {
            postId: 'post-1',
            title: 'Post 1',
            content: 'Short content',
            authorId: 'user-1',
            authorEmail: 'bob@example.com',
            authorName: 'bob',
            tags: [],
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        LastEvaluatedKey: lastKey,
      });

      const result = await repo.listPosts();

      expect(result.nextCursor).toBeDefined();
      const decoded = JSON.parse(Buffer.from(result.nextCursor!, 'base64').toString('utf-8'));
      expect(decoded).toEqual(lastKey);
    });

    it('passes ExclusiveStartKey when cursor is provided', async () => {
      const cursor = Buffer.from(JSON.stringify({ pk: 'POST#old', sk: '#METADATA' })).toString('base64');
      mockSend.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: undefined });

      // Clear the QueryCommand mock call history before this test
      const { QueryCommand } = await import('@aws-sdk/lib-dynamodb');
      vi.mocked(QueryCommand).mockClear();

      await repo.listPosts(cursor);

      // The QueryCommand constructor receives the params object
      const callArgs = vi.mocked(QueryCommand).mock.calls[0][0] as Record<string, unknown>;
      expect(callArgs.ExclusiveStartKey).toEqual({ pk: 'POST#old', sk: '#METADATA' });
    });
  });

  // ----------------------------------------------------------------
  // getPost
  // ----------------------------------------------------------------
  describe('getPost', () => {
    it('returns a Post when the item exists', async () => {
      mockSend.mockResolvedValueOnce({
        Item: {
          postId: 'post-1',
          title: 'My Post',
          content: 'Content here',
          authorId: 'user-1',
          authorEmail: 'carol@example.com',
          authorName: 'carol',
          tags: ['AWS'],
          createdAt: '2024-06-01T12:00:00.000Z',
        },
      });

      const post = await repo.getPost('post-1');

      expect(post).not.toBeNull();
      expect(post!.postId).toBe('post-1');
      expect(post!.title).toBe('My Post');
      expect(post!.content).toBe('Content here');
      expect(post!.authorName).toBe('carol');
      expect(post!.tags).toEqual(['AWS']);
    });

    it('returns null when the item does not exist', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const post = await repo.getPost('nonexistent');

      expect(post).toBeNull();
    });
  });

  // ----------------------------------------------------------------
  // createPost
  // ----------------------------------------------------------------
  describe('createPost', () => {
    it('creates a post with correct pk/sk and authorName derived from email', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await repo.createPost({
        title: 'New Post',
        content: 'Post content',
        tags: ['TypeScript', 'Hono'],
        authorId: 'user-abc',
        authorEmail: 'dave@example.com',
      });

      expect(result.postId).toBe('test-uuid');
      expect(result.title).toBe('New Post');
      expect(result.content).toBe('Post content');
      expect(result.authorName).toBe('dave');
      expect(result.authorId).toBe('user-abc');
      expect(result.tags).toEqual(['TypeScript', 'Hono']);

      // Verify PutCommand received correct pk/sk
      const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
      const putArgs = vi.mocked(PutCommand).mock.calls[0][0] as Record<string, unknown>;
      const item = putArgs.Item as Record<string, unknown>;
      expect(item.pk).toBe('POST#test-uuid');
      expect(item.sk).toBe('#METADATA');
      expect(item.gsi1pk).toBe('POST');
      expect(putArgs.ConditionExpression).toBe('attribute_not_exists(pk)');
    });

    it('defaults tags to empty array when not provided', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await repo.createPost({
        title: 'Tagless Post',
        content: 'No tags here',
        authorId: 'user-1',
        authorEmail: 'eve@example.com',
      });

      expect(result.tags).toEqual([]);
    });
  });
});
