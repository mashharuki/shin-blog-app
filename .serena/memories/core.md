# Core — shin-blog-app

Spec駆動開発（Kiro-style）学習用フルスタック技術ブログアプリ。pnpm モノレポ。

## Source Map

```
/
├── pkgs/
│   ├── frontend/   React 19 SPA (Vite 8, TypeScript 6)
│   ├── backend/    Hono 4 API (Node.js, TypeScript 5)
│   ├── cdk/        AWS CDK v2 インフラ定義
│   └── shared/     フロント・バック共通型・ユーティリティ
├── .kiro/
│   ├── steering/   プロジェクト全体ステアリング（Source of Truth）
│   └── specs/      機能仕様（fullstack-tech-blog が進行中）
├── biome.json      全体フォーマッター・リンター設定
└── pnpm-workspace.yaml
```

## Invariants

- 全パッケージ TypeScript（frontend のみ TypeScript 6、他は 5.x）
- パッケージ名は `@shin-blog-app/{name}` 形式
- ルートスクリプトは `pnpm --filter @shin-blog-app/xxx` でパッケージ委譲
- Biome がフォーマット・リント担当（ESLint は frontend のみ補完）
- `.kiro/specs/fullstack-tech-blog/` が進行中の仕様。tech stack 詳細は `mem:tech_stack` 参照
- 開発コマンドは `mem:suggested_commands`、完了基準は `mem:task_completion`、規約は `mem:conventions` 参照
