#!/usr/bin/env bash
# Fresh copy of the demo shop in data/workdir/shop with its own venv (old, vulnerable pins).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DEST="$ROOT/data/workdir/shop"
rm -rf "$DEST" && mkdir -p "$DEST"
rsync -a --exclude .venv --exclude __pycache__ --exclude scripts "$ROOT/demo/shop/" "$DEST/"
cd "$DEST" && git init -q && git -c user.name=agent -c user.email=agent@example.com add -A && git -c user.name=agent -c user.email=agent@example.com commit -q -m base && uv venv -q && uv pip install -q -r requirements.txt
echo "ready: $DEST"
