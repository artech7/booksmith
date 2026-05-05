#!/bin/bash

# ── BookSmith Update Script ───────────────────────────────────────────────────
# Run this from /Users/dyarbrough/Documents/booksmith after copying in new files
# Usage: ./update.sh "your commit message"
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Stop on any error

REPO="/Users/dyarbrough/Documents/booksmith"
COMMIT_MSG="${1:-"BookSmith update"}"

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

step() { echo -e "\n${BLUE}▸ $1${NC}"; }
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

echo -e "\n${BLUE}╔══════════════════════════════╗"
echo -e "║   BookSmith Update Script    ║"
echo -e "╚══════════════════════════════╝${NC}"

# ── Sanity check ─────────────────────────────────────────────────────────────
cd "$REPO" || fail "Could not find $REPO"

if [ ! -f "frontend/package.json" ]; then
  fail "frontend/package.json not found. Are you in the right folder?"
fi

if [ ! -f "backend/server.js" ]; then
  fail "backend/server.js not found. Are you in the right folder?"
fi

# ── 1. Frontend ───────────────────────────────────────────────────────────────
step "Installing frontend dependencies..."
cd frontend
rm -rf node_modules
npm install --silent
ok "Frontend dependencies installed"

step "Building frontend..."
npm run build
ok "Frontend built successfully"
cd ..

# ── 2. Wire frontend into backend ─────────────────────────────────────────────
step "Copying build into backend..."
rm -rf backend/public
cp -r frontend/dist backend/public
ok "Frontend wired into backend"

# ── 3. Backend ────────────────────────────────────────────────────────────────
step "Installing backend dependencies..."
cd backend
npm install --silent
ok "Backend dependencies installed"
cd ..

# ── 4. Git ────────────────────────────────────────────────────────────────────
step "Committing to GitHub..."

if [ -z "$(git status --porcelain)" ]; then
  warn "No changes to commit — everything is already up to date"
else
  git add .
  git commit -m "$COMMIT_MSG"
  git push --set-upstream origin "$(git branch --show-current)" 2>/dev/null || git push
  ok "Pushed to GitHub"
fi

# ── 5. Launch ─────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}╔══════════════════════════════════════╗"
echo -e "║  ✦ BookSmith is ready!               ║"
echo -e "║    http://localhost:3000             ║"
echo -e "║                                      ║"
echo -e "║    Press Ctrl+C to stop              ║"
echo -e "╚══════════════════════════════════════╝${NC}\n"

cd backend && node server.js
