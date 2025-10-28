# GitHub Copilot完全セットアップガイド

## 📋 このガイドの内容

このガイドでは、GitHub CopilotをAI仕様駆動開発で使うための**完全な初期設定**を説明します。

### 含まれる内容
1. GitHub Copilotのインストール（15分）
2. `.github/copilot-instructions.md` の設定（5-30分）
   - **🚀 AIプロンプトで自動生成（推奨・5-10分）**
   - 既存テンプレートからコピー（15分）
   - 手動で作成（30分）
3. VS Code設定（10分）
4. 動作確認とテスト（10分）
5. 効果的な使い方とベストプラクティス
6. トラブルシューティング

**推奨所要時間**: 合計30-40分（AIプロンプト生成を使用した場合）

---

## STEP 1: GitHub Copilotのインストール（15分）

### 1-1: GitHub Copilotサブスクリプション

1. **GitHub Copilotのページにアクセス**
   - https://github.com/features/copilot

2. **「Start a free trial」または「Subscribe」をクリック**
   - 個人プラン: $10/月
   - ビジネスプラン: $19/ユーザー/月
   - 初月無料トライアルあり

3. **GitHubアカウントでログイン**
   - まだアカウントがない場合は、新規作成

4. **支払い情報を入力**
   - 無料トライアル中でも必要
   - トライアル期間終了前にキャンセル可能

### 1-2: VS Code拡張機能のインストール

1. **VS Codeを開く**

2. **拡張機能マーケットプレイスを開く**
   - macOS: `Cmd + Shift + X`
   - Windows/Linux: `Ctrl + Shift + X`

3. **「GitHub Copilot」を検索**

4. **以下の拡張機能をインストール**:
   - ✅ **GitHub Copilot** （必須）
   - ✅ **GitHub Copilot Chat** （推奨）

5. **VS Codeを再起動**

### 1-3: GitHubアカウントと連携

1. **VS Code左下の「Sign in to GitHub」をクリック**
   
2. **ブラウザが開くので、GitHubアカウントでログイン**

3. **VS Codeへのアクセスを許可**

4. **確認**:
   - VS Code右下に「GitHub Copilot」のアイコンが表示されればOK

**✅ STEP 1 完了チェック:**
- [ ] GitHub Copilotのサブスクリプションを購入
- [ ] VS Codeにインストール完了
- [ ] GitHubアカウントと連携完了

---

## STEP 2: `.github/copilot-instructions.md` の設定（30分）

### 2-1: `.github` フォルダの作成

プロジェクトのルートディレクトリで以下を実行：

```bash
# プロジェクトルートで実行
mkdir -p .github
```

### 2-2: `copilot-instructions.md` の作成方法を選択

あなたのプロジェクトに合わせて、以下から選択してください：

#### 🚀 方法A: AIプロンプトで自動生成（推奨・最速）

**所要時間**: 5-10分

**この方法が最適な場合**:
- プロジェクトの `docs-template/MASTER.md` がすでに作成済み
- AIツール（Claude Code、GitHub Copilot Chat、Cursor）が使える
- プロジェクト固有のルールを確実に反映したい

**手順**:

1. **AIツールを開く**
   - GitHub Copilot Chat: VS Codeで `Cmd+I` (macOS) または `Ctrl+I` (Windows/Linux)
   - Claude Code: https://claude.ai/code
   - Cursor: `Cmd+L` (macOS) または `Ctrl+L` (Windows/Linux)

2. **以下のプロンプトをコピーして貼り付け**:

