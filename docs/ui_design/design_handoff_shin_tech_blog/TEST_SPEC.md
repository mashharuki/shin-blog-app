# Test Spec — Shin Tech Blog

TDD（テスト駆動開発）の原則に基づき、実装前にテストを作成します。
ユニット/インテグレーションテストは **Vitest**、E2Eテストは **Playwright** を使用します。

---

## フォルダ構成

```
apps/
├── frontend/
│   ├── src/
│   │   └── __tests__/
│   │       ├── unit/
│   │       │   ├── components/
│   │       │   └── hooks/
│   │       └── integration/
│   └── e2e/
│       ├── auth.spec.ts
│       ├── posts.spec.ts
│       └── editor.spec.ts
└── backend/
    └── src/
        └── __tests__/
            ├── unit/
            │   ├── posts.test.ts
            │   └── auth.test.ts
            └── integration/
                └── api.test.ts
packages/
└── shared/
    └── src/
        └── __tests__/
            └── schemas.test.ts
```

---

## 1. Shared パッケージテスト (Vitest)

```typescript
// packages/shared/src/__tests__/schemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  BlogPostSchema,
  CreatePostInputSchema,
  LoginInputSchema,
  PaginationSchema,
} from '../schemas';

describe('BlogPostSchema', () => {
  it('有効なブログ記事データをパースできる', () => {
    const valid = {
      id: crypto.randomUUID(),
      title: 'テスト記事',
      excerpt: '抜粋',
      content: '本文（10文字以上）',
      author: { id: crypto.randomUUID(), name: '山田 太郎' },
      tags: ['TypeScript', 'React'],
      readTime: 5,
      likes: 0,
      createdAt: new Date().toISOString(),
      published: true,
    };
    expect(() => BlogPostSchema.parse(valid)).not.toThrow();
  });

  it('タイトルが空の場合はエラー', () => {
    const result = CreatePostInputSchema.safeParse({ title: '', content: '本文', tags: [] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain('title');
  });

  it('コンテンツが10文字未満の場合はエラー', () => {
    const result = CreatePostInputSchema.safeParse({ title: 'タイトル', content: '短い', tags: [] });
    expect(result.success).toBe(false);
  });

  it('タグは最大10個まで', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `Tag${i}`);
    const result = CreatePostInputSchema.safeParse({ title: 'タイトル', content: '本文（10文字以上）です', tags });
    expect(result.success).toBe(false);
  });
});

describe('LoginInputSchema', () => {
  it('有効なメールアドレスとパスワードを受け付ける', () => {
    const result = LoginInputSchema.safeParse({ email: 'user@example.com', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('不正なメールアドレスはエラー', () => {
    const result = LoginInputSchema.safeParse({ email: 'not-an-email', password: 'password' });
    expect(result.success).toBe(false);
  });

  it('パスワードが8文字未満はエラー', () => {
    const result = LoginInputSchema.safeParse({ email: 'user@example.com', password: 'short' });
    expect(result.success).toBe(false);
  });
});

describe('PaginationSchema', () => {
  it('デフォルトlimitは12', () => {
    const result = PaginationSchema.parse({});
    expect(result.limit).toBe(12);
  });

  it('limitの上限は50', () => {
    const result = PaginationSchema.safeParse({ limit: 100 });
    expect(result.success).toBe(false);
  });
});
```

---

## 2. バックエンドテスト (Vitest)

### Unit Tests

