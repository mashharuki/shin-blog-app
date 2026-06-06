#!/usr/bin/env bash
# ============================================================
# setup-local-aws.sh
#
# Initializes AWS resources on Floci (http://localhost:4566)
# for local development.  Run once after `docker compose up`.
#
# Requirements: aws CLI v2, jq
# Usage:        ./scripts/setup-local-aws.sh
# ============================================================
set -euo pipefail

ENDPOINT="http://localhost:4566"
REGION="us-east-1"
TABLE_NAME="BlogTable-dev"

# Dummy credentials required by AWS CLI even against a local emulator
export AWS_ACCESS_KEY_ID="local"
export AWS_SECRET_ACCESS_KEY="local"
export AWS_DEFAULT_REGION="$REGION"

AWS="aws --endpoint-url $ENDPOINT --region $REGION"

echo "▶ Floci endpoint: $ENDPOINT"

# ─────────────────────────────────────────────────────────────
# 1. Wait for Floci to be ready
# ─────────────────────────────────────────────────────────────
echo "⏳ Waiting for Floci..."
until curl -sf "$ENDPOINT/_floci/health" > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Floci is up"

# ─────────────────────────────────────────────────────────────
# 2. Create DynamoDB table (idempotent)
# ─────────────────────────────────────────────────────────────
echo "▶ Creating DynamoDB table: $TABLE_NAME"
if $AWS dynamodb describe-table --table-name "$TABLE_NAME" > /dev/null 2>&1; then
  echo "  ↳ Table already exists, skipping"
else
  $AWS dynamodb create-table \
    --table-name "$TABLE_NAME" \
    --attribute-definitions \
      AttributeName=pk,AttributeType=S \
      AttributeName=sk,AttributeType=S \
      AttributeName=gsi1pk,AttributeType=S \
      AttributeName=gsi1sk,AttributeType=S \
    --key-schema \
      AttributeName=pk,KeyType=HASH \
      AttributeName=sk,KeyType=RANGE \
    --global-secondary-indexes '[
      {
        "IndexName": "byCreatedAt",
        "KeySchema": [
          {"AttributeName": "gsi1pk", "KeyType": "HASH"},
          {"AttributeName": "gsi1sk", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
      }
    ]' \
    --billing-mode PROVISIONED \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --output text > /dev/null
  echo "  ↳ Table created"
fi

# ─────────────────────────────────────────────────────────────
# 3. Seed a sample blog post (optional)
# ─────────────────────────────────────────────────────────────
echo "▶ Seeding sample blog post..."
POST_ID="local-sample-001"
CREATED_AT="2026-06-06T00:00:00.000Z"

$AWS dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "pk":          {"S": "POST#'"$POST_ID"'"},
    "sk":          {"S": "#METADATA"},
    "gsi1pk":      {"S": "POST"},
    "gsi1sk":      {"S": "'"$CREATED_AT"'"},
    "postId":      {"S": "'"$POST_ID"'"},
    "title":       {"S": "ローカル開発テスト記事"},
    "content":     {"S": "# Hello Floci!\n\nこれはローカル開発用のサンプル記事です。\n\n```typescript\nconsole.log(\"Hello!\");\n```\n"},
    "authorId":    {"S": "dev-user-001"},
    "authorEmail": {"S": "dev@local.test"},
    "authorName":  {"S": "dev"},
    "tags":        {"L": [{"S": "TypeScript"}, {"S": "AWS"}]},
    "createdAt":   {"S": "'"$CREATED_AT"'"}
  }' \
  --condition-expression "attribute_not_exists(pk)" 2>/dev/null || true
echo "  ↳ Sample post seeded (post-id: $POST_ID)"

# ─────────────────────────────────────────────────────────────
# 4. Print backend .env for local dev
# ─────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup complete!  Add these to pkgs/backend/.env:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat <<ENV

TABLE_NAME=$TABLE_NAME
AWS_ENDPOINT_URL=$ENDPOINT
AWS_REGION=$REGION
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
LOCAL_DEV=true
CORS_ORIGIN=http://localhost:5173
ENV
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Then start the backend:  pnpm backend dev"
echo "And the frontend:        pnpm frontend dev"
