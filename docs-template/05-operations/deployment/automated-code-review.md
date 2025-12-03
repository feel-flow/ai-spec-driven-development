# 自動コードレビュー（Claude Code + Husky）

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md) | **Related**: [self-review.md](./self-review.md), [git-workflow.md](./git-workflow.md)

## 概要

Claude Code と Husky を組み合わせた自動コードレビューシステムです。
`git commit` 時に AI が自動でコードをレビューし、問題があればコミットをブロックします。

### システム構成

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   git commit    │────▶│  Husky Hook      │────▶│  Claude Code    │
│                 │     │  (pre-commit)    │     │  Review         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                              ┌─────────────────────┐
                                              │ APPROVED: コミット続行 │
                                              │ REJECTED: コミット停止 │
                                              └─────────────────────┘
```

### 主な機能

| 機能 | 説明 |
|------|------|
| 自動レビュー | `git commit` 時に自動でコードレビューを実行 |
| 優先度分類 | Critical / Important / Quality の3段階で問題を分類 |
| ブロック機能 | Criticalな問題があればコミットをブロック |
| スラッシュコマンド | `/code-review` で手動レビューも可能 |
| スキップ機能 | 緊急時は `--no-verify` でスキップ可能 |

---

## クイックセットアップ

### 前提条件

- **Git**: 任意のバージョン
- **Node.js**: >= 18.0.0（npm使用時）
- **Claude Code CLI**: インストール済み

### 自動セットアップ（推奨）

プロジェクトルートで以下を実行:

```bash
# スクリプトをダウンロード
curl -sLO https://raw.githubusercontent.com/OWNER/REPO/main/scripts/setup-automated-review.sh

# スクリプトの内容を確認（推奨）
less setup-automated-review.sh

# 確認後、実行
bash setup-automated-review.sh

# または、リポジトリにスクリプトがある場合
bash scripts/setup-automated-review.sh
```

### 手動セットアップ

npm/Node.jsを使用しない場合や、カスタマイズが必要な場合:

```bash
# 1. ディレクトリ作成
mkdir -p .husky scripts .claude/commands

# 2. スクリプトを手動で配置（後述のファイル内容を参照）

# 3. 実行権限を付与
chmod +x .husky/pre-commit scripts/claude-review.sh
```

---

## ファイル構成

セットアップ後、以下のファイルが作成されます:

```
project-root/
├── .husky/
│   └── pre-commit              # Git pre-commit hook
├── scripts/
│   └── claude-review.sh        # レビュースクリプト
├── .claude/
│   └── commands/
│       └── code-review.md      # スラッシュコマンド定義
└── package.json                # npm scripts（オプション）
```

---

## 使い方

### 自動レビュー（通常のコミット）

```bash
git add .
git commit -m "feat: 新機能を追加"
# → Claude Codeが自動でレビューを実行
# → 問題がなければコミット完了
# → 問題があればコミットをブロック
```

### 手動レビュー

```bash
# Claude Code内でスラッシュコマンドを使用
/code-review

# または npm script（セットアップ済みの場合）
npm run code-review
```

### レビューのスキップ

緊急時やレビュー不要な変更の場合:

```bash
# --no-verify オプションでスキップ
git commit --no-verify -m "chore: 設定ファイルの更新"

# または環境変数でスキップ
SKIP_CLAUDE_REVIEW=1 git commit -m "chore: 設定ファイルの更新"
```

---

## レビュー基準

### Critical（コミットをブロック）

以下の問題が検出された場合、コミットはブロックされます:

- **セキュリティ脆弱性**: SQLインジェクション、XSS、ハードコードされた認証情報
- **構文/型エラー**: コンパイル不可能なコード
- **ロジックバグ**: null参照、無限ループ、off-by-oneエラー
- **リソースリーク**: クローズされないコネクション、メモリリーク

### Important（警告するがコミット許可）

- 不適切なエラーハンドリング
- 未使用のインポート/変数
- 入力値検証の不足
- 破壊的なAPI変更

### Quality（改善提案）

- マジックナンバー（定数化を推奨）
- 命名規則の違反
- コードの重複
- 複雑なロジックへのドキュメント不足

---

## レビュー出力例

```markdown
## Review Summary
**Files reviewed**: 3
**Total changes**: +127 / -23

