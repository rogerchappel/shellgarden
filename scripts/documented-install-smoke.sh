#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

SOURCE_DIR="$TMP_DIR/shellgarden"
PREFIX_DIR="$TMP_DIR/prefix"

mkdir "$SOURCE_DIR"
git -C "$ROOT_DIR" archive HEAD | tar -x -C "$SOURCE_DIR"

cd "$SOURCE_DIR"
npm ci >/dev/null
npm run build >/dev/null
npm install --global --prefix "$PREFIX_DIR" . >/dev/null

export PATH="$PREFIX_DIR/bin:$PATH"
shellgarden --help >/dev/null
shellgarden init "$TMP_DIR/garden" >/dev/null
shellgarden check "$TMP_DIR/garden" --update >/dev/null
shellgarden check "$TMP_DIR/garden" >/dev/null
