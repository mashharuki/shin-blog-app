# Technology Stack

## Architecture

pnpm モノレポ構成のフルスタック TypeScript アプリケーション。
フロントエンド SPA + サーバーレス API バックエンド + AWS CDK インフラの三層構造。

## Core Technologies

- **Language**: TypeScript（全パッケージ共通）
- **Package Manager**: pnpm 10 + workspaces (`pkgs/*`)
- **Frontend**: React 19 + Vite 8 + TypeScript 6
- **Backend**: Hono 4 + Node.js（`@hono/node-server`）
- **Infrastructure**: AWS CDK v2（`aws-cdk-lib` 2.232.1）

## Key Libraries

- **Hono**: 軽量・高速な Web フレームワーク。Edge/Node.js 両対応
- **Biome**: 全体フォーマッター・リンター（`biome.json` でプロジェクトルートから管理）
- **ESLint**: フロントエンドのみ追加リント（`eslint-plugin-react-hooks` 等）

## Development Standards

### Type Safety
- TypeScript strict モードを原則とする
- `any` は使用しない

### Code Quality
- Biome でフォーマット統一（インデント: スペース、クォート: ダブル）
- コミット前に `pnpm biome:check` を実行する

### Testing
- CDK: Jest + ts-jest（`pkgs/cdk/`）
- フロントエンド・バックエンド: テスト戦略は仕様フェーズで決定する

## Development Environment

### Required Tools
- Node.js 20+
- pnpm 10+
- AWS CLI（インフラデプロイ時）

### Common Commands
```bash
# フロントエンド Dev: pnpm frontend dev
# バックエンド Dev:   pnpm backend dev (tsx watch)
# CDK Build:         pnpm cdk build
# CDK Test:          pnpm cdk test
# Biome Format:      pnpm biome:format
# Biome Check:       pnpm biome:check
```

## Key Technical Decisions

- **Hono を採用**: Express より軽量・型安全。Lambda/Edge への移植性が高い
- **Biome を採用**: ESLint + Prettier の代替として全体品質を統一管理
- **CDK を採用**: CloudFormation より型安全なインフラ管理。TypeScript で統一

---
_Document standards and patterns, not every dependency_
