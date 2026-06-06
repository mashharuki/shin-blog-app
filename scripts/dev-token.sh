#!/usr/bin/env bash
# ============================================================
# dev-token.sh
#
# Generates a LOCAL_DEV JWT for testing authenticated endpoints
# against the local backend.
#
# Usage:
#   ./scripts/dev-token.sh [email]
#   ./scripts/dev-token.sh dev@local.test
#
# The token is accepted ONLY when LOCAL_DEV=true in the backend.
# ============================================================
set -euo pipefail

EMAIL="${1:-dev@local.test}"
SUB="dev-user-$(echo "$EMAIL" | md5sum | cut -c1-8)"

# Build a simple base64url-encoded payload (no crypto — dev only)
HEADER='{"alg":"none","typ":"JWT"}'
PAYLOAD="{\"sub\":\"$SUB\",\"email\":\"$EMAIL\",\"iat\":$(date +%s),\"exp\":$(($(date +%s) + 3600))}"

b64url() {
  printf '%s' "$1" | base64 | tr '+/' '-_' | tr -d '='
}

TOKEN="$(b64url "$HEADER").$(b64url "$PAYLOAD").dev-local-signature"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Local Dev JWT (expires in 1h)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " email : $EMAIL"
echo " sub   : $SUB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Authorization: Bearer $TOKEN"
echo ""
echo "# Example curl:"
echo "curl -X POST http://localhost:3000/api/posts \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -d '{\"title\":\"Test\",\"content\":\"# Hello\",\"tags\":[\"TypeScript\"]}'"
echo ""