```
以下のプロジェクト情報に基づいて、GitHub Copilot用の .github/copilot-instructions.md を生成してください。

# プロジェクト情報
- プロジェクト名: [あなたのプロジェクト名]
- 技術スタック: [例: TypeScript, React, Node.js, PostgreSQL]
- アーキテクチャ: [例: Clean Architecture, Microservices]

# 必須制約（docs-template/MASTER.mdより）
[ここに MASTER.md の「コード生成ルール」セクションをコピペ]

# プロジェクト固有のルール
[あなたのプロジェクト固有のルールがあれば記入]
例:
- React: 関数コンポーネントのみ使用
- 状態管理: Zustand使用
- スタイリング: Tailwind CSS使用

# 出力形式
- Markdown形式で出力
- セクション構成:
  1. プロジェクト概要
  2. 技術スタック
  3. コード生成ルール
  4. 命名規則
  5. 禁止事項
  6. アーキテクチャパターン
  7. セキュリティ要件
  8. パフォーマンス目標
  9. ドキュメント参照
  10. コードレビューチェックリスト

# 制約
- MASTER.mdの内容を必ず反映すること
- マジックナンバー禁止を明記
- any型禁止を明記
- エラーハンドリング（Result pattern）を明記
- テストカバレッジ80%以上を明記

# 🚨 重要: 情報不足時の確認ルール
情報が不足している場合、推論で埋めずに必ず確認を求めること。

必須確認事項:
- プロジェクト名、ターゲットユーザー、主要機能
- 技術スタック（データベース種別、認証方式、API形式等）
- パフォーマンス・セキュリティ要件

確認の出力形式:
```
⚠️ 情報不足により確認が必要です

【必須確認事項】
1. [項目名]: [何が不明か]
   - 理由: [なぜ確認が必要か]
   - 推奨: [推奨される選択肢]

【次のステップ】
上記を確認後、「[確認された情報]で進めてください」と指示してください。
```

詳細は docs-template/MASTER.md の「情報不足時の必須確認プロトコル」を参照。
```

3. **生成された内容を `.github/copilot-instructions.md` に保存**

```bash
# AIが生成した内容をコピーして以下を実行
cat > .github/copilot-instructions.md << 'EOF'
[ここにAIが生成した内容を貼り付け]
EOF
```

4. **内容を確認・微調整**
   - プロジェクト名が正しいか確認
   - 技術スタックが最新か確認
   - プロジェクト固有のルールが含まれているか確認

**💡 プロンプトのカスタマイズ例**:

<details>
<summary>Reactプロジェクトの場合</summary>

```
# プロジェクト固有のルール
- React 18使用
- 関数コンポーネントのみ（クラスコンポーネント禁止）
- Hooks優先（useState, useEffect, useContext等）
- PropTypesではなくTypeScriptの型を使用
- styled-componentsでスタイリング
- 状態管理: Zustand
- ルーティング: React Router v6
```
</details>

<details>
<summary>Node.js APIプロジェクトの場合</summary>

```
# プロジェクト固有のルール
- Node.js 20 LTS使用
- Express.js使用
- RESTful API設計
- OpenAPI 3.0仕様必須
- JWT認証
- Prisma ORM使用
- バージョニング: /api/v1/...
- エラーハンドリング: Result pattern必須
```
</details>

<details>
<summary>Next.jsプロジェクトの場合</summary>

```
# プロジェクト固有のルール
- Next.js 14 App Router使用
- Server Components優先
- Client Componentsは'use client'明記
- データフェッチ: fetch with cache
- 認証: NextAuth.js
- スタイリング: Tailwind CSS
- 状態管理: Zustand（クライアント側）
```
</details>

**✅ 方法Aの利点**:
- 最速（5-10分）
- MASTER.mdの内容を確実に反映
- プロジェクト固有のルールを自動的に統合
- 一貫性のある記述

---

#### 📋 方法B: このリポジトリからコピー

**所要時間**: 15分

```bash
# このリポジトリをクローン済みの場合
cp path/to/ai-spec-driven-development/.github/copilot-instructions.md \
   .github/copilot-instructions.md
```

その後、プロジェクト固有の内容に書き換えてください。

---

#### ✍️ 方法C: 手動で作成

以下の内容で `.github/copilot-instructions.md` を新規作成：

