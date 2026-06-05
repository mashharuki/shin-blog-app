# Handoff: Shin Tech Blog

## Overview
エンジニア向けフルスタック技術ブログアプリのUIデザイン仕様書です。
Zenn / Qiita / dev.to に着想を得た、シンプル・クリーン・白ベースのデザインです。

## About the Design Files
`reference/` 内のファイルは **HTMLで作成されたデザインリファレンス（プロトタイプ）** です。
プロダクションコードとして直接使用することは想定していません。
実装時は、このドキュメントと `reference/Shin Tech Blog.html` を参照しながら、
以下の技術スタックで再実装してください。

## Fidelity
**High-fidelity（ハイフィデリティ）**
- 最終的な配色・タイポグラフィ・スペーシング・インタラクションを完全に反映
- デザイントークンは `TOKENS.md` に定義済み
- コンポーネント仕様は `SCREENS.md` に詳細記載

## 技術スタック（実装先）

```
pnpm + Turborepo (monorepo)
├── apps/
│   ├── frontend/     React + Vite + Tailwind CSS + shadcn/ui
│   └── backend/      Hono + AWS Lambda
└── packages/
    └── shared/       Zod schemas / types / constants
```

| レイヤー | 技術 |
|----------|------|
| フロントエンド | React 18, Vite, Tailwind CSS, shadcn/ui |
| バックエンド | Hono, AWS Lambda, API Gateway |
| 認証 | AWS Cognito (email + password) |
| DB | Amazon DynamoDB |
| インフラ | AWS CDK (TypeScript), floci (ローカル検証) |
| テスト | Vitest (unit/integration), Playwright (E2E) |
| Linter/Formatter | Biome |
| バリデーション | Zod |
| モノレポ | pnpm workspaces + Turborepo |

## 画面一覧

| 画面 | ルート | 説明 |
|------|--------|------|
| ログイン | `/login` | Cognito認証フォーム |
| ホーム（一覧） | `/` | ブログ記事カードグリッド |
| ブログ詳細 | `/posts/:id` | マークダウンレンダリング＋目次 |
| 投稿エディタ | `/editor` | 左右分割マークダウンエディタ |

詳細は `SCREENS.md` を参照してください。

## API仕様

`API_SPEC.md` にHonoルート定義・Zodスキーマ・リクエスト/レスポンス型を記載。

## テスト仕様

`TEST_SPEC.md` にVitest / Playwright のテストシナリオを記載。

## デザイントークン

`TOKENS.md` に色・タイポグラフィ・スペーシング・シャドウを記載。

## Files

```
design_handoff_shin_tech_blog/
├── README.md          ← このファイル
├── SCREENS.md         ← 画面別コンポーネント仕様
├── API_SPEC.md        ← API定義・Zodスキーマ
├── TEST_SPEC.md       ← テストシナリオ（Vitest + Playwright）
├── TOKENS.md          ← デザイントークン
└── reference/
    └── Shin Tech Blog.html   ← インタラクティブなデザインリファレンス
```
