#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install npm dependencies (npm install, not ci, so the cached container state is reused)
npm install --no-audit --no-fund