```markdown
# GitHub Copilot Instructions

## 🚨 MANDATORY: Read MASTER.md First

Before generating any code suggestions, you MUST read and understand `docs-template/MASTER.md`.

## Project Context
[ここにプロジェクトの概要を記入]

## Key Constraints from MASTER.md

### Type Safety
- Use TypeScript with strict type safety
- No `any` types (use `unknown` or proper types)
- Explicit type definitions for all variables, functions, and API responses

### Code Quality
- No magic numbers/hardcoded values (use named constants)
- No `console.log` in production code
- No unused imports or variables
- No error swallowing (always handle errors properly)
- Functions should be under 30 lines

### Naming Conventions

#### Code
- Variables: camelCase (e.g., `userName`, `isActive`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- Types/Interfaces: PascalCase (e.g., `UserProfile`, `ApiResponse`)
- Files: kebab-case (e.g., `user-service.ts`)

#### Documentation Files
- Directories: `number-lowercase-hyphen` (e.g., `01-context`, `02-design`)
- Files: `UPPERCASE.md` (e.g., `MASTER.md`, `ARCHITECTURE.md`)
- For details, see `docs-template/03-implementation/CONVENTIONS.md`

### Error Handling
- Use Result pattern for error handling
- Implement try-catch blocks with proper error messages
- Log errors with structured logging

### Testing
- Generate unit tests for all functions (80%+ coverage target)
- Use AAA pattern (Arrange-Act-Assert)
- Mock dependencies appropriately

## Architecture Patterns
[プロジェクトで使用するアーキテクチャパターンを記入]
- Clean Architecture
- Repository Pattern
- etc.

## Document References
- `docs-template/MASTER.md` - Project overview and rules
- `docs-template/01-context/PROJECT.md` - Business requirements
- `docs-template/02-design/ARCHITECTURE.md` - Technical architecture
- `docs-template/03-implementation/PATTERNS.md` - Implementation patterns
- `docs-template/04-quality/TESTING.md` - Testing strategies

## Code Review Checklist
- [ ] MASTER.md rules followed
- [ ] No magic numbers/hardcoded values
- [ ] Type safety ensured
- [ ] Error handling implemented
- [ ] Tests generated
- [ ] Security requirements met
- [ ] Naming conventions followed
```

**✅ STEP 2 完了チェック:**
- [ ] `.github/copilot-instructions.md` を作成完了
- [ ] プロジェクト固有の情報を記入完了
- [ ] MASTER.mdの内容が反映されているか確認完了

---

## 💡 補足: AIプロンプトを使った高度なカスタマイズ

### プロンプトテンプレート集

#### 1. 既存コードベースから学習させる

```
以下の既存コードベースの特徴を分析して、
.github/copilot-instructions.md に追加すべきプロジェクト固有のルールを提案してください。

# 分析対象
[ここに主要なファイルのコードを貼り付け]

# 分析観点
- 使用しているライブラリとそのバージョン
- コーディングスタイル（関数の長さ、命名規則等）
- エラーハンドリングのパターン
- テストの書き方
- ファイル構造の規則

# 出力形式
Markdown形式で、copilot-instructions.mdに追加すべきルールとして出力してください。
```

#### 2. チーム規約を自動変換

```
以下のチームコーディング規約を、
GitHub Copilot用の.github/copilot-instructions.mdに変換してください。

# チームコーディング規約
[ここにチームの既存のコーディング規約を貼り付け]

# 要件
- GitHub Copilotが理解しやすい形式に変換
- 具体的なコード例を追加
- 禁止事項は明確に❌マークで示す
- 推奨事項は✅マークで示す
```

#### 3. 特定の技術スタック向けに最適化

```
以下の技術スタックに最適化された、
.github/copilot-instructions.mdの「プロジェクト固有のルール」セクションを生成してください。

# 技術スタック
- フロントエンド: [例: React 18, TypeScript, Tailwind CSS]
- バックエンド: [例: Node.js, Express, Prisma]
- データベース: [例: PostgreSQL]
- 認証: [例: NextAuth.js]
- デプロイ: [例: Vercel]

# 含めるべき内容
- フレームワーク固有のベストプラクティス
- パフォーマンス最適化のルール
- セキュリティ要件
- 禁止パターン
- コード例
```

### よくある質問: AIプロンプト生成

**Q: AIが生成した内容をそのまま使っても大丈夫？**
A: 必ず以下を確認してください：
- プロジェクト名が正しいか
- 技術スタックのバージョンが最新か
- MASTER.mdの内容と矛盾がないか
- チーム独自のルールが含まれているか

**Q: 既存のcopilot-instructions.mdを更新したい場合は？**
A: 以下のプロンプトを使用：
```
以下の既存の.github/copilot-instructions.mdを、
新しい要件に基づいて更新してください。

# 既存の内容
[現在のcopilot-instructions.mdの内容]

# 追加・変更する要件
[新しい要件や変更内容]

# 更新方針
- 既存のルールは維持
- 矛盾する部分は新しい要件を優先
- 重複を避ける
```

