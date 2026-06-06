# Implementation Plan

- [ ] 1. Foundation - 共有パッケージ（型・スキーマ）定義
- [x] 1.1 Post 型とインターフェースを定義する
  - `shared/src/types/post.ts` に `Post`・`PostSummary`・`CreatePostInput` 型を定義する（`authorName`・`tags` フィールド含む）
  - `shared/src/types/auth.ts` に `AuthUser` 型を定義する（`sub`, `email`）
  - `shared/src/index.ts` で全型・スキーマをエクスポートする
  - `shared/package.json` に `zod` を追加し `pnpm install` を実行する
  - `tsc --noEmit` でコンパイルエラーがゼロになることを確認する
  - _Requirements: 6.4_

- [x] 1.2 Zod バリデーションスキーマを定義する
  - `shared/src/schemas/post.ts` に `createPostSchema`（title・content・tags?）と `postIdSchema` を実装する
  - `createPostSchema` で空文字・最大長超過・タグ5件超過を `parse` で検出できることをローカルで確認する
  - _Requirements: 1.3, 5.4, 6.4_

- [ ] 2. Foundation - CDK インフラストラクチャ定義
- [x] 2.1 (P) DynamoDB テーブルと GSI を CDK で定義する
  - `pkgs/cdk/lib/blog-stack.ts` に `TableV2`（PK=`pk`, SK=`sk`, on-demand billing）を定義する
  - GSI `byCreatedAt`（gsi1pk, gsi1sk, Projection: ALL）を設定する
  - `cdk synth` で DynamoDB リソースがエラーなく合成されることを確認する
  - _Requirements: 3.2, 6.2_
  - _Boundary: BlogStack / CDK_

- [x] 2.2 (P) Cognito UserPool と UserPoolClient を CDK で定義する
  - `UserPool`（`signInAliases: { email: true }`, `selfSignUpEnabled: false`）を定義する
  - `UserPoolClient`（`authFlows: { userPassword: true, userSrp: true }`, `generateSecret: false`）を定義する
  - `cdk synth` で Cognito リソースがエラーなく合成されることを確認する
  - _Requirements: 1.1, 6.3_
  - _Boundary: BlogStack / CDK_

- [x] 2.3 (P) S3 + CloudFront で SPA ホスティングを CDK で定義する
  - `S3 Bucket`（`blockPublicAccess: BLOCK_ALL`）と CloudFront OAC を定義する
  - `DistributionProps` で 404 時に `/index.html` へフォールバックするエラーレスポンスを設定する
  - `cdk synth` で S3/CloudFront リソースがエラーなく合成されることを確認する
  - _Requirements: 6.1_
  - _Boundary: BlogStack / CDK_

- [x] 2.4 Lambda Function・Function URL・IAM を CDK で定義する
  - `NodejsFunction`（Node.js 20.x）を定義し `TABLE_NAME`・`COGNITO_USER_POOL_ID`・`COGNITO_CLIENT_ID` を環境変数で注入する
  - `FunctionUrl`（`authType: NONE`, CORS: allowedOrigins/methods/headers 設定）を定義し URL を CfnOutput で出力する
  - `table.grantReadWriteData(fn)` で最小権限 IAM を付与する
  - `cdk synth` で全リソースがエラーなく合成されることを確認する
  - _Requirements: 3.5, 4.4, 6.3_
  - _Depends: 2.1, 2.2_

- [ ] 3. Core - バックエンド実装
- [x] 3.1 (P) Cognito JWT 検証ミドルウェアを実装する
  - `backend/src/types.ts` に `HonoEnv`（`Variables.jwtPayload: { sub: string; email: string }`）を定義する
  - `backend/src/middleware/auth.ts` に `cognitoAuthMiddleware` を実装する（`aws-jwt-verify`）
  - `CognitoJwtVerifier` をモジュールスコープで1回だけ生成してコールドスタート時の JWKS フェッチを最小化する
  - JWT 検証成功時は `jwtPayload` を Hono context に設定し、失敗・ヘッダー欠如時は `401 Unauthorized` を返す
  - `backend/package.json` に `aws-jwt-verify` を追加し `pnpm install` を実行する
  - 有効 JWT・無効 JWT・ヘッダー欠如の各ケースでユニットテストが通ることを確認する
  - _Requirements: 1.4, 5.5, 6.3_
  - _Boundary: Backend / Auth_

