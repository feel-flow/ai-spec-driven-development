#!/bin/bash
# Obsidian統合のためのHusky post-mergeフック設定スクリプト

set -e

echo "🔧 Obsidian統合のためのHuskyフックを設定中..."

# .huskyディレクトリが存在することを確認
if [ ! -d ".husky" ]; then
  echo "❌ .huskyディレクトリが見つかりません"
  echo "先にHuskyをセットアップしてください: npx husky install"
  exit 1
fi

# post-mergeフックを作成
cat > .husky/post-merge << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# developブランチへのマージ時のみ実行
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "develop" ]; then
  echo "🔄 Updating knowledge base (Obsidian backlinks)..."
  node scripts/obsidian-sync.mjs backlinks --silent
  
  # 変更があれば自動コミット
  if [ -n "$(git status --porcelain)" ]; then
    git add docs-template/
    git commit -m "docs: Update backlinks [skip ci]"
    echo "✅ Backlinks updated and committed"
  fi
fi
EOF

# 実行権限を付与
chmod +x .husky/post-merge

echo "✅ Husky post-merge hook configured"
echo ""
echo "📝 次のステップ:"
echo "  1. MCPサーバーをビルド: cd mcp && npm install && npm run build"
echo "  2. featureブランチからdevelopへマージすると、自動的にバックリンクが更新されます"
