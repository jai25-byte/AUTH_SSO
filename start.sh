#!/usr/bin/env bash

# Resolve project directory
cd "$(dirname "$0")" || exit 1

echo "=========================================="
echo " 🚀 Starting SSO Authentication Portal"
echo "=========================================="

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
  echo "❌ Error: Bun runtime was not found."
  echo "To install Bun, run:"
  echo "  curl -fsSL https://bun.sh/install | bash"
  exit 1
fi

# Install dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
  echo "📦 Installing project dependencies..."
  bun install
fi

# Automatically open the browser once the server is ready
(
  sleep 1.5
  URL="http://localhost:3000"
  if command -v open &> /dev/null; then
    open "$URL"
  elif command -v xdg-open &> /dev/null; then
    xdg-open "$URL"
  fi
) &

# Run development server
echo "✨ Starting development server at http://localhost:3000 ..."
bun run dev