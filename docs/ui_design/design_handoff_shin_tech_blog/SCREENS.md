# Screens — Shin Tech Blog

## 共通: Header（スティッキーナビゲーション）

**表示条件**: ログイン画面以外の全画面に表示

### レイアウト
```
[Logo]  [ホーム][タグ][人気]  ──flex:1──  [🔍][🌙][投稿する][Avatar▾]
```
- 高さ: `60px`、`position: sticky; top: 0; z-index: 200`
- 背景: `rgba(255,255,255,0.9)` + `backdrop-filter: blur(14px)`
- ボーダー: `border-bottom: 1px solid var(--border)`
- 最大幅: `1200px`、padding: `0 20px`

### ロゴ
- アイコン: `30×30px`、`border-radius: 7px`、背景 `var(--primary)`
- テキスト: "Shin Tech Blog"、`font-weight: 800`、`font-size: 15px`
- モバイル（<768px）: テキストを "STB" に省略

### ナビリンク（デスクトップのみ）
- padding: `5px 12px`、`border-radius: 7px`
- Active: `background: var(--primary-light)`、`color: var(--primary)`、`font-weight: 600`
- Hover: `background: var(--bg-secondary)`

### 検索
- アイコンボタン → クリックでインライン入力に展開
- 展開時: `220px`、`border: 1.5px solid var(--primary)`
- 閉じるボタン(×)付き

### ダークモードトグル
- `34×34px`、`border-radius: 8px`、アイコンは☀️/🌙

### 投稿ボタン
- `variant: default (primary)`、`size: sm`
- ログイン時のみ表示

### アバタードロップダウン
- `Avatar(26px)` + `ChevronDown`
- ドロップダウン: `min-width: 188px`、`border-radius: 12px`
- 項目: プロフィール・自分の記事・ログアウト（赤）

### モバイルハンバーガー（<768px）
- `36×36px`、タップでスライドダウンメニュー
- メニュー内: ナビ項目・投稿ボタン・ユーザー情報・ログアウト

---

## Screen 1: ログイン画面 (`/login`)

### レイアウト
```
[左パネル: 装飾]  |  [右パネル: フォーム]
     flex:1        |       width: 460px
```
モバイル（<768px）: 左パネル非表示、フォームのみ全画面

### 左パネル
- 背景グラデーション: `linear-gradient(145deg, #0f2d5e 0%, #1d4ed8 55%, #3b82f6 100%)`
- ドットグリッド背景: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)` / `36px 36px`
- 浮遊チップ（8個）: TypeScript, AWS CDK, React, Hono, Vitest, Lambda, Zod, pnpm
  - スタイル: `background: rgba(255,255,255,0.1)`, `backdropFilter: blur(6px)`, `border-radius: 20px`
  - アニメーション: `chipfloat` (各チップで delay 0〜1.3s)
- 中央コンテンツ: ロゴ(68px) + タイトル + キャッチコピー + 統計3つ（記事数・ユーザー数・いいね数）

### 右パネル: フォーム
- 背景: `var(--bg)`、padding: `48px`
- コンテンツ最大幅: `340px`（中央寄せ）
- 要素（上から）:
  1. 見出し "おかえりなさい 👋" (`font-size: 26px`, `font-weight: 700`)
  2. サブテキスト `font-size: 14px`、`color: var(--text-secondary)`
  3. メールアドレス入力 (LabelInput)
  4. パスワード入力 (LabelInput, type=password)
  5. エラーメッセージ（表示時）: `background: #fef2f2`, `border: 1px solid #fecaca`, `color: #dc2626`
  6. ログインボタン（全幅、`padding: 11px 0`、`font-size: 15px`）
  7. "パスワードを忘れた方" テキストリンク
  8. デモボックス: グレー背景、自動入力ボタン付き

### LabelInput コンポーネント仕様
```typescript
interface LabelInputProps {
  label: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}
```
- ラベル: `font-size: 13px`, `font-weight: 500`, `color: var(--text-secondary)`
- 必須マーク: `*` in `var(--primary)`
- Input: `padding: 10px 12px`, `border-radius: 8px`
- フォーカス: `border: 1.5px solid var(--primary)`
- 通常: `border: 1.5px solid var(--border)`

