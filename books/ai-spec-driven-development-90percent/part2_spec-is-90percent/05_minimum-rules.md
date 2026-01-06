# 第5章　「7文書」を回すための最低限のルール

## この章で学ぶこと

- Frontmatterでメタデータを統一する方法
- 変更時のバージョン更新・Changelog運用
- コミット前の検証チェックの仕組み

---

## Frontmatterでメタデータを揃える

### なぜメタデータが必要か

7文書が増えてくると、こんな問題が起きます。

- 「この文書、いつ更新されたっけ？」
- 「誰がこれを書いたの？」
- 「このドラフト、もう確定してる？」

これらの疑問に答えるために、**各文書の先頭にメタデータを記述**します。

### Frontmatter形式

YAML形式のFrontmatterを使います。

```yaml
---
title: ARCHITECTURE.md
version: 1.2.0
status: approved
owner: "@tech-lead"
created: 2026-01-01
updated: 2024-03-15
reviewers:
  - "@senior-dev"
  - "@security-team"
---

# ARCHITECTURE.md

（本文）
```

### 必須フィールド

| フィールド | 説明 | 例 |
|-----------|------|-----|
| title | 文書タイトル | ARCHITECTURE.md |
| version | セマンティックバージョン | 1.2.0 |
| status | 文書の状態 | draft / review / approved |
| owner | 責任者 | @username |
| created | 作成日 | 2026-01-01 |
| updated | 最終更新日 | 2024-03-15 |

### オプションフィールド

| フィールド | 説明 | 用途 |
|-----------|------|------|
| reviewers | レビュワー一覧 | 承認フロー管理 |
| tags | タグ | 検索・分類 |
| related | 関連文書 | 相互参照 |
| changeImpact | 最新変更の影響度 | LOW / MEDIUM / HIGH |

### statusの運用

文書のライフサイクルを3段階で管理します。

```
draft → review → approved
  ↑__________________|
     （修正が必要な場合）
```

| status | 意味 | AIへの扱い |
|--------|------|-----------|
| draft | 作成中・未確定 | 参考情報として扱う |
| review | レビュー中 | ほぼ確定だが変更の可能性あり |
| approved | 承認済み | 正式な仕様として遵守 |

---

## 変更時のワークフロー：影響度評価→バージョン更新→Changelog

### 変更の3ステップ

文書を変更するときは、以下の3ステップを踏みます。

```
1. 影響度評価（changeImpact）
   ↓
2. バージョン更新
   ↓
3. Changelog記録
```

### ステップ1：影響度評価

変更内容を以下の基準で評価します。

| 影響度 | 基準 | バージョン更新 |
|--------|------|--------------|
| LOW | 誤字修正、文言調整 | パッチ（0.0.x） |
| MEDIUM | 項目追加、既存拡張 | マイナー（0.x.0） |
| HIGH | 構造変更、概念再定義 | メジャー（x.0.0） |

### ステップ2：バージョン更新

Frontmatterのversionを更新し、updatedを現在日付に変更します。

```yaml
---
# Before
version: 1.2.0
updated: 2024-03-01

# After（MEDIUM変更の場合）
version: 1.3.0
updated: 2024-03-15
changeImpact: MEDIUM
---
```

### ステップ3：Changelog記録

各文書の末尾、またはプロジェクトルートのCHANGELOG.mdに記録します。

```markdown
## Changelog

### [1.3.0] - 2024-03-15
#### 追加
- ユーザー認証フローにMFA対応を追加

#### 変更
- セッションタイムアウトを30分→60分に変更

### [1.2.0] - 2024-03-01
#### 追加
- リフレッシュトークンの仕様を追加
```

### HIGH変更のときの追加手順

影響度がHIGHの場合、追加で以下を実施します。

1. **関連文書の洗い出し**

   ```markdown
   ## HIGH変更チェックリスト
   - [ ] PROJECT.md：要件への影響確認
   - [ ] DOMAIN.md：ビジネスルールへの影響確認
   - [ ] TESTING.md：テストケースの更新
   - [ ] DEPLOYMENT.md：運用手順への影響確認
   ```

