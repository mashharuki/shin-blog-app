// data.js — Sample blog post data for Shin Tech Blog

const TAG_COLORS = {
  'AWS': '#f59e0b', 'CDK': '#3b82f6', 'TypeScript': '#3178c6',
  'Serverless': '#8b5cf6', 'Hono': '#f97316', 'API': '#10b981',
  'Lambda': '#f59e0b', 'TDD': '#10b981', 'Vitest': '#6366f1',
  'Playwright': '#ef4444', 'Testing': '#06b6d4', 'pnpm': '#f59e0b',
  'Monorepo': '#8b5cf6', 'Turborepo': '#0ea5e9', 'DevOps': '#64748b',
  'React': '#06b6d4', 'shadcn': '#0f172a', 'Tailwind': '#0ea5e9',
  'UI': '#8b5cf6', 'Advanced': '#6366f1', 'DynamoDB': '#f59e0b',
  'Cognito': '#ef4444', 'Auth': '#10b981', 'Zod': '#3b82f6',
};

const BLOG_POSTS = [
  {
    id: '1',
    title: 'AWS CDKでサーバーレスAPIを構築する完全ガイド',
    excerpt: 'AWS CDKを使ってLambda + API Gateway + DynamoDBのサーバーレスAPIを型安全に構築する方法を詳しく解説します。TypeScriptで書かれたCDKスタックのベストプラクティスも紹介。',
    content: `# AWS CDKでサーバーレスAPIを構築する完全ガイド

## はじめに

AWS CDK（Cloud Development Kit）は、使い慣れたプログラミング言語でクラウドインフラを定義できる強力なフレームワークです。本記事ではTypeScriptを使ってLambda + API Gateway + DynamoDBのサーバーレスAPIを型安全に構築する方法を解説します。

## 前提条件

- Node.js 20以上がインストール済み
- AWS CLI の設定済み
- pnpm がインストール済み

## プロジェクトのセットアップ

まずCDKプロジェクトを初期化します。

\`\`\`bash
mkdir blog-api && cd blog-api
npx cdk init app --language typescript
pnpm install
\`\`\`

## スタックの定義

\`\`\`typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class BlogApiStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'BlogTable', {
      tableName: 'blog-posts',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const handler = new lambda.Function(this, 'BlogHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('src/lambda'),
      handler: 'index.handler',
      environment: { TABLE_NAME: table.tableName },
    });

    table.grantReadWriteData(handler);

    const api = new apigateway.RestApi(this, 'BlogApi', {
      restApiName: 'Blog Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
      },
    });

    const posts = api.root.addResource('posts');
    posts.addMethod('GET', new apigateway.LambdaIntegration(handler));
    posts.addMethod('POST', new apigateway.LambdaIntegration(handler));
  }
}
\`\`\`

## Lambda ハンドラーの実装

\`\`\`typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === 'GET') {
    const result = await docClient.send(
      new ScanCommand({ TableName: process.env.TABLE_NAME })
    );
    return {
      statusCode: 200,
      body: JSON.stringify({ posts: result.Items }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
  return { statusCode: 405, body: 'Method Not Allowed' };
};
\`\`\`

## デプロイ

\`\`\`bash
pnpm cdk bootstrap
pnpm cdk deploy
\`\`\`

## まとめ

AWS CDKを使うことで、TypeScriptで型安全にインフラを定義でき、チームでのコードレビューも容易になります。サーバーレスアーキテクチャと組み合わせることで、スケーラブルで低コストなAPIを素早く構築できます。`,
    author: { name: '山田 太郎' },
    tags: ['AWS', 'CDK', 'TypeScript', 'Serverless'],
    readTime: 8,
    likes: 142,
    createdAt: '2026-06-01',
  },
  {
    id: '2',
    title: 'Honoフレームワーク入門：Lambda上で動く超高速WebAPI',
    excerpt: 'HonoはEdge-firstな超軽量Webフレームワーク。AWS Lambdaでも快適に動作します。基本的なルーティングからミドルウェア、Zodバリデーションまで実践的に解説。',
    content: `# Honoフレームワーク入門

## Honoとは

HonoはTypeScript-firstな高速Webフレームワークです。

\`\`\`typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

const postSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(10),
});

app.post('/api/posts', zValidator('json', postSchema), (c) => {
  const body = c.req.valid('json');
  return c.json({ id: crypto.randomUUID(), ...body }, 201);
});

export default app;
\`\`\`

## Lambda アダプター

\`\`\`typescript
import { handle } from 'hono/aws-lambda';
export const handler = handle(app);
\`\`\``,
    author: { name: '鈴木 花子' },
    tags: ['Hono', 'TypeScript', 'API', 'Lambda', 'Zod'],
    readTime: 6,
    likes: 98,
    createdAt: '2026-05-28',
  },
  {
    id: '3',
    title: 'TDD実践ガイド：VitestとPlaywrightで堅牢なアプリを作る',
    excerpt: 'テスト駆動開発（TDD）の基本概念から実践的な活用方法まで。VitestによるUnit/Integrationテスト、PlaywrightによるE2Eテストの書き方を豊富なコード例とともに紹介。',
    content: `# TDD実践ガイド

## Red → Green → Refactor

\`\`\`typescript
import { describe, it, expect } from 'vitest';

describe('createPost', () => {
  it('should create a post with valid data', async () => {
    const result = await createPost({ title: 'Test', content: 'Hello' });
    expect(result.id).toBeDefined();
    expect(result.title).toBe('Test');
  });
});
\`\`\``,
    author: { name: '田中 健司' },
    tags: ['TDD', 'Vitest', 'Playwright', 'Testing'],
    readTime: 12,
    likes: 203,
    createdAt: '2026-05-25',
  },
  {
    id: '4',
    title: 'pnpm + Turborepoで始めるモノレポ設計パターン',
    excerpt: 'pnpmのワークスペース機能とTurborepoを組み合わせたモノレポ構成のセットアップ方法。フロントエンド・バックエンド・共通パッケージを一つのリポジトリで管理する実践的な手法を紹介。',
    content: `# pnpm + Turborepo モノレポ

## workspace構成

\`\`\`
apps/
  frontend/   ← React + Vite
  backend/    ← Hono + Lambda
packages/
  shared/     ← 共通型・バリデーション
\`\`\``,
    author: { name: '佐藤 美咲' },
    tags: ['pnpm', 'Monorepo', 'Turborepo', 'DevOps'],
    readTime: 10,
    likes: 87,
    createdAt: '2026-05-20',
  },
  {
    id: '5',
    title: 'shadcn/uiとTailwindで作る美しいコンポーネント設計',
    excerpt: 'shadcn/uiはコピー&ペースト方式のUIコンポーネントライブラリ。Tailwind CSSと組み合わせることで、カスタマイズ性の高い美しいUIを素早く構築できます。CVAでのバリアント管理も解説。',
    content: `# shadcn/ui入門

## Button コンポーネント

\`\`\`tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva('rounded-md font-medium transition-colors', {
  variants: {
    variant: {
      default: 'bg-primary text-white hover:bg-primary/90',
      outline: 'border border-input bg-background hover:bg-accent',
    },
  },
  defaultVariants: { variant: 'default' },
});
\`\`\``,
    author: { name: '中村 勇気' },
    tags: ['React', 'shadcn', 'Tailwind', 'UI'],
    readTime: 7,
    likes: 156,
    createdAt: '2026-05-15',
  },
  {
    id: '6',
    title: 'TypeScriptの高度な型システムを完全理解する',
    excerpt: 'Conditional Types、Template Literal Types、infer キーワードなど、TypeScriptの高度な型機能を実例とともに解説。実際のプロジェクトで使える型テクニックを体系的に学べます。',
    content: `# TypeScript型システム深掘り

## Conditional Types

\`\`\`typescript
type IsArray<T> = T extends unknown[] ? true : false;
type Flatten<T> = T extends Array<infer U> ? U : T;

type A = Flatten<string[]>;  // string
type B = Flatten<number>;    // number
\`\`\`

## Template Literal Types

\`\`\`typescript
type EventName<T extends string> = \`on\${Capitalize<T>}\`;
type ClickEvent = EventName<'click'>;  // 'onClick'
\`\`\``,
    author: { name: '小林 亜依' },
    tags: ['TypeScript', 'Advanced'],
    readTime: 15,
    likes: 275,
    createdAt: '2026-05-10',
  },
  {
    id: '7',
    title: 'TanStack Queryでサーバー状態管理を劇的に改善する',
    excerpt: 'TanStack Query（React Query）を使ったサーバー状態管理のベストプラクティス。キャッシュ戦略、楽観的更新、無限スクロール実装例を交えながら解説します。',
    content: `# TanStack Query 入門\n\n## インストール\n\n\`\`\`bash\npnpm add @tanstack/react-query\n\`\`\`\n\n## 基本的な使い方\n\n\`\`\`typescript\nconst { data, isLoading } = useQuery({\n  queryKey: ['posts'],\n  queryFn: () => fetch('/api/posts').then(r => r.json()),\n});\n\`\`\``,
    author: { name: '山本 拓海' },
    tags: ['React', 'TypeScript', 'API'],
    readTime: 9, likes: 134, createdAt: '2026-05-05',
  },
  {
    id: '8',
    title: 'Biomeで JavaScript/TypeScript を高速 Lint・フォーマット',
    excerpt: 'Biome（旧Rome）はRust製の超高速Lint/フォーマッタ。ESLint + Prettierの代替として、ゼロコンフィグで最高速の開発体験を実現します。移行ガイドも紹介。',
    content: `# Biome 入門\n\n\`\`\`json\n{\n  "$schema": "https://biomejs.dev/schemas/1.8.0/schema.json",\n  "organizeImports": { "enabled": true },\n  "linter": { "enabled": true, "rules": { "recommended": true } }\n}\n\`\`\``,
    author: { name: '伊藤 さくら' },
    tags: ['TypeScript', 'DevOps'],
    readTime: 5, likes: 76, createdAt: '2026-05-01',
  },
  {
    id: '9',
    title: 'AWS Cognitoで本格的な認証フローを実装する',
    excerpt: 'Cognito User Poolsを使ったメール認証、JWT検証、リフレッシュトークン管理の実装方法。CDKでインフラを定義し、Honoバックエンドで検証する完全なサンプルを紹介。',
    content: `# AWS Cognito 認証実装\n\n## CDKでUserPoolを定義\n\n\`\`\`typescript\nconst userPool = new cognito.UserPool(this, 'BlogUserPool', {\n  selfSignUpEnabled: false,\n  signInAliases: { email: true },\n  passwordPolicy: { minLength: 8 },\n});\n\`\`\``,
    author: { name: '田中 健司' },
    tags: ['AWS', 'Cognito', 'Auth', 'TypeScript'],
    readTime: 11, likes: 189, createdAt: '2026-04-25',
  },
  {
    id: '10',
    title: 'Zodで型安全なバリデーション設計パターン',
    excerpt: 'ZodはTypeScript-firstなバリデーションライブラリ。フロントエンド・バックエンドで共通スキーマを定義し、型安全なバリデーションを実現する設計パターンを解説。',
    content: `# Zod バリデーション設計\n\n\`\`\`typescript\nimport { z } from 'zod';\n\nconst PostSchema = z.object({\n  title:   z.string().min(1).max(100),\n  content: z.string().min(10),\n  tags:    z.array(z.string()).max(5),\n});\n\ntype Post = z.infer<typeof PostSchema>;\n\`\`\``,
    author: { name: '佐藤 美咲' },
    tags: ['Zod', 'TypeScript', 'API'],
    readTime: 7, likes: 112, createdAt: '2026-04-20',
  },
  {
    id: '11',
    title: 'Playwright E2Eテスト完全攻略ガイド',
    excerpt: 'Playwrightを使ったE2Eテストの書き方からCI/CDへの組み込みまで完全解説。Page Object Model、APIモック、視覚的回帰テストなど実践的なテクニックを網羅。',
    content: `# Playwright E2E テスト\n\n\`\`\`typescript\nimport { test, expect } from '@playwright/test';\n\ntest('ログインフロー', async ({ page }) => {\n  await page.goto('/login');\n  await page.fill('[name=email]', 'taro@example.com');\n  await page.fill('[name=password]', 'password123');\n  await page.click('button[type=submit]');\n  await expect(page).toHaveURL('/');\n});\n\`\`\``,
    author: { name: '中村 勇気' },
    tags: ['Playwright', 'Testing', 'TDD'],
    readTime: 13, likes: 167, createdAt: '2026-04-15',
  },
  {
    id: '12',
    title: 'OpenAPI × Hono で型安全なAPI定義と自動ドキュメント生成',
    excerpt: 'hono/zod-openapi を使ってOpenAPI仕様を自動生成し、Swagger UIでドキュメントを公開する方法を解説。スキーマファーストな開発でフロントエンドとのIF共有が劇的に改善。',
    content: `# Hono + OpenAPI\n\n\`\`\`typescript\nimport { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';\n\nconst app = new OpenAPIHono();\n\nconst route = createRoute({\n  method: 'get',\n  path: '/posts',\n  responses: {\n    200: { content: { 'application/json': { schema: z.array(PostSchema) } } },\n  },\n});\n\`\`\``,
    author: { name: '鈴木 花子' },
    tags: ['Hono', 'API', 'TypeScript', 'Zod'],
    readTime: 8, likes: 95, createdAt: '2026-04-10',
  },
];

const CURRENT_USER = { name: '山田 太郎', email: 'taro@example.com' };
