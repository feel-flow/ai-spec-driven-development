# Cursor セットアップガイド

このガイドでは、Cursor エディタを AI仕様駆動開発プロジェクトで使用するための初期設定を説明します。

## 目次
1. [Cursorとは](#cursorとは)
2. [初期セットアップ](#初期セットアップ)
3. [.cursorrulesの設定](#cursorrulesの設定)
4. [Cursor固有の設定](#cursor固有の設定)
5. [効果的な使い方](#効果的な使い方)
6. [トラブルシューティング](#トラブルシューティング)

## Cursorとは

Cursor は、AIネイティブなコードエディタで、以下の特徴があります：

- **VS Code互換**: VS Codeの拡張機能がそのまま使える
- **AIチャット機能**: コード内でAIに質問しながら開発
- **コード補完**: GitHub Copilotに匹敵する高精度な補完
- **コマンドK**: ⌘K (Ctrl+K) で素早くAIに指示
- **.cursorrules**: プロジェクト固有のAIルール設定

## 初期セットアップ

### ステップ1: Cursor のインストール（10分）

1. **Cursor をダウンロード**
   ```
   https://cursor.sh
   ```

2. **インストール**
   - macOS: DMGファイルをダウンロードして Applications フォルダに移動
   - Windows: インストーラーを実行
   - Linux: AppImage をダウンロードして実行

3. **起動確認**
   - Cursor を起動
   - 初回起動時のセットアップウィザードに従う

### ステップ2: VS Code設定のインポート（5分・オプション）

既存のVS Code設定がある場合：

1. **設定のインポート**
   ```
   Cursor > Settings > Import VS Code Settings
   ```

2. **拡張機能のインポート**
   - 自動的にVS Codeの拡張機能が表示される
   - 必要なものを選択してインストール

### ステップ3: AI機能の有効化（5分）

1. **アカウント作成**
   - Cursor を起動
   - Sign Up ボタンをクリック
   - メールアドレスまたはGitHubアカウントで登録

2. **プラン選択**
   - **Free**: 基本的なAI機能（制限あり）
   - **Pro** ($20/月): 推奨
     - 無制限のAI補完
     - 優先的なGPT-4アクセス
     - より多くのチャットリクエスト

3. **AI設定の確認**
   ```
   Settings (⌘,) > Cursor Settings > AI
   - Enable AI Completions: ON
   - Enable AI Chat: ON
   ```

## .cursorrulesの設定

### ステップ1: .cursorrules ファイルの作成（15分）

プロジェクトルートに `.cursorrules` を作成します：

```bash
# プロジェクトルートで実行
cat > .cursorrules << 'EOF'
# Cursor Rules for AI Spec-Driven Development

## 🚨 MANDATORY: Read MASTER.md First

Before generating any code, you MUST read and understand docs-template/MASTER.md.

## Project Context
This is an AI-driven development project using a streamlined 7-document structure optimized for AI tools.

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
- Files: kebab-case (e.g., `user-service.ts`, `api-client.ts`)

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
- Clean Architecture
- Repository Pattern
- CQRS (Command Query Responsibility Segregation)
- Event-Driven Architecture
- Dependency Injection

## Security Requirements
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Proper authentication/authorization
- HTTPS usage
- Environment variable management

## Performance Goals
- Page load time: < 3 seconds
- API response time: < 200ms (95th percentile)
- Concurrent users: 1000

## Implementation Priority
1. **Phase 1: MVP** - Essential features only
2. **Phase 2: Extension** - Additional features
3. **Phase 3: Optimization** - Performance and scalability

## Code Generation Rules

### Before Suggesting Code
1. Read `docs-template/MASTER.md` for project context
2. Check `docs-template/03-implementation/PATTERNS.md` for implementation patterns
3. Verify `docs-template/02-design/ARCHITECTURE.md` for technical decisions
4. Review `docs-template/02-design/DOMAIN.md` for business logic

### During Code Suggestion
1. Follow the coding rules from MASTER.md
2. Use the patterns from PATTERNS.md
3. Implement proper error handling
4. Suggest corresponding tests
5. Add appropriate comments
6. 🚨 If information is missing, ask for confirmation instead of guessing

### After Code Suggestion
1. Verify no magic numbers are used
2. Check type safety
3. Ensure error handling is proper
4. Validate security requirements
5. Confirm performance considerations

## 🚨 Information Verification Protocol

When information is missing, DO NOT make assumptions. Always ask for confirmation.

### Required Confirmations
- Project name, target users, main features
- Technology stack (database type, auth method, API format, etc.)
- Performance, security, scalability requirements
- Business constraints (budget, timeline, etc.)

### Confirmation Format
```
⚠️ Missing Information - Confirmation Required

[Required Information]
1. Database Type
   - Reason: Design differs significantly between PostgreSQL and MongoDB
   - Options: PostgreSQL (relational) / MongoDB (document-oriented)
   - Please specify: Which one do you want to use?

2. [Other missing info]
   ...

[Next Steps]
After confirmation, please instruct: "Proceed with [confirmed information]"
```

### Allowed Assumptions (must be explicitly stated)
- TypeScript strict mode: Always enabled (state this)
- Test coverage target: 80%+ (state this)
- No magic numbers: Always enforced (state this)
- Error handling: Result pattern (state this)

For details, see `docs-template/MASTER.md` "Information Verification Protocol".

---

## Prohibited Patterns
- ❌ `any` type usage
- ❌ Magic numbers/hardcoded values
- ❌ `console.log` in production
- ❌ Unused imports/variables
- ❌ Error swallowing
- ❌ Functions over 30 lines
- ❌ Inconsistent naming

## Required Patterns
- ✅ TypeScript with strict types
- ✅ Named constants for all values
- ✅ Result pattern for error handling
- ✅ Comprehensive error handling
- ✅ Unit tests for all functions
- ✅ Proper logging
- ✅ Security best practices

## Document References
- `docs-template/MASTER.md` - Project overview and rules
- `docs-template/01-context/PROJECT.md` - Business requirements
- `docs-template/02-design/ARCHITECTURE.md` - Technical architecture
- `docs-template/02-design/DOMAIN.md` - Business logic
- `docs-template/03-implementation/PATTERNS.md` - Implementation patterns
- `docs-template/04-quality/TESTING.md` - Testing strategies
- `docs-template/05-operations/DEPLOYMENT.md` - Deployment procedures

Always reference MASTER.md for project-specific requirements and constraints.
EOF
```

### ステップ2: プロジェクト固有のカスタマイズ（10分）

あなたのプロジェクトに合わせて `.cursorrules` をカスタマイズします：

**例1: Reactプロジェクトの場合**
```
## Project-Specific Rules

### React Components
- Use functional components
- Leverage Hooks (useState, useEffect, useContext, etc.)
- Use TypeScript types, not PropTypes
- Style with styled-components or CSS Modules

### State Management
- Use Zustand for global state
- Minimize global state usage
- Prefer local state when possible

### File Structure
- Components: src/components/[component-name]/
- Each component in its own folder with index.tsx and styles
- Co-locate tests: [component-name].test.tsx
```

**例2: Node.js APIプロジェクトの場合**
```
## Project-Specific Rules

### API Design
- Follow RESTful API design principles
- Use OpenAPI 3.0 specification
- Versioning: /api/v1/...

### Error Handling
- Use Result pattern
- Set appropriate HTTP status codes
- Structured error messages

### Database
- Use Prisma ORM
- All queries in repository layer
- Never use raw SQL (unless absolutely necessary)

### Authentication
- JWT-based authentication
- Refresh token rotation
- Rate limiting on auth endpoints
```

## Cursor固有の設定

### ステップ1: ワークスペース設定（5分）

`.vscode/settings.json` を作成（Cursorは VS Code 設定と互換）：

```json
{
  "cursor.ai.enabled": true,
  "cursor.ai.model": "gpt-4",
  "cursor.ai.chat.enabled": true,
  "cursor.ai.completion.enabled": true,
  "cursor.ai.showDiff": true,
  "cursor.ai.rules": ".cursorrules",
  
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### ステップ2: キーボードショートカット設定（5分・オプション）

よく使う機能にショートカットを設定：

1. **Keyboard Shortcuts を開く**
   ```
   ⌘K ⌘S (macOS) または Ctrl+K Ctrl+S (Windows/Linux)
   ```

2. **推奨ショートカット**
   - AI Chat: `⌘L` (デフォルト)
   - Command K: `⌘K` (デフォルト)
   - Accept Suggestion: `Tab` (デフォルト)
   - Next Suggestion: `⌘]`
   - Previous Suggestion: `⌘[`

## 効果的な使い方

### 1. AI Chat (⌘L)

**プロジェクト全体の質問**:
```
@codebase このプロジェクトのユーザー認証はどのように実装されていますか?
```

**特定ファイルの質問**:
```
@file:user-service.ts この関数のエラーハンドリングを改善してください
```

**ドキュメント参照**:
```
docs-template/MASTER.md の規約に従って、このコードをリファクタリングしてください
```

### 2. Command K (⌘K)

コードを選択してから `⌘K` を押すと、選択範囲に対してAIが操作します：

**リファクタリング**:
```
選択: 長い関数
⌘K: "この関数を30行以下の複数の関数に分割してください"
```

**テスト生成**:
```
選択: 関数
⌘K: "AAA patternでユニットテストを生成してください"
```

**ドキュメント生成**:
```
選択: 関数またはクラス
⌘K: "JSDocコメントを追加してください"
```

### 3. インラインAI補完

**コメントからコード生成**:
```typescript
// MASTER.mdのResult patternを使用してユーザーを取得する関数
// [Tabを押すとAIが実装を提案]
```

**型定義からコード生成**:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// Userを作成する関数
// [Tabを押すとAIが実装を提案]
```

### 4. Composer モード

複数ファイルを同時に編集する高度な機能：

1. **Composer を開く**
   ```
   ⌘I (macOS) または Ctrl+I (Windows/Linux)
   ```

2. **複数ファイル編集の例**
   ```
   プロンプト:
   ユーザー認証機能を以下のファイルに追加してください:
   - src/services/auth-service.ts (新規作成)
   - src/controllers/auth-controller.ts (新規作成)
   - src/routes/auth-routes.ts (新規作成)
   - src/models/user.ts (既存ファイルに追加)
   
   MASTER.mdのClean Architectureパターンに従ってください。
   ```

## トラブルシューティング

### 問題1: AI補完が表示されない

**原因**: AI機能が無効、またはネットワーク接続の問題

**解決策**:
1. **AI設定を確認**
   ```
   Settings > Cursor Settings > AI
   - Enable AI Completions: ON にする
   ```

2. **ネットワーク接続を確認**
   ```
   Settings > Network
   - プロキシ設定を確認
   ```

3. **ログアウト/ログイン**
   ```
   Cursor > Sign Out
   再度ログイン
   ```

### 問題2: .cursorrules が反映されない

**原因**: ファイル名の間違い、または場所が違う

**解決策**:
1. **ファイル名を確認**
   ```bash
   # 正しい: .cursorrules
   # 間違い: cursorrules, .cursor-rules, cursor-rules.md
   ```

2. **配置場所を確認**
   ```bash
   # プロジェクトルートに配置
   my-project/
   ├── .cursorrules  ← ここ
   ├── src/
   └── package.json
   ```

3. **Cursor を再起動**
   - ⌘Q (macOS) または Alt+F4 (Windows) で完全終了
   - 再度起動

### 問題3: 生成されるコードが MASTER.md の規約に従わない

**原因**: .cursorrules の内容が不十分、またはプロンプトが曖昧

**解決策**:
1. **.cursorrules を更新**
   ```
   このガイドの完全版 .cursorrules テンプレートを使用
   ```

2. **プロンプトで明示的に指定**
   ```
   ❌ 悪い例:
   「ユーザー登録機能を作って」
   
   ✅ 良い例:
   「docs-template/MASTER.md の規約に従って、
   以下の要件を満たすユーザー登録機能を実装してください:
   - TypeScript strict mode
   - マジックナンバー禁止
   - Result pattern でエラーハンドリング
   - ユニットテスト付き」
   ```

3. **AI Chat で確認**
   ```
   @codebase .cursorrules の内容を確認して、
   MASTER.md のルールが含まれているか教えてください
   ```

### 問題4: Cursor が重い・遅い

**原因**: 大きなプロジェクト、または多くの拡張機能

**解決策**:
1. **インデックスを確認**
   ```
   Settings > Cursor Settings > Indexing
   - 不要なフォルダを除外 (node_modules, .git, dist, build)
   ```

2. **拡張機能を減らす**
   ```
   Extensions > Installed
   - 使っていない拡張機能を無効化
   ```

3. **.cursorignore を作成**
   ```bash
   # プロジェクトルートに .cursorignore 作成
   cat > .cursorignore << 'EOF'
   node_modules/
   dist/
   build/
   .git/
   *.log
   *.lock
   coverage/
   EOF
   ```

## ベストプラクティス

### 1. コード生成のワークフロー

```
1. 要件を明確化
   ↓
2. AI Chat で設計相談 (⌘L)
   プロンプト: "MASTER.mdに従って、[機能名]の設計案を提案してください"
   ↓
3. Command K でコード生成 (⌘K)
   選択範囲に対して具体的な指示
   ↓
4. インラインAI補完で微調整
   コメントを書いてTabで補完
   ↓
5. AI Chat でレビュー依頼
   プロンプト: "MASTER.mdの規約に違反していないかチェックしてください"
```

### 2. プロンプトのコツ

**具体的に指示**:
```
❌ 「エラー処理を追加して」
✅ 「MASTER.mdのResult patternを使ってエラー処理を追加してください。
   try-catchブロックで例外をキャッチし、
   { success: false, error: Error } の形式で返してください」
```

**コンテキストを提供**:
```
@file:docs-template/MASTER.md
@file:docs-template/03-implementation/PATTERNS.md
この2つのドキュメントに従って、ユーザーサービスを実装してください
```

**段階的に進める**:
```
1. まずインターフェースを定義
2. 次に基本実装
3. エラーハンドリング追加
4. 最後にテストコード生成
```

### 3. チーム開発での活用

**.cursorrules の共有**:
```bash
# リポジトリに追加
git add .cursorrules
git commit -m "Add Cursor AI rules for team consistency"
git push origin main
```

**チームメンバー向けドキュメント**:
```markdown
# Cursor セットアップ（チーム用）

1. Cursor をインストール: https://cursor.sh
2. このリポジトリをクローン
3. .cursorrules が自動的に読み込まれます
4. docs-template/MASTER.md を確認
5. 開発開始！

## よく使う機能
- AI Chat: ⌘L
- Command K: ⌘K（コード選択後）
- 補完受け入れ: Tab
```

## まとめ

Cursor のセットアップは以下の4ステップ：

1. **Cursor インストール**（10分）
   - https://cursor.sh からダウンロード
   - Pro プラン推奨（月額 $20）

2. **.cursorrules 作成**（25分）
   - テンプレートをコピー
   - プロジェクト固有のルールを追加

3. **ワークスペース設定**（10分）
   - .vscode/settings.json 作成
   - AI機能を有効化

4. **使い方を学習**（15分）
   - AI Chat (⌘L) でプロジェクト全体の質問
   - Command K (⌘K) でコード操作
   - インライン補完でコード生成

**合計所要時間**: 約60分

### 次のステップ

1. ✅ Cursor のセットアップ完了
2. → [GETTING_STARTED_NEW_PROJECT.md](GETTING_STARTED_NEW_PROJECT.md) で実際のプロジェクト開始
3. → [docs-template/MASTER.md](docs-template/MASTER.md) で詳細なプロジェクトルール確認

### Cursorの強み

- **VS Code互換**: 既存のVS Code設定・拡張機能がそのまま使える
- **Composer モード**: 複数ファイルを同時に編集できる高度な機能
- **.cursorrules**: プロジェクト固有のAIルールを細かく設定可能
- **速い補完**: GitHub Copilotに匹敵する高速な補完

---

**参考リンク**:
- [Cursor 公式サイト](https://cursor.sh)
- [Cursor Documentation](https://docs.cursor.sh)
- [MASTER.md](docs-template/MASTER.md)
- [AGENTS.md](AGENTS.md)
