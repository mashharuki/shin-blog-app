# Design Tokens — Shin Tech Blog

## Colors

### Base Palette (Light Theme)

| Token | Value | 用途 |
|-------|-------|------|
| `--bg` | `#ffffff` | ページ背景 |
| `--bg-secondary` | `#f8fafc` | カード内背景・入力フィールド |
| `--bg-tertiary` | `#f1f5f9` | ホバー背景 |
| `--surface` | `#ffffff` | カード・ポップアップ |
| `--border` | `#e2e8f0` | 境界線 |
| `--border-light` | `#f1f5f9` | 薄い境界線 |
| `--text` | `#0f172a` | メインテキスト |
| `--text-secondary` | `#475569` | セカンダリテキスト |
| `--text-muted` | `#94a3b8` | プレースホルダー・補足 |
| `--primary` | `#3b82f6` | アクセントカラー（Tweaksで変更可） |
| `--primary-hover` | `#2563eb` | ホバー時 |
| `--primary-light` | `rgba(59,130,246,0.1)` | 薄い強調背景 |
| `--primary-text` | `#1d4ed8` | プライマリ上のテキスト |

### Dark Theme Overrides

| Token | Value |
|-------|-------|
| `--bg` | `#0f172a` |
| `--bg-secondary` | `#1e293b` |
| `--bg-tertiary` | `#263347` |
| `--surface` | `#1e293b` |
| `--border` | `#334155` |
| `--border-light` | `#263347` |
| `--text` | `#f1f5f9` |
| `--text-secondary` | `#94a3b8` |
| `--text-muted` | `#64748b` |

### Tag Badge Colors (TAG_COLORS)

```typescript
export const TAG_COLORS: Record<string, string> = {
  'AWS':        '#f59e0b',
  'CDK':        '#3b82f6',
  'TypeScript': '#3178c6',
  'Serverless': '#8b5cf6',
  'Hono':       '#f97316',
  'API':        '#10b981',
  'Lambda':     '#f59e0b',
  'TDD':        '#10b981',
  'Vitest':     '#6366f1',
  'Playwright': '#ef4444',
  'Testing':    '#06b6d4',
  'pnpm':       '#f59e0b',
  'Monorepo':   '#8b5cf6',
  'Turborepo':  '#0ea5e9',
  'DevOps':     '#64748b',
  'React':      '#06b6d4',
  'shadcn':     '#0f172a',
  'Tailwind':   '#0ea5e9',
  'UI':         '#8b5cf6',
  'DynamoDB':   '#f59e0b',
  'Cognito':    '#ef4444',
  'Auth':       '#10b981',
  'Zod':        '#3b82f6',
};
```

Badge背景は `${color}22`（透明度14%）、文字色は `${color}` そのまま。

---

## Typography

| 用途 | Font | Weight | Size | Line-height |
|------|------|--------|------|-------------|
| ページ本文 | `Inter`, `Noto Sans JP`, system-ui | 400 | 16px base | 1.7 |
| 見出し H1 | 同上 | 800 | 28px（詳細） / 22px（一覧） | 1.38 |
| 見出し H2 | 同上 | 700 | 1.3em (md-content) | — |
| カードタイトル | 同上 | 700 | 15px | 1.55 |
| カード本文 | 同上 | 400 | 12.5px | 1.7 |
| ラベル/バッジ | 同上 | 500–600 | 11–12px | 1.6 |
| コード | `JetBrains Mono`, `Fira Code`, `SF Mono` | 400 | 0.84em | 1.7 |
| ロゴ | 同上 | 800 | 15px | — |

Letter-spacing: `-0.4px` (ロゴ), `-0.5px` (大見出し)

---

## Spacing Scale

Tailwind CSS の `spacing` スケールを使用（4pxベース）:

| 名前 | px | 用途 |
|------|----|------|
| `space-1` | 4px | アイコン内マージン |
| `space-2` | 8px | バッジ・チップ padding |
| `space-3` | 12px | ボタン padding (sm) |
| `space-4` | 16px | カード padding |
| `space-5` | 20px | カード padding (comfortable) |
| `space-6` | 24px | セクション間 |
| `space-8` | 32px | ページ top padding |
| `space-12` | 48px | ログインフォーム padding |

Card padding (CSS var):
- `comfortable` (default): `18px 20px 16px`
- `compact`: `14px 16px 12px`

---

## Border Radius

| 用途 | 値 |
|------|-----|
| ボタン・入力 | `8px` |
| カード | `12px` |
| バッジ・チップ | `4px` (badge) / `20px` (pill chip) |
| ドロップダウン | `12px` |
| ロゴアイコン | `7px` |
| アバター | `50%` |
| コードブロック | `10px` |

---

## Shadows

| 用途 | 値 |
|------|-----|
| カード hover | `0 6px 24px rgba(59,130,246,0.10)` |
| ドロップダウン | `0 8px 32px rgba(0,0,0,0.14)` |
| カード通常 | `none` |
| スティッキーヘッダー | `backdrop-filter: blur(14px)` |

---

## Breakpoints

| 名前 | px | 適用 |
|------|----|------|
| `sm` | 768px | モバイル/タブレット分岐（ヘッダー・ログイン） |
| `md` | 900px | 詳細画面サイドバー表示/非表示 |
| `lg` | 1024px | カードグリッド 3列→2列 |

Tailwindの `sm:`, `md:`, `lg:` プレフィックスで実装可能。

---

## Animations

| 名前 | 定義 | 用途 |
|------|------|------|
| `fadeUp` | `opacity:0,translateY(10px) → opacity:1,translateY(0)` 0.2s ease | 画面遷移 |
| `chipfloat` | `translateY(0) rotate(-1.5deg) → translateY(-9px) rotate(1.5deg)` ∞ alternate | ログイン装飾チップ |
| `spin` | `rotate(0→360deg)` 0.7s linear ∞ | 無限スクロールスピナー |
| カードhover | `translateY(-2px)` 0.2s | カードホバー |
| 色遷移全般 | `transition: all 0.15s` | ボタン・リンク |
