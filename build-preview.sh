#!/usr/bin/env bash
# ============================================================
# build-preview.sh — FixMate EAS Preview Build Trigger
# ------------------------------------------------------------
# 1. Commits & pushes all changes to GitHub
# 2. Triggers EAS cloud build (Android APK, internal dist)
# 3. You'll get a download link when the build is done
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     FixMate EAS Preview Builder      ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Step 1: Push any changes ──────────────────────────────────
echo "📦 Checking for uncommitted changes..."
if [[ -n $(git status --porcelain) ]]; then
  echo "✏️  Uncommitted changes found. Committing..."
  git add -A
  git commit -m "chore: auto-commit before EAS build [$(date '+%Y-%m-%d %H:%M')]"
  echo "✅ Committed."
else
  echo "✅ Working tree is clean."
fi

echo ""
echo "🚀 Pushing to GitHub (origin/main)..."
git push origin main
echo "✅ Pushed."

# ── Step 2: Trigger EAS cloud build ──────────────────────────
echo ""
echo "🏗️  Starting EAS build (profile: preview, platform: android)..."
echo "   → This builds an APK in Expo's cloud — no local Android SDK needed"
echo "   → You'll get a QR/download link when done (~10–20 min)"
echo ""
eas build --profile preview --platform android --non-interactive

echo ""
echo "✅ Build submitted! Check https://expo.dev to monitor progress."
echo "   Once done, download and install the APK on your Android device."