**Q: 複数のAIツールでプロンプトを試したい場合は？**
A: 各ツールで試して、最も良い結果を選択：
1. GitHub Copilot Chat で生成
2. Claude Code で生成
3. Cursor で生成
4. 結果を比較して最適なものを選択

---

### 2-3: プロジェクト固有の情報を記入（手動の場合）

手動で作成した場合は、以下を記入：

1. **Project Context**
   - `docs-template/MASTER.md` の「プロジェクト概要」をコピー

2. **Architecture Patterns**
   - `docs-template/MASTER.md` の「アーキテクチャパターン」をコピー

3. **技術スタック固有のルール**
   - 例: React使用時の`useState`, `useEffect`の使い方
   - 例: Next.js使用時のファイル構造ルール

### 2-4: カスタマイズ例

#### React + TypeScript プロジェクトの場合

```markdown
## React Specific Rules

### Component Structure
- Use function components only (no class components)
- Use TypeScript interfaces for props
- Use named exports

Example:
\`\`\`typescript
interface UserCardProps {
  name: string;
  email: string;
}

export function UserCard({ name, email }: UserCardProps) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}
\`\`\`

### State Management
- Use `useState` for local state
- Use `useReducer` for complex state
- Avoid prop drilling (use Context API when needed)

### Styling
- Use CSS Modules or Styled Components
- Follow BEM naming convention for CSS classes
```

#### Node.js + Express プロジェクトの場合

```markdown
## Backend Specific Rules

### API Structure
- Use Express Router for route organization
- Implement middleware for authentication
- Use async/await (no callbacks)

Example:
\`\`\`typescript
import { Router } from 'express';

const router = Router();

router.get('/users', async (req, res) => {
  try {
    const users = await userService.getAll();
    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Failed to fetch users', { error });
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
\`\`\`

### Database
- Use TypeORM for database operations
- Always use transactions for multiple operations
- Implement soft delete (do not physically delete records)
```

**✅ STEP 2 完了チェック:**
- [ ] `.github/copilot-instructions.md` を作成
- [ ] プロジェクト概要を記入
- [ ] アーキテクチャパターンを記入
- [ ] 技術スタック固有のルールを追加

---

## STEP 3: Copilot設定のカスタマイズ（15分）

### 3-1: VS Code設定ファイル

プロジェクトルートに `.vscode/settings.json` を作成：

```json
{
  // GitHub Copilot設定
  "github.copilot.enable": {
    "*": true,
    "plaintext": false,
    "markdown": true,
    "scminput": false
  },
  
  // 自動補完の設定
  "editor.inlineSuggest.enabled": true,
  "editor.suggestSelection": "first",
  
  // Copilot Chat設定
  "github.copilot.chat.localeOverride": "ja",
  
  // コード生成時の設定
  "github.copilot.advanced": {
    "debug.overrideEngine": "",
    "debug.testOverrideProxyUrl": "",
    "debug.overrideProxyUrl": ""
  }
}
```

### 3-2: 言語ごとの有効/無効設定

