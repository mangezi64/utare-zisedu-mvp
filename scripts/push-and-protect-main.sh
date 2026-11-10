#!/usr/bin/env bash
# =============================================================================
# UTARE ZISEDU AI — GitHub Personal Repo Push & Branch Protection Setup
# =============================================================================
# 1. Ensures GitHub CLI (gh) is authenticated as your personal account: mangezi64
# 2. Creates https://github.com/mangezi64/utare-zisedu-mvp (if not yet created)
# 3. Pushes the `main` branch
# 4. Configures GitHub Branch Protection on `main`:
#    - Teammates MUST open a Pull Request, pass CI (Lint + Typecheck + Tests + Build),
#      and receive 1 approval before merging.
#    - Superuser Mode (`enforce_admins: false`): YOU (`mangezi64`) can bypass
#      restrictions and merge/push directly whenever needed to keep momentum moving!
# =============================================================================

set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"
GH_USER="mangezi64"
REPO_NAME="utare-zisedu-mvp"
FULL_REPO="${GH_USER}/${REPO_NAME}"

echo "=================================================================="
echo " UTARE ZISEDU AI — GitHub Setup & Superuser Branch Protection"
echo " Target Account: https://github.com/${GH_USER}"
echo "=================================================================="

# 1. Check if mangezi64 is authenticated in gh
if ! gh auth status 2>&1 | grep -q "${GH_USER}"; then
  echo ""
  echo "-> Your GitHub CLI is currently logged into your Odyssey account (smangezi)."
  echo "-> Let's add your personal account (${GH_USER})."
  echo "   Select: GitHub.com -> HTTPS -> Yes -> Login with a web browser"
  echo ""
  gh auth login -h github.com -p https -w
fi

# 2. Switch active GitHub CLI account to mangezi64
echo "-> Switching active GitHub CLI account to ${GH_USER}..."
gh auth switch -u "${GH_USER}"
gh auth setup-git

# 3. Create repository if it does not exist on GitHub yet
if ! gh repo view "${FULL_REPO}" >/dev/null 2>&1; then
  echo "-> Creating repository https://github.com/${FULL_REPO}..."
  gh repo create "${FULL_REPO}" \
    --public \
    --description "UTARE ZISEDU AI — Economic Mobility Bridge for Zimbabwean Tertiary Talent (Next.js + Supabase + Gemini AI)" \
    --source=. \
    --remote=origin \
    --push
else
  echo "-> Repository https://github.com/${FULL_REPO} already exists. Pushing main..."
  git push -u origin main
fi

# 4. Apply Branch Protection on `main` with Superuser bypass for mangezi64
echo "-> Applying Branch Protection Rules on 'main' (PR + CI required for team; Superuser direct-merge enabled for ${GH_USER})..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${FULL_REPO}/branches/main/protection" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Quality Checks (Lint, Typecheck, Tests & Build)"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

echo ""
echo "=================================================================="
echo " SUCCESS!"
echo " 1. Code pushed to: https://github.com/${FULL_REPO}"
echo " 2. CI Pipeline active (.github/workflows/ci.yml): Lint, Typecheck, Vitest & Build"
echo " 3. Branch Protection active on 'main':"
echo "    - Collaborators must open a PR + pass CI + get approval."
echo "    - Superuser (${GH_USER}) can merge or push directly at any time."
echo "=================================================================="