- [x] 3.2 (P) Post リポジトリ（DynamoDB CRUD）を実装する
  - `backend/src/repositories/post.repository.ts` に `PostRepository` インターフェースと実装クラスを実装する
  - `listPosts`: GSI `byCreatedAt` を `ScanIndexForward: false`・`Limit: 20` でクエリし `ExclusiveStartKey` によるカーソルページネーションを実装する
  - `getPost`: PK=`POST#{postId}`・SK=`#METADATA` で GetItem し未存在は `null` を返す
  - `createPost`: `uuid()` で postId 生成、`authorName` は `authorEmail` の `@` 前プレフィックスから生成、PutItem 実行
  - `backend/package.json` に `@aws-sdk/lib-dynamodb`・`uuid`・`@types/uuid` を追加し `pnpm install` を実行する
  - `listPosts`・`getPost`・`createPost` の各 DynamoDB モックテストが通ることを確認する
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 5.3, 6.2_
  - _Boundary: Backend / Data_

- [ ] 3.3 Posts API ルーターを実装する
  - `backend/src/routes/posts.ts` に Hono ルーターを作成し3エンドポイントを実装する
  - `GET /api/posts`（認証不要）: `query.cursor` を受け取り `PostRepository.listPosts` を呼び出す
  - `GET /api/posts/:id`（認証不要）: `PostRepository.getPost` を呼び出し未存在は 404 を返す
  - `POST /api/posts`（`cognitoAuthMiddleware` 必須）: `createPostSchema` でボディを検証後 `PostRepository.createPost` を呼び出し 201 を返す
  - Hono テストクライアントで全エンドポイントの正常系・エラー系テストが通ることを確認する
  - _Requirements: 3.1, 3.5, 4.1, 4.2, 4.4, 5.3, 5.5_
  - _Depends: 3.1, 3.2_

- [ ] 3.4 Hono アプリのエントリポイントと Lambda ハンドラーを実装する
  - `backend/src/index.ts` で Hono アプリを構築し CORS ミドルウェアを設定する（origin を `CORS_ORIGIN` 環境変数から指定）
  - `/api` 配下に PostsRouter をマウントする
  - Lambda デプロイ用に `hono/aws-lambda` の `handle` でハンドラーをエクスポートする
  - `NODE_ENV !== 'production'` 時に `@hono/node-server` でローカルサーバーを起動できることを確認する
  - _Requirements: 3.5, 4.4, 6.3_
  - _Depends: 3.3_

- [ ] 4. Core - フロントエンド認証基盤
- [ ] 4.1 (P) Amplify 設定と useAuth フックを実装する
  - `frontend/src/lib/amplify.ts` に `Amplify.configure` を実装する（`VITE_COGNITO_USER_POOL_ID`・`VITE_COGNITO_CLIENT_ID`・`VITE_COGNITO_REGION` から設定）
  - `frontend/src/hooks/useAuth.ts` に `useAuth` フックを実装する（`user: AuthUser | null`・`isLoading`・`signIn`・`signOut`）
  - アプリ起動時に `fetchAuthSession` でセッションを復元する（`useEffect` 内）
  - `frontend/package.json` に `aws-amplify` を追加し `pnpm install` を実行する
  - `signIn` 成功・失敗・`signOut`・初期セッション復元の各ケースで Vitest テストが通ることを確認する
  - _Requirements: 1.1, 1.2, 1.5, 2.2_
  - _Boundary: Frontend / Auth_

- [ ] 4.2 (P) 型付き API クライアントを実装する
  - `frontend/src/lib/api.ts` に `ApiClient`（`getPosts`・`getPost`・`createPost`）を実装する
  - POST リクエスト時に `fetchAuthSession` で idToken を取得し `Authorization: Bearer {token}` を付与する
  - GET リクエストは認証ヘッダーなしで `VITE_API_BASE_URL` に送信する
  - 401 レスポンス時は `useNavigate` を呼ばずに `window.location` で `/login` へリダイレクトする（フック外のため）
  - `VITE_API_BASE_URL=http://localhost:3000` のとき `getPosts()` が `GET http://localhost:3000/api/posts` を送信することを確認する
  - _Requirements: 3.1, 4.1, 5.3_
  - _Boundary: Frontend / Client_