特定のファイルタイプでCopilotを無効にしたい場合：

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": false,        // YAMLファイルで無効
    "markdown": true,     // Markdownで有効
    "plaintext": false    // プレーンテキストで無効
  }
}
```

**✅ STEP 3 完了チェック:**
- [ ] `.vscode/settings.json` を作成
- [ ] Copilot設定をカスタマイズ

---

## STEP 4: 動作確認（10分）

### 4-1: 基本的なコード補完テスト

1. **新しいファイルを作成**
   - 例: `test.ts` または `test.js`

2. **コメントを書く**
   ```typescript
   // ユーザー情報を持つインターフェースを定義
   ```

3. **Enterキーを押す**
   - Copilotが自動的にコードを提案するはず

4. **`Tab`キーで受け入れ**

**期待される結果:**
```typescript
// ユーザー情報を持つインターフェースを定義
interface User {
  id: string;
  name: string;
  email: string;
}
```

### 4-2: Copilot Chatのテスト

1. **Copilot Chatを開く**
   - macOS: `Cmd + I`
   - Windows/Linux: `Ctrl + I`

2. **質問してみる**
   ```
   このプロジェクトのMASTER.mdのルールに従って、
   ユーザー登録機能のコードを生成してください。
   ```

3. **Copilotが`docs-template/MASTER.md`を参照して回答するか確認**

**✅ STEP 4 完了チェック:**
- [ ] コード補完が動作する
- [ ] Copilot Chatが動作する
- [ ] MASTER.mdのルールが反映されている

---

## STEP 5: 効果的な使い方（実践）

### 5-1: コメント駆動開発

**良い例:**
```typescript
// 【関数名】validateEmail
// 【引数】email: string
// 【戻り値】boolean
// 【処理】メールアドレスの形式が正しいかチェック
// 【制約】RFC 5322に準拠
```

Copilotが自動的に関数を生成します。

**悪い例:**
```typescript
// メールチェック
```
→ 曖昧すぎて、望んだコードが生成されない

### 5-2: Copilot Chatの効果的な使い方

#### パターン1: コード生成依頼

```
【タスク】
ユーザー登録APIエンドポイントを作成

【制約】
- docs-template/MASTER.mdのルールに従う
- docs-template/03-implementation/PATTERNS.mdのエラーハンドリングパターンを使用
- マジックナンバー禁止
- TypeScript strict mode
- 単体テストも同時生成

【成果物】
1. APIエンドポイント実装
2. バリデーション処理
3. エラーハンドリング
4. 単体テスト
```

#### パターン2: コードレビュー依頼

```
以下のコードをレビューしてください。

【チェック項目】
- MASTER.mdのルールに違反していないか
- マジックナンバーがないか
- エラーハンドリングが適切か
- 型安全性が確保されているか
- セキュリティリスクがないか

[コードを貼り付け]
```

#### パターン3: リファクタリング依頼

```
以下のコードをリファクタリングしてください。

【目標】
- PATTERNS.mdのベストプラクティスに従う
- 関数を30行以内に収める
- マジックナンバーを定数化
- 型安全性を向上

[コードを貼り付け]
```

### 5-3: `.copilotignore` の設定（オプション）

Copilotに学習させたくないファイルがある場合：

`.copilotignore` ファイルを作成：

```
# Copilotに学習させないファイル
*.log
*.env
node_modules/
dist/
.env*
secrets/
private/
```

---

## STEP 6: チーム開発での設定共有

### 6-1: リポジトリにコミット

```bash
# .githubフォルダ全体をコミット
git add .github/
git commit -m "Add GitHub Copilot instructions"
git push
```

### 6-2: チームメンバーへの共有

`README.md` に以下を追加：

```markdown
## GitHub Copilot設定

このプロジェクトでは、GitHub Copilotを使用する場合、
以下のルールに従ってください。

### 必須設定

1. `.github/copilot-instructions.md` を確認
2. `docs-template/MASTER.md` を必ず参照
3. コード生成時はプロジェクトのルールを遵守

### ドキュメント

