#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install npm dependencies exactly as locked. `npm ci` never rewrites
# package-lock.json (`npm install` did, leaving an uncommitted diff on every
# session start), and it matches what CI and Vercel install.
npm ci --no-audit --no-fund
