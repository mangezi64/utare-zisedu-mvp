#!/usr/bin/env bash
# =============================================================================
# UTARE ZISEDU AI — Safe PR & Merge Workflow (Local Gate + Remote CI Fallback)
# =============================================================================
# Usage:
#   ./scripts/safe-pr-merge.sh [PR_NUMBER]
#
# How it works:
#   1. Runs ./scripts/pre-push-ci-check.sh locally first so broken builds never
#      get pushed or merged.
#   2. Watches the GitHub Actions CI run for the current branch / PR.
#   3. If Remote GitHub CI fails for any reason, it automatically pulls the
#      failure logs and re-runs local diagnostics instead of merging.
#   4. Merges to `main` ONLY after both Local CI and Remote CI succeed.
# =============================================================================

set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"
REPO="mangezi64/utare-zisedu-mvp"
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Step 1: Run local CI verification first
./scripts/pre-push-ci-check.sh

if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "Already on $BRANCH and local CI checks passed."
  exit 0
fi

# Step 2: Push branch to origin
echo "-> Pushing branch '$BRANCH' to origin..."
git push -u origin "$BRANCH"

# Step 3: Find or create PR
PR_NUM="${1:-}"
if [ -z "$PR_NUM" ]; then
  PR_NUM=$(gh pr list --repo "$REPO" --head "$BRANCH" --json number --jq '.[0].number // empty')
fi

if [ -z "$PR_NUM" ]; then
  echo "-> Creating Pull Request for '$BRANCH'..."
  gh pr create --repo "$REPO" --base main --head "$BRANCH" --fill
  PR_NUM=$(gh pr list --repo "$REPO" --head "$BRANCH" --json number --jq '.[0].number')
fi

echo "-> Watching Remote GitHub Actions CI for PR #${PR_NUM}..."
sleep 3
RUN_ID=$(gh run list --repo "$REPO" --branch "$BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId')

if ! gh run watch "$RUN_ID" --repo "$REPO" --exit-status; then
  echo ""
  echo "=================================================================="
  echo " X REMOTE CI FAILED ON PR #${PR_NUM} — MERGE ABORTED!"
  echo " Fetching failed remote CI logs and running local diagnostic..."
  echo "=================================================================="
  gh run view "$RUN_ID" --repo "$REPO" --log-failed | tail -n 40
  echo ""
  echo "-> Re-running local container test & typecheck for comparison:"
  docker compose exec -T web npm run typecheck
  docker compose exec -T web npm run test:ci
  exit 1
fi

echo "-> Remote CI passed! Merging PR #${PR_NUM} into main..."
gh pr merge "$PR_NUM" --repo "$REPO" --merge --delete-branch --admin
git checkout main
git pull origin main
echo "✓ PR #${PR_NUM} safely verified and merged into main!"