### バリデーション
- メールアドレス・パスワード両方空の場合: エラーメッセージ表示
- 送信中: ボタン disabled + "ログイン中…"
- 成功: `setIsLoggedIn(true)` + `/` へ遷移 (900ms delay)

---

## Screen 2: ホーム（一覧）画面 (`/`)

### レイアウト
- コンテナ: `max-width: 1200px`、`padding: 32px 24px 60px`

### ヘッダーエリア
```
[技術記事 / サブテキスト]  ──── flex:1 ────  [🔍 検索ボックス]
```
- タイトル: `font-size: 22px`, `font-weight: 700`

### タブバー
- 3タブ: 最新 / トレンド / フォロー中
- タブコンテナ: `background: var(--bg-secondary)`, `border-radius: 8px`, `padding: 3px`
- Active tab: `background: var(--surface)`, `font-weight: 600`, `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`
- 右側に件数表示 (`font-size: 12px`, `color: var(--text-muted)`)

### タグフィルタ（チップ群）
- 全タグをpill型ボタンで表示
- 通常: `border: 1px solid var(--border)`, `background: var(--bg-secondary)`
- Active: `border: 1px solid var(--primary)`, `background: var(--primary-light)`, `color: var(--primary)`
- 選択解除: 同じタグ再クリック

### BlogCard コンポーネント
```typescript
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: { name: string };
  tags: string[];
  readTime: number;
  likes: number;
  createdAt: string; // 'YYYY-MM-DD'
}
```

**カード構造（上から）:**
1. Authorrow: Avatar(28px) + 著者名(12px/600) + 日付(11px)
2. タイトル: `font-size: 15px`, `font-weight: 700`, 2行クランプ
3. excerpt: `font-size: 12.5px`, 3行クランプ, `color: var(--text-secondary)`
4. タグバッジ: 最大3個（overflow省略）
5. フッター: 読了時間(左) | いいねボタン(右)

**カードインタラクション:**
- Hover: `translateY(-2px)`, `border-color: var(--primary)`, `box-shadow: 0 6px 24px rgba(59,130,246,0.10)`
- いいねボタン: ローカルstate でトグル、色 `#ef4444`

### グリッドレイアウト

```css
.cards-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(3, 1fr);   /* デスクトップ */
}
@media (max-width: 1024px) {
  .cards-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 767px) {
  .cards-grid { grid-template-columns: 1fr; gap: 14px; }
}
```

### 無限スクロール
- 初期表示: 6件
- 追加読み込み: 6件ずつ（IntersectionObserver使用）
- ローダー表示: スピナー + "読み込み中…"
- 完了表示: "全 N 件を表示しました ✓"
- rootMargin: `200px`（先読み）
- フィルター変更時はvisibleCountをリセット

---

## Screen 3: ブログ詳細画面 (`/posts/:id`)

### レイアウト
```
[← 一覧に戻る]
┌─────────────────────────┬──────────────┐
│ Article (flex:1)        │ Sidebar 256px│  ← <900px でサイドバー非表示
└─────────────────────────┴──────────────┘
```

### Articleカラム

**タグバッジ群** → **H1タイトル** (28px/800) → **メタバー** → **本文** → **関連記事**

**メタバー:**
- Avatar(40px) + 著者名(600/14px) + 日付・読了時間
- いいねボタン(ハート) + 保存ボタン(ブックマーク) + シェアボタン
- active時: いいねは赤(`#ef4444`), 保存はプライマリ

**本文（Markdown）:**
- `marked.js` でHTMLに変換
- `highlight.js` でシンタックスハイライト（GitHub Darkテーマ）
- カスタムrenderer: コードブロックに `data-lang` 属性付与→言語タブ表示
```css
.md-content pre::before {
  content: attr(data-lang);
  position: absolute; top: 0; right: 0;
  font-size: 11px; color: #7d8590;
  background: #161b22; padding: 3px 10px;
  border-radius: 0 9px 0 8px;
}
```

**コードブロックスタイル:**
- 背景: `#0d1117`, border: `1px solid #30363d`, border-radius: `10px`
- padding: `18px 20px`

**関連記事:**
- 同じタグを持つ記事を最大3件表示
- クリックで詳細画面を切替（同画面内遷移）

### Sidebarカラム（>900px）
- `position: sticky; top: 80px`

