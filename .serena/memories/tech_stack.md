# Tech Stack

## Package Manager
- pnpm 10.33.0（`packageManager` フィールドで固定）
- workspace: `pkgs/*`

## Frontend (`pkgs/frontend`)
- React 19.2.6
- Vite 8.0.12
- TypeScript 6.0.2（`~6.0.2`）
- ESLint 10 + eslint-plugin-react-hooks + eslint-plugin-react-refresh
- 予定追加: Tailwind CSS、shadcn/ui、Vitest、Playwright

## Backend (`pkgs/backend`)
- Hono 4.12.23 + `@hono/node-server` 1.19.14
- TypeScript 5.8.3
- tsx 4.7.1（開発サーバー）
- 予定追加: Vitest、aws-lambda アダプター

## Infrastructure (`pkgs/cdk`)
- aws-cdk-lib 2.232.1
- aws-cdk CLI 2.1100.1
- TypeScript 5.9.3
- Jest 29 + ts-jest（テスト）

## Shared (`pkgs/shared`)
- TypeScript（バージョン未設定、スケルトン状態）
- 予定: zod バリデーション、共通型・ヘルパー

## Tooling（全体）
- Biome 1.9.4（フォーマット: スペース、JS クォート: ダブル）
- editorconfig（予定）
- zod（予定）

## Key Decisions
- Hono: Lambda/Edge 移植性のため Express より採用
- Biome: ESLint+Prettier 代替として全体品質統一
- CDK: TypeScript で IaC 統一管理
