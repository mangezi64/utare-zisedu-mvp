#!/usr/bin/env bash
# =============================================================================
# UTARE ZISEDU AI — Local Pre-Push / Pre-Merge CI Verification Gate
# =============================================================================
# Runs the exact same 4 quality gates as GitHub Actions (.github/workflows/ci.yml)
# inside the local Docker container BEFORE code is pushed or merged:
#   1. Cross-architecture lockfile guard (prevents arm64/x64 rollup mismatches)
#   2. ESLint (npm run lint)
#   3. TypeScript strict compiler check (npm run typecheck)
#   4. Vitest unit & integration test suite (npm run test:ci)
#   5. Next.js production build check (npm run build)
# =============================================================================

set -euo pipefail

echo "=================================================================="
echo " UTARE ZISEDU AI — Running Local Container CI Gate"
echo "=================================================================="

# 1. Ensure no architecture-specific package-lock.json is tracked
if git ls-files --error-unmatch package-lock.json >/dev/null 2>&1; then
  echo "X ERROR: package-lock.json is tracked in git."
  echo "  Remove it with: git rm --cached package-lock.json"
  exit 1
fi

# 2. Ensure Docker container is running
if ! docker ps --format '{{.Names}}' | grep -q '^utare-zisedu-web$'; then
  echo "-> Starting utare-zisedu-web container..."
  docker compose up -d
fi

echo "-> [1/4] Running ESLint..."
docker compose exec -T web npm run lint

echo "-> [2/4] Running TypeScript Compiler Check (tsc --noEmit)..."
docker compose exec -T web npm run typecheck

echo "-> [3/4] Running Automated Unit & Integration Tests (Vitest)..."
docker compose exec -T web npm run test:ci

echo "-> [4/4] Verifying Next.js Production Build..."
docker compose exec -T -e NODE_ENV=production web npm run build

# Restart dev server cleanly if build touched .next in the running container
docker compose restart web >/dev/null 2>&1 || true

echo "=================================================================="
echo " ✓ ALL LOCAL CI CHECKS PASSED (Lint, Typecheck, Tests & Build)"
echo "=================================================================="
