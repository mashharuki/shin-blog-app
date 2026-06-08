# shin-blog-app

Spec駆動開発の学習用に開発したブログアプリです。

## 動かし方

### 共通

#### インストール

```bash
pnpm i
```

#### フォーマッター

```bash
pnpm run biome:format
```

#### ビルド

```bash
pnpm run -r build
```

#### テスト

```bash
pnpm run -r test
```

#### E2E テスト

```bash
pnpm run e2e 
```

### floci関連

#### セットアップ

```bash
pnpm run floci:up
```

```bash
pnpm run floci:setup
```

#### CDK bootstrap / deploy（Floci ローカル環境向け）

> Floci が起動している状態で実行すること。ダミー認証情報を自動設定するため、実際の AWS 認証は不要。

```bash
pnpm run floci:cdk:bootstrap 
```

```bash
pnpm run floci:cdk:deploy
```

その後、それぞれバックエンドとフロントエンドを起動する

```bash
pnpm backend run dev
pnpm frontend run dev
```

```bash
pnpm run floci:cdk:destroy
```

#### 開発用のトークンを発行するスクリプト

```bash
pnpm run floci:token
```

#### floci ダウン

```bash
pnpm run floci:down
```

### AWS CDK関連

> 事前にAWSに認証しておくこと

#### diff

```bash
pnpm cdk run diff
```

#### デプロイ

```bash
pnpm cdk run deploy --all
```

#### リソース削除

```bash
pnpm cdk run destroy --force
```