2. **レビュワーへの通知**
   - PRに「HIGH変更」ラベルを付与
   - 関連チームメンバーをレビュワーに追加

3. **ADR（Architecture Decision Record）の作成**
   - なぜこの変更が必要か
   - 代替案とその却下理由
   - 移行計画

---

## コミット前に検証チェック

### なぜ検証が必要か

文書が増えると、以下の問題が発生しやすくなります。

- リンク切れ
- 用語の不統一
- 構造の不整合（見出しレベルがおかしい）
- Frontmatterの記述漏れ

これらを**コミット前に自動チェック**します。

### 検証チェックの種類

| チェック種類 | 内容 | ツール例 |
|-------------|------|---------|
| 構造検証 | Frontmatter必須項目、見出し構造 | カスタムスクリプト |
| リンク検証 | 内部リンクの存在確認 | markdown-link-check |
| 用語検証 | 用語集との整合性 | textlint |
| 整合性検証 | 文書間の参照整合性 | カスタムスクリプト |

### pre-commitフックの設定

```bash
#!/bin/bash
# .husky/pre-commit

echo "📋 文書検証チェックを実行中..."

# Frontmatter検証
node scripts/validate-frontmatter.js docs/*.md
if [ $? -ne 0 ]; then
  echo "❌ Frontmatter検証に失敗しました"
  exit 1
fi

# リンク検証
npx markdown-link-check docs/*.md
if [ $? -ne 0 ]; then
  echo "❌ リンク検証に失敗しました"
  exit 1
fi

# 用語検証
npx textlint docs/*.md
if [ $? -ne 0 ]; then
  echo "❌ 用語検証に失敗しました"
  exit 1
fi

echo "✅ 全ての検証チェックに合格しました"
```

### Frontmatter検証スクリプト例

```javascript
// scripts/validate-frontmatter.js
const fs = require('fs');
const matter = require('gray-matter');

const requiredFields = ['title', 'version', 'status', 'owner', 'created', 'updated'];
const validStatuses = ['draft', 'review', 'approved'];

function validateFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(content);

  const errors = [];

  // 必須フィールドチェック
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // statusの値チェック
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`Invalid status: ${data.status}`);
  }

  // versionの形式チェック
  if (data.version && !/^\d+\.\d+\.\d+$/.test(data.version)) {
    errors.push(`Invalid version format: ${data.version}`);
  }

  return errors;
}
```

### Claude CodeによるAIレビュー

pre-commitでAIレビューを追加することもできます。

```bash
# .husky/pre-commit（追加部分）

# AIレビュー（変更されたファイルのみ）
CHANGED_DOCS=$(git diff --cached --name-only --diff-filter=ACMR | grep '\.md$')

if [ -n "$CHANGED_DOCS" ]; then
  echo "🤖 AIレビューを実行中..."
  claude-code review $CHANGED_DOCS --rules .review-rules.md
fi
```

`.review-rules.md`にレビュー観点を記述します。

```markdown
# 文書レビュールール

## 必須チェック項目
- [ ] Frontmatterが正しく記述されているか
- [ ] 用語が用語集と一致しているか
- [ ] 内部リンクが有効か
- [ ] コードブロックに言語指定があるか

## 推奨チェック項目
- [ ] 文が長すぎないか（100文字目安）
- [ ] 受動態より能動態を使っているか
- [ ] 具体例が含まれているか
```

---

## 章末チェックリスト

- [ ] 7文書すべてにFrontmatterを追加する
- [ ] status（draft/review/approved）の運用ルールをチームで合意する
- [ ] 変更時の3ステップ（影響度→バージョン→Changelog）を手順化する
- [ ] pre-commitフックで最低限の検証（Frontmatter、リンク）を設定する

---

## 次章への橋渡し

この章では、7文書を運用するための最低限のルールを学びました。

次章からは**第3部「実践ワークフロー」**に入ります。7文書をどのように導入し、日々の開発でどのように活用するか、具体的な手順を解説します。
