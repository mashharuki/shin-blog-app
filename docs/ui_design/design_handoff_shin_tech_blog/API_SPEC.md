# API Spec — Shin Tech Blog

バックエンドは **Hono + AWS Lambda** で実装します。
すべてのスキーマは `packages/shared/src/schemas/` に Zod で定義し、
フロントエンド・バックエンドで共通利用します。

---

## 共通 Zod スキーマ (`packages/shared`)

```typescript
// packages/shared/src/schemas/post.ts
import { z } from 'zod';

export const TagSchema = z.string().min(1).max(30);

export const AuthorSchema = z.object({
  id:   z.string().uuid(),
  name: z.string().min(1).max(50),
});

export const BlogPostSchema = z.object({
  id:        z.string().uuid(),
  title:     z.string().min(1).max(200),
  excerpt:   z.string().max(500),
  content:   z.string().min(10),            // Markdown
  author:    AuthorSchema,
  tags:      z.array(TagSchema).max(10),
  readTime:  z.number().int().positive(),   // 分
  likes:     z.number().int().min(0),
  createdAt: z.string().datetime(),         // ISO8601
  updatedAt: z.string().datetime().optional(),
  published: z.boolean().default(true),
});

export const CreatePostInputSchema = BlogPostSchema.pick({
  title: true,
  content: true,
  tags: true,
});

export const UpdatePostInputSchema = CreatePostInputSchema.partial();

export const PaginationSchema = z.object({
  limit:     z.coerce.number().int().min(1).max(50).default(12),
  nextToken: z.string().optional(),         // DynamoDB LastEvaluatedKey (base64)
});

export const ListPostsResponseSchema = z.object({
  posts:     z.array(BlogPostSchema),
  nextToken: z.string().optional(),
  total:     z.number().int().optional(),
});

// packages/shared/src/schemas/auth.ts
export const LoginInputSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});

export const AuthTokensSchema = z.object({
  accessToken:  z.string(),
  idToken:      z.string(),
  refreshToken: z.string(),
  expiresIn:    z.number(),
});

// packages/shared/src/schemas/user.ts
export const UserSchema = z.object({
  id:    z.string().uuid(),
  email: z.string().email(),
  name:  z.string(),
  sub:   z.string(), // Cognito sub
});

// packages/shared/src/schemas/error.ts
export const ErrorResponseSchema = z.object({
  error:   z.string(),
  message: z.string(),
  code:    z.string().optional(),
});
```

---

## Honoルート定義

### ベースURL
- **開発**: `http://localhost:8787/api/v1`
- **本番**: `https://<api-id>.execute-api.<region>.amazonaws.com/prod/api/v1`

### 認証
- AWS Cognito JWT をヘッダーで送信
- `Authorization: Bearer <idToken>`
- バックエンドで Cognito JWKS による検証

---

### POST /auth/login
Cognitoへの認証（InitiateAuth）

**Request**
```typescript
// Body
type LoginInput = z.infer<typeof LoginInputSchema>;
// { email: string, password: string }
```

**Response 200**
```typescript
type AuthTokens = z.infer<typeof AuthTokensSchema>;
// { accessToken, idToken, refreshToken, expiresIn }
```

**Response 401**
```json
{ "error": "INVALID_CREDENTIALS", "message": "メールアドレスまたはパスワードが違います" }
```

---

### POST /auth/logout
Cognito GlobalSignOut

**Headers**: `Authorization: Bearer <accessToken>`

**Response 200**
```json
{ "success": true }
```

---

### GET /posts
記事一覧取得（ページネーション付き）

**Query Params**
```typescript
type Params = z.infer<typeof PaginationSchema>;
// limit?: number (default: 12, max: 50)
// nextToken?: string
// tag?: string  (タグフィルタ)
// sort?: 'latest' | 'trending'  (default: 'latest')
```

**Response 200**
```typescript
type ListPostsResponse = z.infer<typeof ListPostsResponseSchema>;
// { posts: BlogPost[], nextToken?: string, total?: number }
```

**実装ノート（無限スクロール）:**
- フロントエンドは `nextToken` を保持し、スクロール到達時に追加リクエスト
- `nextToken` が `undefined` なら全件取得済み
- DynamoDB の `LastEvaluatedKey` をbase64エンコードして `nextToken` として返す

```typescript
// フロントエンド側（TanStack Query使用例）
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['posts', { tag, sort }],
  queryFn: ({ pageParam }) =>
    api.get('/posts', { params: { nextToken: pageParam, limit: 12, tag, sort } }),
  getNextPageParam: (lastPage) => lastPage.nextToken,
});
```

---

### GET /posts/:id
記事詳細取得

**Path Params**: `id: string (uuid)`

**Response 200**
```typescript
type BlogPost = z.infer<typeof BlogPostSchema>;
```

