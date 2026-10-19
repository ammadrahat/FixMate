#!/usr/bin/env bash
# ============================================================
# dev-start.sh — FixMate Development Workflow
# ------------------------------------------------------------
# 1. Commits & pushes any pending changes to GitHub
# 2. Starts Expo Go dev server (tunnel mode for phone access)
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     FixMate Dev Server Launcher      ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Step 1: Push any changes ──────────────────────────────────
echo "📦 Checking for uncommitted changes..."
if [[ -n $(git status --porcelain) ]]; then
  echo "✏️  Uncommitted changes found. Committing..."
  git add -A
  git commit -m "chore: auto-commit before dev session [$(date '+%Y-%m-%d %H:%M')]"
  echo "✅ Committed."
else
  echo "✅ Working tree is clean."
fi

echo ""
echo "🚀 Pushing to GitHub (origin/main)..."
git push origin main
echo "✅ Pushed."

# ── Step 2: Start Expo dev server ─────────────────────────────
echo ""
echo "📱 Starting Expo Go dev server (tunnel mode)..."
echo "   → Scan the QR code with Expo Go on your phone"
echo "   → Press 'a' for Android emulator, 'i' for iOS simulator"
echo ""
ELECTRON_DISABLE_SANDBOX=1 npx expo start --tunnel