- [GitHub Copilotセットアップガイド](./docs-template/SETUP_GITHUB_COPILOT.md)
```

---

## トラブルシューティング

### Q1: Copilotが提案してくれない

**対処法:**

1. **GitHubアカウント連携を確認**
   - VS Code左下のアカウントアイコンをクリック
   - 「Sign in to GitHub」が表示される場合は再ログイン

2. **サブスクリプションを確認**
   - https://github.com/settings/copilot
   - アクティブになっているか確認

3. **VS Codeを再起動**

4. **拡張機能を再インストール**

### Q2: MASTER.mdのルールが反映されない

**対処法:**

1. **`.github/copilot-instructions.md` の内容を確認**
   - パスが正しいか
   - MASTER.mdへの参照が明記されているか

2. **Copilot Chatで明示的に指示**
   ```
   必ず docs-template/MASTER.md のルールに従ってください。
   ```

3. **copilot-instructions.mdを更新後、VS Codeを再起動**

### Q3: 提案されるコードの質が低い

**対処法:**

1. **コメントをより具体的に書く**
   - 関数名、引数、戻り値、処理内容を明記

2. **Copilot Chatを使用**
   - より詳細な指示が可能

3. **`.copilotignore` で不要なファイルを除外**

---

## ベストプラクティス

### ✅ 推奨される使い方

1. **コメントは日本語で詳しく書く**
   ```typescript
   // ユーザーIDからユーザー情報を取得する関数
   // 存在しない場合はnullを返す
   // データベースエラーの場合は例外をスロー
   ```

2. **型定義を先に書く**
   ```typescript
   interface UserProfile {
     id: string;
     name: string;
     email: string;
     createdAt: Date;
   }
   
   // UserProfileを返すAPI関数を生成してください
   ```

3. **Copilot Chatで設計を相談**
   ```
   以下の要件を満たすデータ構造を提案してください：
   - ユーザー情報を保存
   - 投稿情報と1対多の関係
   - 削除フラグを持つ（論理削除）
   ```

### ❌ 避けるべき使い方

1. **何も考えずに全て受け入れる**
   - 必ずレビューする
   - MASTER.mdのルールに合致しているか確認

2. **セキュリティコードをそのまま使う**
   - 認証・認可のコードは特に注意
   - セキュリティ専門家のレビューを受ける

3. **個人情報をコメントに書く**
   - APIキー、パスワード等は絶対に書かない
   - Copilotが学習してしまう可能性

---

## 次のステップ

### さらに効率を上げるために

1. **PATTERNS.mdを充実させる**
   - プロジェクト固有のパターンを追加
   - Copilotがより良いコードを生成できるようになる

2. **TESTING.mdを参照させる**
   - テスト生成時のルールを明確化

3. **定期的にcopilot-instructions.mdを更新**
   - プロジェクトの進化に合わせて更新
   - 新しいパターンやルールを追加
   - **AIプロンプトで更新を自動化**:
     ```
     以下の既存のcopilot-instructions.mdに、
     新しく追加されたルールを統合してください：
     
     [既存の内容]
     
     新規追加ルール:
     [新しいルール]
     ```

4. **チームで共有**
   - `.github/copilot-instructions.md` をリポジトリにコミット
   - チーム全員が同じルールで開発できる

---

## まとめ

### セットアップ完了チェックリスト

- [ ] **STEP 1**: GitHub Copilotをインストール（15分）
- [ ] **STEP 2**: `.github/copilot-instructions.md`を作成（5-30分）
  - [ ] **推奨**: AIプロンプトで自動生成（5-10分）
  - [ ] プロジェクト固有のルールを追加
  - [ ] MASTER.mdの内容を反映
- [ ] **STEP 3**: VS Code設定を完了（10分）
- [ ] **STEP 4**: 動作確認とテスト（10分）
- [ ] チームメンバーと共有

### 所要時間の目安

| 方法 | 所要時間 |
|------|---------|
| **AIプロンプト生成（推奨）** | **30-40分** |
| テンプレートからコピー | 40-50分 |
| 手動で作成 | 60-70分 |

### 重要なポイント

1. **AIプロンプト生成が最速かつ最適**
   - MASTER.mdの内容を確実に反映
   - プロジェクト固有のルールも統合
   - 一貫性のある記述

2. **定期的な更新が重要**
   - プロジェクトの進化に合わせて更新
   - AIプロンプトで更新作業も自動化可能

3. **チームで共有**
   - リポジトリにコミットして共有
   - 全員が同じルールで開発

---

## 参考リンク

- [GitHub Copilot公式ドキュメント](https://docs.github.com/ja/copilot)
- [GitHub Copilot Chat](https://docs.github.com/ja/copilot/github-copilot-chat)
- [VS Code拡張機能](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
- [MASTER.md](./MASTER.md) - プロジェクト全体のルール
- [PATTERNS.md](./03-implementation/PATTERNS.md) - 実装パターン

---

**セットアップ完了おめでとうございます！🎉**

GitHub Copilotを使って、効率的なAI駆動開発を楽しんでください！

**次のステップ**:
- [GETTING_STARTED_NEW_PROJECT.md](./GETTING_STARTED_NEW_PROJECT.md) - プロジェクト開始ガイド
- [SETUP_CLAUDE_CODE.md](./SETUP_CLAUDE_CODE.md) - Claude Code セットアップ
- [SETUP_CURSOR.md](./SETUP_CURSOR.md) - Cursor セットアップ