**Response 404**
```json
{ "error": "NOT_FOUND", "message": "記事が見つかりません" }
```

---

### POST /posts
記事新規投稿（認証必須）

**Headers**: `Authorization: Bearer <idToken>`

**Request Body**
```typescript
type CreatePostInput = z.infer<typeof CreatePostInputSchema>;
// { title: string, content: string, tags: string[] }
```

**Response 201**
```typescript
type BlogPost = z.infer<typeof BlogPostSchema>;
```

**バリデーションエラー 422**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "入力値が不正です",
  "issues": [{ "path": ["title"], "message": "タイトルは必須です" }]
}
```

---

### PUT /posts/:id
記事更新（認証必須・本人のみ）

**Headers**: `Authorization: Bearer <idToken>`

**Request Body**
```typescript
type UpdatePostInput = z.infer<typeof UpdatePostInputSchema>;
// Partial<{ title, content, tags }>
```

**Response 200**: 更新後の `BlogPost`

**Response 403**
```json
{ "error": "FORBIDDEN", "message": "この記事を編集する権限がありません" }
```

---

### DELETE /posts/:id
記事削除（認証必須・本人のみ）

**Response 204**: No content

---

### POST /posts/:id/likes
いいねトグル（認証必須）

**Response 200**
```json
{ "liked": true, "count": 143 }
```

---

### GET /tags
全タグ一覧取得

**Response 200**
```json
{ "tags": ["TypeScript", "AWS", "React", ...] }
```

---

## Hono アプリ実装スケルトン

```typescript
// apps/backend/src/index.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { cors } from 'hono/cors';
import { handle } from 'hono/aws-lambda';
import {
  CreatePostInputSchema,
  PaginationSchema,
  LoginInputSchema,
} from '@shin-tech-blog/shared';
import { authMiddleware } from './middleware/auth';
import { postsRouter } from './routes/posts';
import { authRouter } from './routes/auth';
import { tagsRouter } from './routes/tags';

const app = new Hono().basePath('/api/v1');

app.use('*', cors({
  origin: process.env.FRONTEND_URL ?? '*',
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.route('/auth',  authRouter);
app.route('/posts', postsRouter);
app.route('/tags',  tagsRouter);

// グローバルエラーハンドラー
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'INTERNAL_ERROR', message: err.message }, 500);
});

export const handler = handle(app);
```

---

## DynamoDB テーブル設計

### BlogTable

| 属性 | 型 | 役割 |
|------|----|------|
| `id` | String | Partition Key (UUID) |
| `createdAt` | String | Sort Key (ISO8601) |
| `title` | String | — |
| `content` | String | Markdown本文 |
| `excerpt` | String | 自動生成（本文先頭200文字） |
| `authorId` | String | Cognito sub |
| `authorName` | String | 非正規化（表示用） |
| `tags` | StringSet | タグ一覧 |
| `readTime` | Number | 分（words/200で計算） |
| `likes` | Number | いいね数 |
| `published` | Boolean | 公開フラグ |

**GSI (Global Secondary Index):**
- `likes-createdAt-index`: `likes`(PK) + `createdAt`(SK) → トレンドソート用

**Billing**: `PAY_PER_REQUEST`

---

## Cognito設定（CDK）

```typescript
// apps/infra/lib/auth-stack.ts
const userPool = new cognito.UserPool(this, 'BlogUserPool', {
  userPoolName: 'shin-tech-blog-users',
  selfSignUpEnabled: false,   // 管理者のみ招待
  signInAliases: { email: true },
  autoVerify: { email: true },
  passwordPolicy: {
    minLength: 8,
    requireUppercase: false,
    requireDigits: true,
    requireSymbols: false,
  },
  accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

const userPoolClient = userPool.addClient('BlogWebClient', {
  authFlows: {
    userPassword: true,    // USER_PASSWORD_AUTH
    userSrp: true,
  },
  generateSecret: false,  // SPAはシークレット不要
  accessTokenValidity:  cdk.Duration.hours(1),
  idTokenValidity:      cdk.Duration.hours(1),
  refreshTokenValidity: cdk.Duration.days(30),
});
```

---

## 認証ミドルウェア

```typescript
// apps/backend/src/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID!,
  clientId:   process.env.USER_POOL_CLIENT_ID!,
  tokenUse:   'id',
});

export const authMiddleware = createMiddleware(async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'UNAUTHORIZED', message: '認証が必要です' }, 401);
  }
  try {
    const payload = await verifier.verify(auth.slice(7));
    c.set('user', { id: payload.sub, email: payload.email as string });
    await next();
  } catch {
    return c.json({ error: 'INVALID_TOKEN', message: 'トークンが無効です' }, 401);
  }
});
```