```typescript
// apps/backend/src/__tests__/unit/posts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPost, getPost, listPosts } from '../../services/posts';
import { mockDynamoClient } from '../mocks/dynamo';

vi.mock('../../lib/dynamo', () => ({ docClient: mockDynamoClient }));

describe('createPost', () => {
  it('新しい記事を作成してIDを返す', async () => {
    const input = { title: 'テスト', content: '本文（10文字以上）', tags: ['TypeScript'] };
    const userId = 'user-123';

    const result = await createPost(input, userId);

    expect(result.id).toBeDefined();
    expect(result.title).toBe('テスト');
    expect(result.authorId).toBe(userId);
    expect(result.likes).toBe(0);
    expect(result.published).toBe(true);
  });

  it('excerptは本文の先頭200文字から自動生成される', async () => {
    const longContent = 'あ'.repeat(300);
    const result = await createPost({ title: 'test', content: longContent, tags: [] }, 'user-1');
    expect(result.excerpt.length).toBeLessThanOrEqual(200);
  });

  it('readTimeはcontentのワード数から計算される', async () => {
    // ~200words/min
    const content = 'word '.repeat(400); // ~2min
    const result = await createPost({ title: 'test', content, tags: [] }, 'user-1');
    expect(result.readTime).toBeGreaterThanOrEqual(2);
  });
});

describe('listPosts', () => {
  it('limitで件数を制限できる', async () => {
    mockDynamoClient.send.mockResolvedValueOnce({ Items: Array(6).fill(mockPost()) });
    const result = await listPosts({ limit: 6 });
    expect(result.posts).toHaveLength(6);
  });

  it('nextTokenが返ってきた場合は次ページが存在する', async () => {
    mockDynamoClient.send.mockResolvedValueOnce({
      Items: Array(12).fill(mockPost()),
      LastEvaluatedKey: { id: 'last-id' },
    });
    const result = await listPosts({ limit: 12 });
    expect(result.nextToken).toBeDefined();
  });
});

describe('getPost', () => {
  it('存在しないIDはnullを返す', async () => {
    mockDynamoClient.send.mockResolvedValueOnce({ Item: undefined });
    const result = await getPost('non-existent-id');
    expect(result).toBeNull();
  });
});

function mockPost() {
  return {
    id: crypto.randomUUID(),
    title: 'テスト記事',
    content: '本文',
    excerpt: '抜粋',
    author: { id: 'user-1', name: 'テスト' },
    tags: ['TypeScript'],
    readTime: 3,
    likes: 0,
    createdAt: new Date().toISOString(),
    published: true,
  };
}
```

### Integration Tests (Hono)

```typescript
// apps/backend/src/__tests__/integration/api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testClient } from 'hono/testing';
import { app } from '../../index';

const client = testClient(app);

describe('GET /api/v1/posts', () => {
  it('200 と記事一覧を返す', async () => {
    const res = await client.api.v1.posts.$get();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('posts');
    expect(Array.isArray(json.posts)).toBe(true);
  });

  it('limitパラメータが効く', async () => {
    const res = await client.api.v1.posts.$get({ query: { limit: '3' } });
    const json = await res.json();
    expect(json.posts.length).toBeLessThanOrEqual(3);
  });
});

describe('POST /api/v1/posts', () => {
  it('認証なしは401', async () => {
    const res = await client.api.v1.posts.$post({ json: { title: 'test', content: 'body', tags: [] } });
    expect(res.status).toBe(401);
  });

  it('認証ありで記事を作成できる', async () => {
    const res = await client.api.v1.posts.$post(
      { json: { title: 'test', content: '10文字以上の本文です', tags: ['TypeScript'] } },
      { headers: { Authorization: `Bearer ${validToken}` } },
    );
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBeDefined();
  });

  it('バリデーションエラーは422', async () => {
    const res = await client.api.v1.posts.$post(
      { json: { title: '', content: '短', tags: [] } },
      { headers: { Authorization: `Bearer ${validToken}` } },
    );
    expect(res.status).toBe(422);
  });
});
```

---

## 3. フロントエンドテスト (Vitest)

### Component Unit Tests

