#!/usr/bin/env bash
# ============================================================
# dev-start.sh — FixMate Development Workflow
# ------------------------------------------------------------
# 1. Commits & pushes any pending changes to GitHub
# 2. Starts Expo dev server (tunnel mode — phone connects
#    to your dev client APK and gets live JS updates)
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   FixMate Dev Server (Live Reload)   ║"
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
echo "╔══════════════════════════════════════════════════════╗"
echo "║  📱 HOW TO GET LIVE CHANGES ON YOUR PHONE           ║"
echo "║                                                      ║"
echo "║  1. Make sure the FixMate dev APK is installed       ║"
echo "║     (from expo.dev build or QR from build email)    ║"
echo "║  2. Open the FixMate dev app on your phone           ║"
echo "║  3. Scan the QR code below OR enter the URL shown   ║"
echo "║  4. Every JS change you save = instantly on phone ⚡  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
ELECTRON_DISABLE_SANDBOX=1 npx expo start --tunnel
