#!/bin/bash

# ── BookSmith Update Script ───────────────────────────────────────────────────
# Usage: ./update.sh "your commit message"
# Run this from /Users/dyarbrough/Documents/booksmith
# ─────────────────────────────────────────────────────────────────────────────

REPO="/Users/dyarbrough/Documents/booksmith"
COMMIT_MSG="${1:-"BookSmith update"}"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${BLUE}▸ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo -e "\n${BLUE}╔══════════════════════════════╗"
echo -e "║   BookSmith Update Script    ║"
echo -e "╚══════════════════════════════╝${NC}"

# ── Sanity checks ─────────────────────────────────────────────────────────────
cd "$REPO" || fail "Repo not found at $REPO"
[ -f "frontend/package.json" ] || fail "frontend/package.json missing — wrong folder?"
[ -f "backend/server.js"     ] || fail "backend/server.js missing — wrong folder?"

# ── 1. Frontend ───────────────────────────────────────────────────────────────
step "Installing frontend dependencies..."
cd frontend
rm -rf node_modules
npm install --silent
ok "Frontend dependencies installed"

step "Building frontend..."
npm run build || fail "Frontend build failed"
ok "Frontend built"
cd ..

# ── 2. Wire build into backend ────────────────────────────────────────────────
step "Wiring build into backend..."
rm -rf backend/public
cp -r frontend/dist backend/public
ok "Build wired into backend"

# ── 3. Backend ────────────────────────────────────────────────────────────────
step "Installing backend dependencies..."
cd backend
npm install --silent
ok "Backend dependencies installed"
cd ..

# ── 4. Git ────────────────────────────────────────────────────────────────────
step "Checking for changes..."

if [ -z "$(git status --porcelain)" ]; then
  warn "Nothing to commit — no source files changed"
else
  echo ""
  git status --short
  echo ""
  git add .
  git commit -m "$COMMIT_MSG"

  BRANCH="$(git branch --show-current)"
  echo ""
  step "Pushing to GitHub (branch: $BRANCH)..."

  # Try to push — show full output so auth errors are visible
  if git push origin "$BRANCH" --set-upstream; then
    ok "Pushed to GitHub ✓"
  else
    echo ""
    warn "Push failed. This usually means your Personal Access Token needs to be set up."
    warn "Run this once to store your credentials:"
    echo -e "  ${BLUE}git config --global credential.helper osxkeychain${NC}"
    warn "Then push manually:"
    echo -e "  ${BLUE}git push origin $BRANCH --set-upstream${NC}"
    warn "(Use your GitHub username and PAT as the password)"
    echo ""
    warn "The app will still launch — fix the push separately."
  fi
fi

# ── 5. Launch ─────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}╔══════════════════════════════════════╗"
echo -e "║  ✦ BookSmith is ready!               ║"
echo -e "║    http://localhost:3000             ║"
echo -e "║                                      ║"
echo -e "║    Press Ctrl+C to stop              ║"
echo -e "╚══════════════════════════════════════╝${NC}\n"

cd backend && node server.js
