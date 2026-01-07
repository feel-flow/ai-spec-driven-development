# Devin Pre-PR Review System

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md) | **Workflow Step**: 4 (Self-Review) | **Related**: [セルフレビュー](./self-review.md)

## 概要

Devinの全タスクにおいて、PR作成前に自動で複数の専門エージェントによるレビューを実行し、問題が見つかった場合は自動修復を行うシステムです。

### 特徴

- **5つの専門エージェント**: Security, Performance, Testing, Documentation, Business Logic
- **並列実行**: 全エージェントが同時にレビューを実行（高速化）
- **自動修復ループ**: 問題が見つかった場合、自動修復を試み、再レビューを繰り返す
- **LLM駆動**: OpenAI GPT-4o または Anthropic Claude 3.5 Sonnet を使用

---

## セットアップ

### 1. 必要な環境変数

```bash
# OpenAI APIキー（推奨）
export OPENAI_API_KEY="sk-..."

# または Anthropic APIキー（フォールバック）
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 2. 依存パッケージのインストール

```bash
pip install openai anthropic
```

### 3. スクリプトの配置

ai-spec-driven-developmentリポジトリから以下のファイルをコピー：

```bash
# スクリプトをプロジェクトにコピー
cp scripts/devin-pre-pr-review.py your-project/scripts/
cp scripts/devin-pre-pr-review.sh your-project/scripts/

# 実行権限を付与
chmod +x your-project/scripts/devin-pre-pr-review.sh
```

---

## 使用方法

### 基本的な使用

```bash
# Git変更ファイルを自動検出してレビュー
./scripts/devin-pre-pr-review.sh

# 自動修復を有効にしてレビュー
./scripts/devin-pre-pr-review.sh --auto-fix

# 最大反復回数を指定（デフォルト: 5）
./scripts/devin-pre-pr-review.sh --auto-fix --max-iterations 10

# 特定のファイルをレビュー
./scripts/devin-pre-pr-review.sh --files src/main.py src/utils.py
```

### Devinワークフローへの統合

**PR作成前に必ず実行**:

```bash
# 1. コード変更を完了
git add .

# 2. Pre-PRレビューを実行（自動修復あり）
./scripts/devin-pre-pr-review.sh --auto-fix

# 3. レビューがパスしたらPR作成
git commit -m "feat: implement feature X"
git push origin feature/xxx
gh pr create --title "feat: implement feature X" --body "..."
```

---

## 5つの専門エージェント

### 1. Security Agent

セキュリティ脆弱性を検出：

- SQLインジェクション
- XSS（クロスサイトスクリプティング）
- CSRF（クロスサイトリクエストフォージェリ）
- 認証・認可の脆弱性
- 機密情報の露出（APIキー、パスワードのハードコード等）
- 安全でない暗号化（MD5、SHA1等）
- パストラバーサル
- コマンドインジェクション

### 2. Performance Agent

パフォーマンス問題を検出：

- N+1クエリ問題
- 不要なループ処理
- メモリリーク
- 非効率なアルゴリズム（O(n^2)以上の計算量）
- 不要な再レンダリング（React等）
- 大きなバンドルサイズ
- 同期処理のブロッキング
- キャッシュの未使用

### 3. Testing Agent

テスト品質を検出：

- テストカバレッジの不足
- エッジケースのテスト漏れ
- エラーハンドリングのテスト漏れ
- モックの不適切な使用
- テストの可読性
- テストの独立性
- アサーションの品質

### 4. Documentation Agent

ドキュメント品質を検出：

- 関数・クラスのdocstringの不足
- 複雑なロジックへのコメント不足
- 型ヒントの不足（Python）/ 型定義の不足（TypeScript）
- README更新の必要性
- API仕様書の更新必要性
- 変数名・関数名の明確さ

### 5. Business Logic Agent

ビジネスロジックの問題を検出：

- マジックナンバー・ハードコードされた値
- DRY原則違反（重複コード）
- 単一責任原則違反
- エラーハンドリングの不備
- 境界値チェックの不足
- 状態管理の問題
- 命名規則違反

---

## 出力例

```
==========================================
Devin Pre-PR Review System
==========================================
Using LLM: openai
Files to review: ['src/main.py', 'src/utils.py']

--- Iteration 1/5 ---

============================================================
Review Results for: src/main.py
============================================================
Total Issues: 3
Fixed Issues: 0
Time Elapsed: 12.34s
Status: NEEDS ATTENTION

--- SECURITY ---
  [HIGH] SQL Injection Risk
    Line: 45
    String interpolation in SQL query detected.
    Recommendation: Use parameterized queries instead.
    Auto-fix: Available

--- BUSINESS_LOGIC ---
  [MEDIUM] Magic Number Detected
    Line: 23
    Hardcoded value '3600' found.
    Recommendation: Extract to named constant with unit comment.
    Auto-fix: Available

Applied 2 fixes. Re-reviewing...

--- Iteration 2/5 ---
All checks passed!

============================================================
SUMMARY
============================================================
Files Reviewed: 2
Total Issues: 3
Total Fixed: 2
Overall Status: PASSED

==========================================
Review PASSED - Ready to create PR
==========================================
```

---

## 自動修復の仕組み

### 修復ループ

```
1. 全エージェントが並列でレビュー実行
2. CRITICAL/HIGH の問題があるか確認
3. 自動修復可能な問題を収集
4. 修復を適用
5. 再レビュー（最大N回繰り返し）
6. 全パスまたは最大回数到達で終了
```

### 修復可能な問題の例

| 問題タイプ | 自動修復 | 例 |
|-----------|---------|-----|
| SQLインジェクション | 可能 | f-string → パラメータ化クエリ |
| マジックナンバー | 可能 | 数値 → 名前付き定数 |
| 弱いハッシュ | 可能 | MD5 → bcrypt |
| 未使用import | 可能 | 削除 |
| docstring不足 | 可能 | 自動生成 |

---

## Devin向け統合ガイド

### 推奨ワークフロー

Devinの全タスクで以下のワークフローを適用：

```
1. Issue確認 → Branch作成
2. コード実装
3. Lint/Type Check実行
4. **Pre-PR Review実行** ← ここで本システムを使用
5. レビューパスまで自動修復
6. PR作成
7. CI待機
8. マージ
```

### Devinへの指示例

```
PR作成前に必ず以下のコマンドを実行してください：

./scripts/devin-pre-pr-review.sh --auto-fix

このコマンドは5つの専門エージェント（Security, Performance, Testing, 
Documentation, Business Logic）による並列レビューを実行し、
問題が見つかった場合は自動修復を試みます。

レビューがパスするまでPRを作成しないでください。
```

---

## トラブルシューティング

### APIキーエラー

```
Error: No LLM API key found.
```

**解決策**: `OPENAI_API_KEY` または `ANTHROPIC_API_KEY` を設定

### パッケージ不足

```
Warning: Some packages may be missing: openai or anthropic
```

**解決策**: `pip install openai anthropic`

### タイムアウト

大きなファイルや多数のファイルをレビューする場合、タイムアウトが発生する可能性があります。

**解決策**: ファイルを分割してレビュー

```bash
./scripts/devin-pre-pr-review.sh --files src/module1.py
./scripts/devin-pre-pr-review.sh --files src/module2.py
```

---

## 関連ドキュメント

- [セルフレビュー（PR作成前）](./self-review.md)
- [自動コードレビュー](./automated-code-review.md)
- [AI駆動 Git Workflow](./git-workflow.md)