- [ ] 5. Core - UI コンポーネント実装
- [ ] 5.1 (P) タグカラーマッピングと BlogPostCard コンポーネントを実装する
  - `frontend/src/lib/tagColors.ts` にタグ名→カラーコードの定数マップ（AWS・TypeScript・React 等）を定義する
  - `frontend/src/components/blog/BlogPostCard.tsx` を実装する（著者アバター・タイトル2行クランプ・抜粋3行クランプ・タグ Badges 最大3件・readTime・いいね表示）
  - readTime をクライアントサイドで `Math.ceil(content.split(' ').length / 200)` で計算する
  - ホバー時のボーダー・シャドウ・`translateY(-2px)` アニメーションを Tailwind で実装する
  - `BlogPostCard` が `post` prop の各フィールド（title・authorName・tags・excerpt）を正しくレンダリングすることを確認する
  - _Requirements: 3.1, 3.3_
  - _Boundary: Frontend / Blog_

- [ ] 5.2 (P) MarkdownEditor コンポーネントを実装する
  - `frontend/src/components/blog/MarkdownEditor.tsx` を実装する
  - ツールバー7ボタン（Bold・Italic・H2・Code・Link・Image・List）を実装し、`textarea` の `selectionStart`/`selectionEnd` で選択テキストを包む挿入ロジックを実装する
  - 編集ペイン（JetBrains Mono フォント）と `react-markdown` プレビューペイン（remark-gfm + rehype-highlight）を Tailwind `flex` で並列配置する
  - ペインセレクター（編集/分割/プレビュー）を実装し、モバイル（<768px）では「分割」を非表示にする
  - 文字数・語数カウンターをステータスバーに表示する
  - `frontend/package.json` に `react-markdown`・`remark-gfm`・`rehype-highlight` を追加し `pnpm install` を実行する
  - 本文入力でプレビューエリアが即時更新されることを確認する
  - _Requirements: 5.1, 5.2_
  - _Boundary: Frontend / Blog_

- [ ] 6. Core - フロントエンドページ実装
- [ ] 6.1 (P) ログインページを実装する
  - `frontend/src/pages/LoginPage.tsx` を実装する
  - デスクトップ：左カラムにグラデーション背景＋技術チップアニメーション（TypeScript・AWS 等）・右カラムにログインフォームの2カラムレイアウトを実装する
  - モバイル：ロゴ＋フォームのシングルカラムレイアウトにする
  - shadcn/ui Form + Input で email・password フィールドを実装し、未入力バリデーションエラーをフィールド下部に表示する
  - 認証失敗時は `NotAuthorizedException` を catch してエラーボックスに表示する
  - ログイン成功後に `useNavigate` でトップページ（`/`）へ遷移することを確認する
  - _Requirements: 1.1, 1.2, 1.3_
  - _Boundary: Frontend / Page_

- [ ] 6.2 (P) ブログ一覧ページを実装する
  - `frontend/src/pages/TopPage.tsx` を実装する
  - 最新/トレンドのタブ切り替え（クライアントサイドソート、トレンドは likes DESC を模擬）を実装する
  - タイトル・タグのキーワード検索（クライアントサイドフィルタリング）と検索クリアボタンを実装する
  - 全ユニークタグのフィルターチップ（選択/解除でクライアントサイドフィルタリング）を実装する
  - `IntersectionObserver` で `nextCursor` がある限り追加取得する無限スクロールを実装する
  - 記事0件時に「記事がありません」の空状態メッセージを表示する
  - `GET /api/posts` の返却データが BlogPostCard グリッドに正しく表示されることを確認する
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - _Boundary: Frontend / Page_

- [ ] 6.3 (P) ブログ詳細ページを実装する
  - `frontend/src/pages/BlogDetailPage.tsx` を実装する
  - `react-markdown`（remark-gfm + rehype-highlight）でマークダウン本文をレンダリングする
  - 著者アバター・名前・日時・readTime を含むメタバーを実装する
  - デスクトップ：スティッキー目次サイドバー（本文見出し h1-h3 を正規表現で抽出）、モバイル：アコーディオン目次を実装する
  - 同タグを持つ関連記事3件をリスト表示する（クライアントサイドフィルタリング）
  - 「一覧に戻る」ナビゲーションリンク（`useNavigate(-1)` または `/`）を実装する
  - 存在しない postId で 404 エラーメッセージとトップへのリンクが表示されることを確認する
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - _Boundary: Frontend / Page_

- [ ] 6.4 (P) 記事投稿ページを実装する
  - `frontend/src/pages/BlogCreatePage.tsx` を実装する
  - タイトル入力欄（ヘッダーインライン）・タグ入力（Enter で追加・×で削除・最大5件）・`MarkdownEditor` を配置する
  - 投稿ボタン押下時に `createPostSchema` で zod バリデーションを行い、エラーは各フィールドに表示する
  - 投稿成功後に `api.createPost()` の返却 `postId` で `/posts/{postId}` へ遷移する
  - タイトルが空の場合に投稿ボタンが disabled になり API コールが発生しないことを確認する
  - _Requirements: 5.1, 5.3, 5.4, 5.5_
  - _Boundary: Frontend / Page_

