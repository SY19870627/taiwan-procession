#!/usr/bin/env bash
# 建置後把 dist/ 推到 gh-pages 分支（GitHub Pages 從這個分支發佈）
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
remote=$(git remote get-url origin)
rev=$(git rev-parse --short HEAD)
tmp=$(mktemp -d)
cp -r dist/. "$tmp"
touch "$tmp/.nojekyll"
cd "$tmp"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$OLDPWD" config user.name || echo deploy)" -c user.email="$(git -C "$OLDPWD" config user.email || echo deploy@local)" commit -q -m "部署 $rev"
git push -q -f "$remote" gh-pages
echo "已部署 $rev 到 gh-pages"
