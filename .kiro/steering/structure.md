# Project Structure

## Organization Philosophy

**パッケージ分離モノレポ**。関心事（フロントエンド・バックエンド・インフラ・共有）を
独立したパッケージに分離し、依存関係を明示的に管理する。

## Directory Patterns

### Workspace Root
**Location**: `/`  
**Purpose**: pnpm workspace 設定、Biome 設定、ルートスクリプト  
**Example**: `package.json`（`pnpm --filter @shin-blog-app/frontend ...` で個別実行）

### Frontend Package
**Location**: `pkgs/frontend/`  
**Purpose**: React SPA。ユーザー向け UI コンポーネントとページ  
**Example**: `src/App.tsx`、`src/components/`（追加予定）

### Backend Package
**Location**: `pkgs/backend/`  
**Purpose**: Hono API サーバー。REST エンドポイント定義  
**Example**: `src/index.ts`（ルーター定義のエントリポイント）

### CDK Package
**Location**: `pkgs/cdk/`  
**Purpose**: AWS インフラ定義（IaC）  
**Example**: `lib/cdk-stack.ts`（スタック定義）、`bin/`（CDK App エントリポイント）

### Shared Package
**Location**: `pkgs/shared/`  
**Purpose**: フロントエンド・バックエンド間で共有する型・ユーティリティ  
**Example**: API レスポンス型、バリデーションスキーマ

## Naming Conventions

- **Packages**: `@shin-blog-app/{name}`（kebab-case）
- **Files**: PascalCase（React コンポーネント）、camelCase（ユーティリティ）、kebab-case（設定）
- **Components**: PascalCase（例: `BlogPost.tsx`、`PostList.tsx`）
- **Functions/Variables**: camelCase

## Import Organization

```typescript
// 外部ライブラリ
import { Hono } from 'hono'
import { useState } from 'react'

// パッケージ内絶対パス（エイリアス設定後）
import { PostType } from '@shin-blog-app/shared'

// 相対パス
import { Button } from './components/Button'
```

## Code Organization Principles

- バックエンドのルーター定義は機能単位でファイル分割し `src/routes/` に集約する（予定）
- CDK スタックは環境（dev/prod）ごとに分離できる設計にする
- `shared` パッケージは UI・サーバー双方から依存されるため、副作用のない純粋な型・関数のみ含める

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
