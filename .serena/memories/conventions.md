# Conventions

## 言語・出力
- コードは TypeScript（`any` 禁止、strict モード原則）
- ドキュメント・仕様・コミットメッセージは日本語
- コード内コメントは英語可
- 変数名・関数名・ファイル名は英語

## 命名
- React コンポーネント: PascalCase（`BlogPost.tsx`）
- ユーティリティ関数・変数: camelCase
- 設定・スクリプトファイル: kebab-case
- パッケージ: `@shin-blog-app/{kebab-case}`

## ファイル構成
- Backend ルーター: `pkgs/backend/src/routes/` に機能単位で分割（規約、未実装）
- Frontend コンポーネント: `pkgs/frontend/src/components/` 以下（未実装）
- Shared: 副作用なし純粋な型・関数のみ（UI/サーバー双方から依存）

## コード品質
- Biome でフォーマット統一（インデント: スペース 2、クォート: ダブル）
- コミット前 `pnpm biome:check` 必須
- ESLint は frontend のみ（react-hooks, react-refresh ルール）

## テスト方針
- TDD: Vitest（unit/integration）+ Playwright（E2E）
- CDK: Jest + ts-jest

## Spec 駆動
- 新機能は必ず `.kiro/specs/` の kiro-spec-* ワークフローを通す
- `.kiro/steering/` が設計の Source of Truth
