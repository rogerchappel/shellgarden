#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cd "$ROOT_DIR"
npm run build >/dev/null
npm pack --pack-destination "$TMP_DIR" >/dev/null
PACKAGE_TGZ="$(find "$TMP_DIR" -maxdepth 1 -name 'shellgarden-*.tgz' -print -quit)"
test -n "$PACKAGE_TGZ"

mkdir -p "$TMP_DIR/app"
cd "$TMP_DIR/app"
npm init -y >/dev/null
npm install "$PACKAGE_TGZ" >/dev/null

node --input-type=module --eval "
  const api = await import('shellgarden');
  const expected = ['explainGarden', 'listGarden', 'renderTranscript', 'runGarden'];
  if (JSON.stringify(Object.keys(api).sort()) !== JSON.stringify(expected)) {
    throw new Error('unexpected public exports');
  }
  if (process.exitCode !== undefined) {
    throw new Error('public import changed process.exitCode');
  }
" > "$TMP_DIR/import.stdout" 2> "$TMP_DIR/import.stderr"
test ! -s "$TMP_DIR/import.stdout"
test ! -s "$TMP_DIR/import.stderr"

npx shellgarden --help >/dev/null
mkdir garden
npx shellgarden init garden >/dev/null
npx shellgarden check garden --format text >/dev/null
npx shellgarden report garden --format json > "$TMP_DIR/report.json"
grep -q '"ok": true' "$TMP_DIR/report.json"
grep -q '"code": "missing-transcript"' "$TMP_DIR/report.json"
