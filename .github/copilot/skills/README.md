# GitHub Copilot 校正スキル集

このディレクトリは GitHub Copilot 用の校正スキルを管理しています。

## 📋 スキル一覧

### 1️⃣ [proofread-japanese.md](proofread-japanese.md)
**日本語表現の校正**
- 誤字脱字チェック
- 文法エラー検出
- 読みやすさ改善
- 敬体・常体の統一

**スコープ:** 日本語表現のみ  
**重要度レベル:** 🔴 重大 / 🟡 警告 / 🔵 提案

---

### 2️⃣ [proofread-terms.md](proofread-terms.md)
**用語統一の確認**
- 表記揺れの検出
- 本プロジェクト用語の統一
- `terminology.yaml` との照合

**スコープ:** 用語統一のみ  
**参照リソース:** `books/ai-small-is-accurate/.proofreading/terminology.yaml`

---

### 3️⃣ [proofread-facts.md](proofread-facts.md)
**ファクトチェック**
- 統計データの出典確認
- 論文引用の検証
- 技術的主張の正確性確認
- 情報の鮮度チェック

**スコープ:** 事実確認のみ（厳密モード）  
**参照リソース:** arXiv、Google Scholar、公式ドキュメント

---

### 4️⃣ [proofread-structure.md](proofread-structure.md)
**章構造とセクション要件の確認**
- 見出しレベルの階層性チェック
- 必須セクション（学習目標、チェックリスト、AI侍道場等）の有無確認
- ファイル名と章番号の一致確認

**スコープ:** 文書構造とセクション要件のみ  
**必須セクション:** 5 種類（学習目標、本文、チェックリスト、AI侍道場、次章橋渡し）

---

### 5️⃣ [proofread-markdown.md](proofread-markdown.md)
**Markdown 記法の正確性確認**
- リスト記号の統一（`-` で統一）
- 強調記号の統一（`**` で統一）
- コードブロック言語指定
- テーブル形式の正確性
- リンク・画像形式の正確性

**スコープ:** Markdown 記法のみ  
**重要度レベル:** 🔴 レンダリングエラー / 🟡 記法不統一 / 🔵 改善案

### 6️⃣ [generate-illustration.md](generate-illustration.md)
**画像生成コード作成**
- AI侍・DJ町娘のキャラクター画像生成スクリプト作成
- 本書の配色ルールに沿った図解生成スクリプト作成
- Gemini API 使用（`google.generativeai`）

**スコープ:** 画像生成用 Python コード作成  
**参照リソース:** `books/ai-small-is-accurate/images/characters.png`

---

## 🎯 使用方法

### PR コメントで実行

GitHub Copilot が PR を監視し、以下のタイミングで自動的に該当スキルを実行：

```
PR 作成時に自動実行：
- [x] proofread-japanese
- [x] proofread-terms
- [x] proofread-facts
- [x] proofread-structure
- [x] proofread-markdown
```

### 手動で特定スキルを実行

PR コメントで以下のように指示：

```markdown
@github-copilot /proofread-japanese
```
### 画像生成コード作成

```markdown
@github-copilot /generate-illustration
```
（または「このシーンの画像生成コードを作って」と依頼）

---

## 📊 スキル分類表

| スキル | 対象 | スコープ粒度 | 実行タイミング |
|--------|------|-------------|--------------|
| japanese | 日本語 | 小（表現のみ） | PR 作成時 |
| terms | 用語 | 小（統一のみ） | PR 作成時 |
| facts | 事実 | 小（ファクトのみ） | PR 作成時 |
| structure | 構造 | 小（セクション要件のみ） | PR 作成時 |
| markdown | 記法 | 小（Markdown のみ） | PR 作成時 |
| generate-illustration | 画像 | 小（コード生成のみ） | 随時（手動）
## 📊 スキル分類表

| スキル | 対象 | スコープ粒度 | 実行タイミング |
|--------|------|-------------|--------------|
| japanese | 日本語 | 小（表現のみ） | PR 作成時 |
| terms | 用語 | 小（統一のみ） | PR 作成時 |
| generate-illustration | generate-illustration | 同じ粒度 |
| facts | 事実 | 小（ファクトのみ） | PR 作成時 |
| structure | 構造 | 小（セクション要件のみ） | PR 作成時 |
| markdown | 記法 | 小（Markdown のみ） | PR 作成時 |

---

## 🔄 Claude Code スキルとの関係

`.claude/skills` で定義されているスキルとの対応：

| GitHub Copilot スキル | Claude Code スキル | 関係 |
|----------------------|------------------|------|
| proofread-japanese | proofread-japanese | 同じ粒度 |
| proofread-terms | proofread-terms | 同じ粒度 |
| proofread-facts | proofread-facts | 同じ粒度 |
| proofread-structure | proofread-structure | 同じ粒度 |
| proofread-markdown | proofread-markdown | 同じ粒度 |

---

## 📝 スキル出力形式の統一

すべてのスキルは以下の形式で PR コメントを出力：

```markdown
## [スキル名] レビュー結果

**対象ファイル**: [ファイル名]  
**スコープ**: [スコープ名]  
**検出した問題**: X件

### 🔴 重大（修正必須）
[問題一覧]

### 🟡 警告（修正推奨）
[警告一覧]

### 🔵 提案（改善案）
[提案一覧]

---

ご対応よろしくお願いします。
```

---

## ✅ チェックリスト（スキル開発時）

新しいスキルを追加する際：

- [ ] スキル定義ファイル (`{name}.md`) を作成
- [ ] 以下のセクションを含む：
  - [ ] Front Matter (name, description, scope, agent, triggers)
  - [ ] 役割説明
  - [ ] 検証対象
  - [ ] 出力形式
  - [ ] 使用例
  - [ ] 注意事項
- [ ] このファイルに追加
- [ ] `.claude/skills` の粒度と合わせる

---

**最終更新**: 2026-01-25  
**対象プロジェクト**: ai-small-is-accurate  
**メンテナー**: GitHub Copilot Integration
