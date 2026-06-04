# Requirements Document

## Project Description (Input)
# 学習用の本格的フルスタック技術ブログアプリの要件

## 開発原則

- TDD
  - VitestとPlaywrightを使う
- Spec駆動開発
- トークン最適化を常に意識すること

## 実装したい機能

- ログイン機能
  - Cognitoにて認証機能を実装する
  - メールアドレスとパスワードによる基本的な認証方式でOK
- ログアウト機能
- ブログ一覧機能
- ブログ詳細機能
  - 個別のブログを詳しく見る機能
- ブログ投稿機能
  - ブログを投稿するための機能
  - マークダウン記法にて登録できるものとする
  - QiitaやZennのようにビューアー機能付きで投稿できるものとする

## 実装したい画面

- ログイン画面
- トップ画面 
  - 投稿されたブログの概要だけ閲覧できる画面
- ブログ詳細画面
- ブログ投稿画面

## 技術スタック

- 全体
  - pnpm
  - biome
  - editorconfig
  - zod
  - TypeScriptで書く
  - フルマネージド・サーバーレスアプリケーションの原則にしたがって実装する
- インフラ
  - AWS
  - CDK
    - ただし flociなども活用してローカルにて機能検証できるようにする
- 共通コンポーネント
  - shardに共通の機能をまとめる
    - フロントエンド・バックエンドで共通して使用する定数・エラーハンドリング・バリデーションチェック・ヘルパーメソッドなどを全て一式でまとめる
- バックエンド
  - hono
  - aws-lambda
  - vitest
- フロントエンド
  - react
  - vite
  - vitest
  - playwright
  - tailwind CSS
  - shadcn/ui

## Requirements
<!-- Will be generated in /kiro-spec-requirements phase -->
