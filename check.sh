#!/bin/bash
# Pre-deploy check for SABI
# Run: bash check.sh
# Must pass before any git push

echo "🔍 Running TypeScript check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then echo "❌ TypeScript failed. Fix before pushing."; exit 1; fi

echo "🏗️ Running build check..."
npx next build --no-lint 2>&1 | tail -5
if [ $? -ne 0 ]; then echo "❌ Build failed. Fix before pushing."; exit 1; fi

echo "✅ All checks passed. Safe to push."
