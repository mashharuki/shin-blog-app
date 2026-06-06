import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock aws-amplify/auth
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
}));

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

import { fetchAuthSession } from 'aws-amplify/auth';
import { api } from './api.js';

const mockFetchAuthSession = vi.mocked(fetchAuthSession);
const mockFetch = vi.mocked(global.fetch);

function makeResponse(body: unknown, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('api client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    // Default: authenticated session with idToken
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        idToken: { toString: () => 'test-id-token' },
      },
    } as never);
  });

  describe('getPosts', () => {
    it('sends GET /api/posts without Authorization header', async () => {
      const responseBody = { posts: [], nextCursor: undefined };
      mockFetch.mockResolvedValueOnce(makeResponse(responseBody));

      await api.getPosts();

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/posts');
      expect((init as RequestInit | undefined)?.headers).toBeUndefined();
    });

    it('sends GET /api/posts?cursor=cursor123 when cursor is provided', async () => {
      const responseBody = { posts: [], nextCursor: 'next' };
      mockFetch.mockResolvedValueOnce(makeResponse(responseBody));

      await api.getPosts('cursor123');

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/posts?cursor=cursor123');
    });

    it('redirects to /login on 401 response', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(null, 401));

      await expect(api.getPosts()).rejects.toThrow('Unauthorized');
      expect(mockLocation.href).toBe('/login');
    });
  });

  describe('getPost', () => {
    it('sends GET /api/posts/:postId without Authorization header', async () => {
      const post = {
        postId: 'post-id',
        title: 'Test',
        content: 'Body',
        authorId: 'user1',
        authorEmail: 'user@example.com',
        authorName: 'User',
        tags: [],
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockFetch.mockResolvedValueOnce(makeResponse(post));

      await api.getPost('post-id');

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/posts/post-id');
      expect((init as RequestInit | undefined)?.headers).toBeUndefined();
    });
  });

  describe('createPost', () => {
    it('sends POST /api/posts with Authorization header containing idToken', async () => {
      const createdPost = {
        postId: 'new-post',
        title: 'Hello',
        content: 'World',
        authorId: 'user1',
        authorEmail: 'user@example.com',
        authorName: 'User',
        tags: [],
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockFetch.mockResolvedValueOnce(makeResponse(createdPost));

      await api.createPost({ title: 'Hello', content: 'World' });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/posts');
      expect((init as RequestInit).method).toBe('POST');
      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer test-id-token');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('redirects to /login on 401 response', async () => {
      mockFetch.mockResolvedValueOnce(makeResponse(null, 401));

      await expect(
        api.createPost({ title: 'Hello', content: 'World' })
      ).rejects.toThrow('Unauthorized');
      expect(mockLocation.href).toBe('/login');
    });
  });
});