**目次 (TOC):**
- H1/H2/H3 見出しを自動抽出（正規表現 `/^#{1,3} .+$/gm`）
- 見出しレベルに応じてインデント（`padding-left: (level-1)*10px`）
- Hover: `color: var(--primary)`, `background: var(--bg-tertiary)`

**著者カード:**
- Avatar(48px), 名前, 役職
- フォローボタン（outlined）

### モバイル目次（<900px）
- "目次 ▼" トグルボタン → クリックで展開/折りたたみ
- 本文上部（メタバーの直下）に配置

---

## Screen 4: ブログ投稿エディタ (`/editor`)

### レイアウト
```
[← キャンセル] [タイトル入力 ─────] [編集|分割|プレビュー] [公開する]
[タグ: #TypeScript × ] [+ タグ入力]
┌────────────────────────────┬────────────────────────────┐
│ [B][I][H][<>][🔗][🖼][≡]  │  (プレビューはタブなし)    │
│ textarea (monaco-like)     │  マークダウンプレビュー    │
│                            │                            │
├────────────────────────────┤                            │
│ N文字 / 約N語 / Markdown   │                            │
└────────────────────────────┴────────────────────────────┘
```
- 高さ: `calc(100vh - 60px)` (ヘッダー除く全画面)

### ヘッダーバー
- キャンセルボタン: `← キャンセル` (ghostボタン)
- タイトル入力: `font-size: 18px`, `font-weight: 700`, border/outline: none, placeholder付き
- ペインセレクタ: セグメントコントロール（モバイルでは「分割」を削除）
- 公開ボタン: title未入力時は disabled (グレー)

**公開フロー:**
1. クリック → ボタン "公開中…" (disabled)
2. 1.2s後: "✓ 公開しました！" (緑, `#10b981`)
3. 1.6s後: `/` へ遷移

### タグバー
- 背景: `var(--bg-secondary)`
- タグchip: `background: var(--primary-light)`, `border-radius: 20px`
- 削除ボタン: 各chipに `×`
- 入力: Enter キーで追加、重複防止

### マークダウンツールバー

| アイコン | 挿入テキスト |
|---------|-------------|
| **B** (太字) | `**<selected>**` |
| *I* (斜体) | `*<selected>*` |
| # (見出し) | `\n## ` |
| `<>` (コード) | `` `<selected>` `` |
| 🔗 (リンク) | `[<selected>](url)` |
| 🖼 (画像) | `![alt](` + `)` |
| ≡ (リスト) | `\n- ` |

### エディタペイン
- フォント: `'JetBrains Mono', 'Fira Code', 'SF Mono', monospace`
- `font-size: 13.5px`, `line-height: 1.85`
- `resize: none`
- ステータスバー: 文字数 / 語数 / "Markdown"

### プレビューペイン
- `padding: 24px 28px`
- タイトルをH1として上部に表示
- `marked.parse()` + `highlight.js` で本文レンダリング

### モバイル（<768px）
- 「分割」ペインを非表示
- 「編集」「プレビュー」のみ切替

---

## コンポーネントインベントリ

### Atoms
| コンポーネント | props | 説明 |
|--------------|-------|------|
| `Button` | `variant: 'default'\|'outline'\|'ghost'\|'danger'`, `size: 'sm'\|'md'\|'lg'`, `onClick`, `disabled` | 汎用ボタン |
| `Badge` | `color?: string` | タグバッジ (背景色: `${color}22`) |
| `Avatar` | `name: string`, `size?: number` | イニシャルアバター（色は名前ハッシュ） |
| `LabelInput` | `label`, `type`, `placeholder`, `value`, `onChange`, `required` | ラベル付き入力 |
| `IconBtn` | `onClick` | アイコン専用34px正方形ボタン |

### Molecules
| コンポーネント | 説明 |
|--------------|------|
| `BlogCard` | post情報を受け取りカード表示、いいねローカルstate |
| `DropItem` | ドロップダウン内の1行アイテム |

### Organisms
| コンポーネント | 説明 |
|--------------|------|
| `Header` | スティッキーヘッダー（レスポンシブ対応） |

### Pages (Screens)
| コンポーネント | 説明 |
|--------------|------|
| `LoginScreen` | ログイン画面 |
| `HomeScreen` | 記事一覧（無限スクロール） |
| `BlogDetailScreen` | 記事詳細（マークダウン＋TOC） |
| `EditorScreen` | 投稿エディタ |
