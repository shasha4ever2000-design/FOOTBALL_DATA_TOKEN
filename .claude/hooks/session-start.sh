#!/bin/bash
# Reinstalls Agent Reach (https://github.com/Panniantong/Agent-Reach) in
# Claude Code on the web containers. Everything lives outside the repo, per
# Agent Reach's install guide.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

SRC="$HOME/.agent-reach/tools/agent-reach-src"
VENV="$HOME/.agent-reach-venv"

# GitHub's archive zip is blocked by the web proxy, so install from a clone.
if [ -d "$SRC/.git" ]; then
  git -C "$SRC" pull --ff-only -q || true
else
  mkdir -p "$(dirname "$SRC")"
  git clone -q --depth 1 https://github.com/Panniantong/Agent-Reach.git "$SRC"
fi

[ -x "$VENV/bin/python" ] || python3 -m venv "$VENV"
"$VENV/bin/pip" install -q --disable-pip-version-check "$SRC" "yt-dlp[default]"

export PATH="$VENV/bin:$PATH"

# Installs gh, mcporter + Exa, and the agent-reach skill. Skip if already done.
if ! command -v gh >/dev/null || ! command -v mcporter >/dev/null \
   || [ ! -f "$HOME/.claude/skills/agent-reach/SKILL.md" ]; then
  agent-reach install --env=auto --system >/dev/null 2>&1 || true
fi

# yt-dlp needs a JS runtime for YouTube.
mkdir -p "$HOME/.config/yt-dlp"
grep -qxF -- '--js-runtimes node' "$HOME/.config/yt-dlp/config" 2>/dev/null \
  || printf '%s\n' '--js-runtimes node' >> "$HOME/.config/yt-dlp/config"

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"$VENV/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi
