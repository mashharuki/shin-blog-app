# Suggested Commands

## 開発サーバー
```bash
pnpm frontend dev       # Vite 開発サーバー（frontend）
pnpm backend dev        # tsx watch src/index.ts（backend）
```

## ビルド
```bash
pnpm frontend build     # tsc -b && vite build
pnpm backend build      # tsc
pnpm cdk build          # tsc
```

## テスト
```bash
pnpm cdk test           # Jest（CDK のみ現状テストあり）
# frontend/backend: Vitest 追加後に pnpm frontend test 等
```

## Lint / Format
```bash
pnpm biome:check        # Biome lint + format check + write（推奨）
pnpm biome:format       # フォーマットのみ書き込み
pnpm biome:format:check # フォーマットチェックのみ（CI 向け）
pnpm frontend lint      # ESLint（frontend のみ）
```

## CDK 操作
```bash
pnpm cdk cdk synth
pnpm cdk cdk deploy
pnpm cdk cdk diff
```

## ワークスペース全般
```bash
pnpm --filter @shin-blog-app/frontend <cmd>  # frontend に直接コマンド委譲
pnpm --filter @shin-blog-app/cdk <cmd>
```

## Darwin 固有注意
- `pnpm` は Homebrew/volta でインストール; `npm i -g pnpm` より安定
- AWS CDK デプロイには AWS CLI プロファイル設定が必要（`~/.aws/credentials`）
