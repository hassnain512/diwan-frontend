#!/usr/bin/env bash
set -euo pipefail
if grep -RniE "react-native-webview|<WebView" App.tsx src package.json; then
  echo "WebView code/dependency reference found" >&2
  exit 1
fi
npx tsc --noEmit
echo "Source verification passed."