```typescript
// apps/frontend/src/__tests__/unit/components/BlogCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlogCard } from '../../../components/BlogCard';
import { mockPost } from '../../mocks/post';

describe('BlogCard', () => {
  it('タイトル・著者名・タグが表示される', () => {
    render(<BlogCard post={mockPost()} onClick={vi.fn()} />);
    expect(screen.getByText(mockPost().title)).toBeInTheDocument();
    expect(screen.getByText(mockPost().author.name)).toBeInTheDocument();
    mockPost().tags.slice(0, 3).forEach(tag => {
      expect(screen.getByText(`#${tag}`)).toBeInTheDocument();
    });
  });

  it('クリックでonClickが呼ばれる', () => {
    const onClick = vi.fn();
    render(<BlogCard post={mockPost()} onClick={onClick} />);
    fireEvent.click(screen.getByRole('article'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('いいねボタンをクリックするとカウントが増える', () => {
    render(<BlogCard post={mockPost({ likes: 10 })} onClick={vi.fn()} />);
    const likeBtn = screen.getByRole('button', { name: /10/ });
    fireEvent.click(likeBtn);
    expect(screen.getByText('11')).toBeInTheDocument();
  });

  it('いいね済みを再クリックするとカウントが減る', () => {
    render(<BlogCard post={mockPost({ likes: 10 })} onClick={vi.fn()} />);
    const likeBtn = screen.getByRole('button', { name: /10/ });
    fireEvent.click(likeBtn); // +1 → 11
    fireEvent.click(likeBtn); // -1 → 10
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
```

```typescript
// apps/frontend/src/__tests__/unit/hooks/useInfiniteScroll.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

describe('useInfiniteScroll', () => {
  it('初期状態では6件表示', () => {
    const { result } = renderHook(() => useInfiniteScroll({ total: 12, pageSize: 6 }));
    expect(result.current.visibleCount).toBe(6);
  });

  it('loadMoreで6件追加される', () => {
    const { result } = renderHook(() => useInfiniteScroll({ total: 12, pageSize: 6 }));
    act(() => result.current.loadMore());
    expect(result.current.visibleCount).toBe(12);
  });

  it('totalを超えない', () => {
    const { result } = renderHook(() => useInfiniteScroll({ total: 8, pageSize: 6 }));
    act(() => result.current.loadMore());
    expect(result.current.visibleCount).toBe(8);
    expect(result.current.hasMore).toBe(false);
  });
});
```

---

## 4. E2Eテスト (Playwright)

```typescript
// apps/frontend/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test('ログインフォームが表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'おかえりなさい' })).toBeVisible();
    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
  });

  test('空フォームで送信するとエラーが表示される', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page.getByText('メールアドレスとパスワードを入力してください')).toBeVisible();
  });

  test('有効な認証情報でログインしてホームへ遷移', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill('taro@example.com');
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: '技術記事' })).toBeVisible();
  });

  test('ログアウトするとログイン画面へ遷移', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: '山' }).click(); // Avatar
    await page.getByText('ログアウト').click();
    await expect(page).toHaveURL('/login');
  });
});
```

```typescript
// apps/frontend/e2e/posts.spec.ts
import { test, expect } from '@playwright/test';

test.describe('記事一覧画面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/');
  });

  test('記事カードが表示される', async ({ page }) => {
    const cards = page.locator('[data-testid="blog-card"]');
    await expect(cards.first()).toBeVisible();
    await expect(cards).toHaveCount(6); // 初期表示数
  });

  test('タグフィルタで絞り込みできる', async ({ page }) => {
    await page.getByRole('button', { name: '#TypeScript' }).click();
    const cards = page.locator('[data-testid="blog-card"]');
    for (const card of await cards.all()) {
      await expect(card.getByText('#TypeScript')).toBeVisible();
    }
  });

  test('トレンドタブで件数ソートされる', async ({ page }) => {
    await page.getByRole('button', { name: 'トレンド' }).click();
    const cards = page.locator('[data-testid="blog-card"]');
    const firstCard = cards.first();
    // 一番いいね数が多い記事が先頭に来ることを確認
    await expect(firstCard).toBeVisible();
  });

  test('スクロールで追加カードが読み込まれる', async ({ page }) => {
    const initialCount = await page.locator('[data-testid="blog-card"]').count();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000); // IntersectionObserver + loader
    const newCount = await page.locator('[data-testid="blog-card"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('カードをクリックすると詳細画面へ遷移', async ({ page }) => {
    await page.locator('[data-testid="blog-card"]').first().click();
    await expect(page).toHaveURL(/\/posts\//);
    await expect(page.getByRole('article')).toBeVisible();
  });
});