- [ ] 7. Integration - アプリケーション統合とルーティング
- [ ] 7.1 NavBar/Header・App ルーティング・ProtectedRoute を統合する
  - `frontend/src/components/layout/NavBar.tsx` を実装する（ロゴ・ナビ・検索バー・ダークモード切替・「投稿する」ボタン・アバタードロップダウン・モバイルハンバーガーメニュー）
  - `frontend/src/components/auth/ProtectedRoute.tsx` を実装する（`isLoading` 中はスピナー表示・未認証は `<Navigate replace to="/login" />`）
  - `frontend/src/App.tsx` で react-router-dom のルート定義（`/login`・`/`・`/posts/:id`・`/create`）を実装する
  - `frontend/src/main.tsx` で `Amplify.configure` を呼び出してアプリを初期化する
  - `frontend/package.json` に `react-router-dom` を追加し `pnpm install` を実行する
  - 未認証状態で `/create` に直接アクセスするとログインページにリダイレクトされることを確認する
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 5.5, 6.1_

- [ ] 7.2 フロントエンドとバックエンドの環境変数と接続を統合する
  - `frontend/.env.local` に `VITE_API_BASE_URL`・`VITE_COGNITO_USER_POOL_ID`・`VITE_COGNITO_CLIENT_ID`・`VITE_COGNITO_REGION` を設定する
  - `backend/.env` に `COGNITO_USER_POOL_ID`・`COGNITO_CLIENT_ID`・`TABLE_NAME`・`AWS_REGION`・`CORS_ORIGIN` を設定する
  - ローカル環境でバックエンドを起動し `GET http://localhost:3000/api/posts` が 200 を返すことを確認する
  - _Requirements: 6.3_

- [ ] 8. Validation - テストと品質検証
- [ ] 8.1 (P) 共有スキーマのユニットテストを実装する
  - `shared/src/schemas/post.test.ts` を作成する
  - `createPostSchema` の境界値テスト（空文字・タイトル200文字超過・本文50000文字超過・タグ6件）を実装する
  - `vitest run --project shared` で全テストが通ることを確認する
  - _Requirements: 1.3, 5.4, 6.4_
  - _Boundary: Shared_

- [ ] 8.2 (P) バックエンドのユニットテストを実装する
  - `backend/src/middleware/auth.test.ts`: 有効 JWT・無効 JWT・`Authorization` ヘッダー欠如の各ケースをテストする（`aws-jwt-verify` をモック）
  - `backend/src/repositories/post.repository.test.ts`: `listPosts`（ページネーション込み）・`getPost`（存在・不存在）・`createPost` を DynamoDB モックでテストする
  - `backend/src/routes/posts.test.ts`: 全3エンドポイントの正常系・エラー系を Hono テストクライアントでテストする
  - `vitest run --project backend` で全バックエンドテストが通ることを確認する
  - _Requirements: 3.5, 4.4, 5.5, 6.3_
  - _Boundary: Backend_

- [ ] 8.3 (P) フロントエンド useAuth のユニットテストを実装する
  - `frontend/src/hooks/useAuth.test.ts` を作成する
  - `signIn` 成功・失敗・`signOut`・初期セッション復元の各ケースをテストする（`aws-amplify/auth` をモック）
  - `vitest run --project frontend` で全フロントエンドテストが通ることを確認する
  - _Requirements: 1.1, 1.2, 1.5, 2.2_
  - _Boundary: Frontend / Auth_

- [ ] 8.4 E2E テスト（Playwright）を実装する
  - テスト1「ログイン→投稿→詳細確認」: ログイン → 投稿ページで記事入力 → 投稿 → 詳細ページで内容確認
  - テスト2「未認証ガード」: 未ログイン状態で `/create` にアクセス → ログインページへのリダイレクト確認
  - テスト3「マークダウンプレビュー」: 投稿画面でマークダウン入力後プレビューエリアに反映されることを確認
  - テスト4「ログアウト→セッション切断」: ログアウト後ブラウザバックで `/create` に戻れないことを確認
  - `playwright test` で全 E2E テストが通ることを確認する
  - _Requirements: 1.1, 1.4, 2.2, 2.3, 5.1, 5.2, 5.3_
  - _Depends: 7.1, 7.2_
