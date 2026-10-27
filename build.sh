#!/usr/bin/env bash
set -euo pipefail

# Usage: ./build.sh [chrome|firefox|all]
# Produces store-ready zips under build/.

BROWSER="${1:-all}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/code"
OUT="$ROOT/build"

VERSION="$(grep -o '"version": *"[^"]*"' "$SRC/manifest.json" | cut -d'"' -f4)"

build() {
  local browser="$1"
  local dir="$OUT/$browser"
  local zip="$OUT/autoskippy-$browser-$VERSION.zip"

  rm -rf "$dir"
  mkdir -p "$dir"
  rsync -a --exclude ".DS_Store" "$SRC/" "$dir/"

  if [ "$browser" = "chrome" ]; then
    mv "$dir/manifest.chrome.json" "$dir/manifest.json"
  else
    rm "$dir/manifest.chrome.json"
  fi

  rm -f "$zip"
  (cd "$dir" && zip -qr "$zip" .)
  echo "Built $zip"
}

case "$BROWSER" in
  chrome) build chrome ;;
  firefox) build firefox ;;
  all) build chrome; build firefox ;;
  *) echo "Usage: $0 [chrome|firefox|all]" >&2; exit 1 ;;
esac