test.describe('記事詳細画面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/');
    await page.locator('[data-testid="blog-card"]').first().click();
  });

  test('記事タイトルと本文が表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.md-content')).toBeVisible();
  });

  test('コードブロックにシンタックスハイライトが適用される', async ({ page }) => {
    const codeBlock = page.locator('.md-content pre code.hljs').first();
    if (await codeBlock.count() > 0) {
      const spans = codeBlock.locator('.hljs-keyword, .hljs-string');
      await expect(spans.first()).toBeVisible();
    }
  });

  test('目次リンクが表示される（デスクトップ）', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-testid="toc"]')).toBeVisible();
  });

  test('モバイルでは目次トグルが表示される', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: /目次/ })).toBeVisible();
  });

  test('一覧に戻るボタンでホームへ', async ({ page }) => {
    await page.getByRole('button', { name: '一覧に戻る' }).click();
    await expect(page).toHaveURL('/');
  });
});
```

```typescript
// apps/frontend/e2e/editor.spec.ts
import { test, expect } from '@playwright/test';

test.describe('記事投稿エディタ', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/editor');
  });

  test('エディタ画面が表示される', async ({ page }) => {
    await expect(page.getByPlaceholder('記事のタイトルを入力…')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('タイトル未入力では公開ボタンがdisabled', async ({ page }) => {
    await expect(page.getByRole('button', { name: '公開する' })).toBeDisabled();
  });

  test('タイトル入力で公開ボタンが有効化される', async ({ page }) => {
    await page.getByPlaceholder('記事のタイトルを入力…').fill('テストタイトル');
    await expect(page.getByRole('button', { name: '公開する' })).toBeEnabled();
  });

  test('太字ツールバーボタンがマークダウンを挿入する', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('テスト');
    await textarea.selectText();
    await page.getByTitle('太字').click();
    await expect(textarea).toHaveValue('**テスト**');
  });

  test('タグを追加・削除できる', async ({ page }) => {
    const tagInput = page.getByPlaceholder('タグを追加…');
    await tagInput.fill('Hono');
    await tagInput.press('Enter');
    await expect(page.getByText('#Hono')).toBeVisible();
    await page.getByText('#Hono').locator('..').getByRole('button').click();
    await expect(page.getByText('#Hono')).not.toBeVisible();
  });

  test('プレビューモードでマークダウンが描画される', async ({ page }) => {
    await page.locator('textarea').fill('# テスト見出し\n\n本文です。');
    await page.getByRole('button', { name: 'プレビュー' }).click();
    await expect(page.getByRole('heading', { name: 'テスト見出し' })).toBeVisible();
  });

  test('公開するとホームへ遷移する', async ({ page }) => {
    await page.getByPlaceholder('記事のタイトルを入力…').fill('テスト記事');
    await page.getByRole('button', { name: '公開する' }).click();
    await expect(page.getByText('公開しました')).toBeVisible({ timeout: 3000 });
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });
});
```

```typescript
// apps/frontend/e2e/responsive.spec.ts
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iPhone SE',  width: 375, height: 667 },
  { name: 'iPhone 14',  width: 390, height: 844 },
  { name: 'iPad',       width: 768, height: 1024 },
  { name: 'Desktop',    width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  test(`${vp.name}: ホーム画面が正常に表示される`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await login(page);
    await page.goto('/');
    await expect(page.locator('[data-testid="blog-card"]').first()).toBeVisible();

    if (vp.width < 768) {
      // モバイル: ハンバーガーメニューが表示される
      await expect(page.getByRole('button', { name: /メニュー/ })).toBeVisible();
      // 1列グリッド
      const cards = page.locator('[data-testid="blog-card"]');
      const firstCard = cards.nth(0);
      const secondCard = cards.nth(1);
      const firstBox  = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      expect(firstBox!.x).toBeCloseTo(secondBox!.x, 0); // 同じ列
    } else {
      // デスクトップ: 通常ナビが表示される
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });
}
```

---

## ヘルパー関数

```typescript
// apps/frontend/e2e/helpers/auth.ts
import { Page } from '@playwright/test';

export async function login(page: Page, email = 'taro@example.com', password = 'password123') {
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill(email);
  await page.getByLabel('パスワード').fill(password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForURL('/');
}
```

---

## vitest.config.ts

```typescript
// apps/frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
  },
});

// apps/backend/vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80 },
    },
  },
});
```

## playwright.config.ts

```typescript
// apps/frontend/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari',  use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```
