# Task Completion

コーディングタスク完了時に必ず実行するコマンド:

## 必須チェック
```bash
# 1. Biome（lint + format）
pnpm biome:check

# 2. TypeScript 型チェック（各パッケージ）
pnpm frontend build   # tsc -b（エラーなし確認）
pnpm backend build    # tsc（エラーなし確認）
pnpm cdk build        # tsc（エラーなし確認）

# 3. テスト
pnpm cdk test         # CDK テスト
# frontend/backend は Vitest 導入後に追加
```

## 完了判定基準
- `biome:check` がエラーなし（警告は要確認）
- TypeScript コンパイルエラーなし
- 既存テストがすべてパス
- `.kiro/specs/{feature}/` の該当タスクにチェック済みマーク

## Spec 駆動完了フロー
実装完了後は `$kiro-validate-impl {feature}` で仕様との整合性を検証する。