## Critical Issues
None found

## Important Issues
- src/api/user.ts:45 - Missing error handling for database query

## Suggestions
- src/utils/format.ts:12 - Magic number 86400 should be a named constant (SECONDS_PER_DAY)
- src/components/Button.tsx:8 - Consider extracting repeated style logic

## Verdict: APPROVED
**Reason**: No critical issues found. One important issue noted for follow-up.
```

---

## カスタマイズ

### プロジェクト固有のルール追加

`.claude/commands/code-review.md` を編集してプロジェクト固有のルールを追加:

```markdown
## Project-Specific Rules

### Frontend (React)
- TypeScript strict mode必須
- styled-componentsの命名規則に従う
- アクセシビリティ属性を確認

### Backend (Node.js)
- 全てのDB操作はトランザクション内で実行
- ログ出力は構造化ログ形式
- 環境変数の直接参照禁止（設定クラス経由）
```

### レビュー厳格度の調整

`scripts/claude-review.sh` の判定ロジックを変更:

```bash
# 厳格モード: Important Issues でもブロック
if grep -qEi "REJECTED|Important Issues" "$REVIEW_RESULT"; then
    exit 1
fi

# 緩和モード: Critical Issues のみブロック
if grep -qEi "REJECTED" "$REVIEW_RESULT" && grep -qEi "Critical Issues" "$REVIEW_RESULT"; then
    exit 1
fi
```

### 特定ファイルの除外

`.husky/pre-commit` に追加:

```bash
# 自動生成ファイルはスキップ
STAGED_FILES=$(git diff --cached --name-only)
if echo "$STAGED_FILES" | grep -qE "^(package-lock\.json|yarn\.lock|.*\.generated\..*)$"; then
    echo "Only auto-generated files staged - skipping review"
    exit 0
fi
```

---

## トラブルシューティング

### "claude: command not found"

```bash
# Claude CLIの確認
which claude

# パスの確認
echo $PATH

# シェル設定の再読み込み
source ~/.zshrc  # または ~/.bashrc
```

### Hookが実行されない

```bash
# Huskyの再インストール
rm -rf .husky
npm install
npx husky init

# 手動でhookを再作成
# （上記のセットアップスクリプトを再実行）
```

### レビューが遅い

- 大きな差分は複数のコミットに分割
- 不要なファイルを `.gitignore` に追加
- `--no-verify` で一時的にスキップ

### 誤検出が多い

1. `.claude/commands/code-review.md` のルールを調整
2. プロジェクト固有の許可パターンを追加
3. Issue で報告してルールを改善

---

## コマンドリファレンス

| コマンド | 説明 |
|----------|------|
| `git commit` | 自動レビュー実行 |
| `/code-review` | Claude Code内で手動レビュー |
| `npm run code-review` | npm経由で手動レビュー |
| `git commit --no-verify` | レビューをスキップ |
| `SKIP_CLAUDE_REVIEW=1 git commit` | 環境変数でスキップ |

---

## セルフレビューとの関係

この自動レビューは [セルフレビュー](./self-review.md) を補完するものです:

| 観点 | セルフレビュー | 自動レビュー |
|------|----------------|--------------|
| 実行タイミング | PR作成前（任意） | コミット時（自動） |
| 範囲 | 包括的（設計、テスト含む） | コード変更のみ |
| 深さ | 詳細（15-30分） | 高速（数十秒） |
| 目的 | 品質保証の証跡作成 | 明らかな問題の早期検出 |

**推奨フロー**:
1. 開発中 → 自動レビューで継続的にチェック
2. PR作成前 → セルフレビューで包括的に確認
3. PR作成後 → チームレビューで最終確認

---

## 参考リンク

- [Claude Code 公式](https://claude.ai/code)
- [Husky 公式](https://typicode.github.io/husky/)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
