import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { HonoEnv } from '../types.js';

// Mock aws-jwt-verify BEFORE importing auth middleware
vi.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: vi.fn(() => ({
      verify: vi.fn(async (token: string) => {
        if (token === 'valid-token') {
          return { sub: 'user123', email: 'test@example.com' };
        }
        throw new Error('Invalid token');
      }),
    })),
  },
}));

// Import after mock is set up
const { cognitoAuthMiddleware } = await import('./auth.js');

describe('cognitoAuthMiddleware', () => {
  let app: Hono<HonoEnv>;

  beforeEach(() => {
    app = new Hono<HonoEnv>();
    app.use('/protected', cognitoAuthMiddleware);
    app.get('/protected', (c) => c.json(c.get('jwtPayload')));
  });

  it('valid JWT: should pass through and set jwtPayload in context', async () => {
    const req = new Request('http://localhost/protected', {
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    const res = await app.fetch(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ sub: 'user123', email: 'test@example.com' });
  });

  it('invalid JWT: should return 401 Unauthorized', async () => {
    const req = new Request('http://localhost/protected', {
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    });

    const res = await app.fetch(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('missing Authorization header: should return 401 Unauthorized', async () => {
    const req = new Request('http://localhost/protected');

    const res = await app.fetch(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('malformed Authorization header (no Bearer prefix): should return 401 Unauthorized', async () => {
    const req = new Request('http://localhost/protected', {
      headers: {
        Authorization: 'valid-token',
      },
    });

    const res = await app.fetch(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });
});
