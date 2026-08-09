#!/usr/bin/env bash
# Deploy the committed local main to the Vignet server.
#
# WHY THIS DIFFERS FROM IGNET'S scripts/deploy.sh
# -----------------------------------------------
# Ignet TRACKS dist-react/, so its server deploy is just `git reset --hard` and
# the built assets arrive with the source. Vignet GITIGNORES dist-react/, so a
# source-only reset deploys nothing user-visible.
#
# PROJECT_HANDOFF.md recommended "rebuild on the server" from 2026-06-16 until
# 2026-08-06. That procedure cannot be executed: the server has NO node and NO
# npm, in any shell, in any common install path (verified 2026-08-06 over SSH,
# both non-interactive and `bash -lc` login shells). The stale
# frontend/node_modules/ there is a leftover dated 2026-03-25.
#
# The path that has actually been working is: BUILD LOCALLY, RSYNC dist-react/.
# The 2026-07-20 assets on the server were placed that way. This script encodes
# that real path rather than the documented-but-impossible one.
#
# Usage:
#   scripts/deploy.sh --check    # read-only: verify preconditions, report drift
#   scripts/deploy.sh            # build -> push -> align source -> rsync -> verify
#   scripts/deploy.sh --prune    # same, but delete server assets not in this build
set -euo pipefail

SERVER="juhur@134.129.255.147"
SERVER_DIR="/data/var/www/html/vignet"
BRANCH="main"
LIVE_URL="https://ignet.org/vignet/"
NODE_VERSION="24.14.1"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# RUN THIS ON YOUR WORKSTATION, NOT ON THE SERVER.
#
# This script is committed, so a copy lands at $SERVER_DIR/scripts/deploy.sh
# whenever the server resets to origin/main. Running it there is the natural
# mistake -- "deploy on the deployment host" -- but it cannot work: step one is
# a Vite build and the server has no node. Worse, it would try to rsync the
# server's own dist-react/ onto itself over SSH. Refuse early and say why,
# rather than failing later with a confusing node error.
if [[ "$(hostname)" == hurlabvm1-med* ]] || [[ "$REPO_ROOT" == "$SERVER_DIR" ]]; then
  cat >&2 <<MSG
ERROR: this is the deployment TARGET, not where deploys are driven from.

  deploy.sh runs on your workstation and reaches this server over SSH:
  build locally -> push -> align server source -> rsync dist-react/ -> verify.

  The build cannot happen here: this server has no node and no npm.
  (frontend/node_modules/ here is a stale leftover from 2026-03-25.)

  Run instead, on the workstation:
      cd ~/PROJECTS/10_apps/Vignet && ./scripts/deploy.sh
MSG
  exit 1
fi

MODE="${1:-deploy}"

# The system node on this workstation is v18, which Vite rejects outright
# ("CustomEvent is not defined"). Load nvm so the build uses a supported node.
use_node() {
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    # shellcheck disable=SC1091
    . "$HOME/.nvm/nvm.sh"
    nvm use "$NODE_VERSION" >/dev/null 2>&1 || {
      echo "ERROR: nvm has no $NODE_VERSION. Run: nvm install $NODE_VERSION" >&2
      exit 1
    }
  fi
  local v
  v="$(node -v 2>/dev/null || echo none)"
  case "$v" in
    v2[0-9].*|v[3-9][0-9].*) : ;;
    *) echo "ERROR: node $v is too old for Vite (need >=20). nvm not loaded?" >&2; exit 1 ;;
  esac
  echo "==> node $v"
}

live_bundle() {
  curl -fsS --max-time 20 "$LIVE_URL" | grep -o 'index-[A-Za-z0-9_-]*\.js' | head -1
}

local_bundle() {
  grep -o 'index-[A-Za-z0-9_-]*\.js' dist-react/index.html | head -1
}

# ---------------------------------------------------------------- check mode
if [[ "$MODE" == "--check" ]]; then
  echo "==> Read-only check (nothing will be pushed, copied or changed)"
  use_node
  echo "==> Branch: $(git rev-parse --abbrev-ref HEAD) (expect $BRANCH)"
  git diff --quiet && git diff --cached --quiet \
    && echo "==> Tree: clean" || echo "!! Tree: DIRTY (deploy would refuse)"
  git fetch origin "$BRANCH" -q
  echo "==> vs origin (origin-ahead / local-ahead): $(git rev-list --count --left-right "origin/$BRANCH...HEAD")"
  echo "==> Server toolchain:"
  ssh -o ConnectTimeout=20 -o BatchMode=yes "$SERVER" \
    'echo "     node: $(command -v node || echo MISSING) | server HEAD: $(cd '"$SERVER_DIR"' && git rev-parse --short HEAD)"'
  echo "==> Live bundle:  $(live_bundle)"
  echo "==> Local bundle: $(local_bundle 2>/dev/null || echo '(no local build yet)')"
  exit 0
fi

PRUNE=""
# --delete-after, not --delete: plain --delete removes stale files *during* the
# transfer, so there is a window where an old chunk is gone and its replacement
# is not up yet. --delete-after uploads everything first and prunes at the end,
# leaving the old assets servable for the whole transfer.
[[ "$MODE" == "--prune" ]] && PRUNE="--delete-after"

# --------------------------------------------------------------- safety gates
BR="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BR" != "$BRANCH" ]]; then
  echo "ERROR: on branch '$BR', expected '$BRANCH'." >&2
  exit 1
fi

# dist-react/ is gitignored, so a dirty tree here means dirty SOURCE — which the
# server reset would silently skip while the rsync shipped a build made from it.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: uncommitted source changes. Commit before deploying." >&2
  git status --short >&2
  exit 1
fi

use_node

echo "==> Building frontend"
(cd frontend && npm run build)

echo "==> Pushing $BRANCH to origin"
git push origin "$BRANCH"

echo "==> Aligning server source ($SERVER_DIR)"
SERVER_HEAD="$(ssh -o ConnectTimeout=20 "$SERVER" \
  "cd '$SERVER_DIR' && git fetch origin -q && git reset --hard origin/$BRANCH -q && git rev-parse --short HEAD")"
LOCAL_HEAD="$(git rev-parse --short HEAD)"
if [[ "$SERVER_HEAD" != "$LOCAL_HEAD" ]]; then
  echo "ERROR: server HEAD ($SERVER_HEAD) != local HEAD ($LOCAL_HEAD)." >&2
  exit 1
fi
echo "==> Source 3-way aligned at $LOCAL_HEAD"

# Default is NO --delete: a browser that loaded the old index.html is still
# lazy-loading its old chunks. Keeping them avoids breaking in-flight sessions.
# The cost is that stale chunks accumulate -- run --prune occasionally when no
# one is mid-session.
echo "==> Syncing dist-react/ ${PRUNE:+(pruning stale assets)}"
rsync -az --checksum $PRUNE dist-react/ "$SERVER:$SERVER_DIR/dist-react/"

echo "==> Verifying the live site actually changed"
sleep 2
LIVE="$(live_bundle)"
WANT="$(local_bundle)"
echo "    live:  $LIVE"
echo "    built: $WANT"
if [[ "$LIVE" != "$WANT" ]]; then
  echo "!! MISMATCH: the live entry bundle is not the one just built." >&2
  echo "   Check Apache caching, the rsync target path, or a CDN in front." >&2
  exit 1
fi
echo "==> Deployed and verified: $LIVE is live at $LIVE_URL"
