# AIエージェント向けガイド

この文書は、このプロジェクトで作業するすべてのAIエージェント（Claude Code、GitHub Copilot、Cursor、その他）に向けた統一ガイドです。

## 🚨 必須: 作業開始前にMASTER.mdを必ず参照

**このプロジェクトで作業を開始する前に、必ず `docs/MASTER.md` を読み、内容を理解してください。**

### なぜMASTER.mdが重要なのか

MASTER.mdには以下の重要な情報が含まれています：

- **プロジェクト識別情報**: プロジェクト名、バージョン、使用AIツール
- **技術スタック**: フロントエンド、バックエンド、データベース、インフラの詳細
- **アーキテクチャパターン**: 採用している設計パターンとその理由
- **コード生成ルール**: 必須事項、命名規則、禁止事項
- **実装優先順位**: Phase 1（MVP）、Phase 2（拡張）、Phase 3（最適化）
- **エラーハンドリング方針**: 統一されたエラー処理の方法
- **セキュリティ要件**: 必須のセキュリティ対策
- **パフォーマンス目標**: 具体的な数値目標
- **AIへのプロンプト補助**: マジックナンバー回避のための制約

### MASTER.mdを参照しない場合のリスク

- プロジェクトの技術スタックと異なる実装を生成
- 禁止されているパターン（any型、マジックナンバー等）を使用
- セキュリティ要件を満たさないコードを生成
- パフォーマンス目標を無視した非効率な実装
- チームのコーディング規約に反するコード

## 各AIエージェント別の設定

### Claude Code (claude.ai/code)

**設定ファイル**: `CLAUDE.md`

**必須手順**:
1. プロジェクト開始時に `CLAUDE.md` を確認
2. `docs/MASTER.md` を必ず読み込む
3. コード生成前にMASTER.mdの内容を参照

**プロンプト例**:
```
このプロジェクトで作業を開始する前に、docs/MASTER.mdの内容を確認し、以下の点を理解してください：
- 技術スタック（TypeScript、React、Node.js等）
- コード生成ルール（型安全性、エラーハンドリング等）
- 禁止事項（any型、マジックナンバー等）
- 実装優先順位（Phase 1のMVP機能等）

その後、[具体的なタスク]を実装してください。
```

### GitHub Copilot

**設定ファイル**: `.github/copilot-instructions.md` または `AGENTS.md`

**必須手順**:
1. リポジトリのルートに `AGENTS.md` を配置
2. コード補完前にMASTER.mdの内容を確認
3. コメントでMASTER.mdの参照を明記

**コメント例**:
```typescript
// MASTER.md参照: TypeScript、型安全性必須、マジックナンバー禁止
// Phase 1 MVP機能: ユーザー認証システム
interface User {
  id: string;
  name: string;
  email: string;
}
```

### Cursor

**設定ファイル**: `.cursorrules` または `AGENTS.md`

**必須手順**:
1. `.cursorrules` ファイルにMASTER.md参照を記載
2. チャット機能でMASTER.mdの内容を確認
3. コード生成時にMASTER.mdの制約を適用

**`.cursorrules` の例**:
```
# Cursor Rules for AI Spec-Driven Development

## MANDATORY: Read MASTER.md First
Before generating any code, you MUST read and understand docs/MASTER.md.

## Key Constraints from MASTER.md
- TypeScript with strict type safety
- No any types (use unknown or proper types)
- No magic numbers (use named constants)
- Error handling with Result pattern
- Test coverage 80%+
- Follow naming conventions (camelCase, PascalCase, etc.)

## Architecture Patterns
- Clean Architecture
- Repository Pattern
- CQRS (if applicable)
- Event-Driven Architecture

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
1. Phase 1: MVP features (check MASTER.md for details)
2. Phase 2: Extension features
3. Phase 3: Optimization

Always reference MASTER.md for project-specific requirements.
```

### その他のAIエージェント

**設定ファイル**: `AGENTS.md` または エージェント固有の設定ファイル

**必須手順**:
1. この `AGENTS.md` ファイルを確認
2. `docs/MASTER.md` を必ず読み込む
3. プロジェクト固有の要件を理解してから作業開始

## 作業フロー

### 1. プロジェクト開始時
```
1. AGENTS.md を確認
2. docs/MASTER.md を読み込む
3. プロジェクトの技術スタックと要件を理解
4. 実装優先順位を確認
5. コーディング規約を理解
```

### 2. コード生成時
```
1. MASTER.mdのコード生成ルールを適用
2. 禁止事項を回避
3. セキュリティ要件を満たす
4. パフォーマンス目標を考慮
5. テストコードも同時生成
```

### 3. コードレビュー時
```
1. MASTER.mdのチェックリストを確認
2. マジックナンバー/ハードコードがないか確認
3. 型安全性が確保されているか確認
4. エラーハンドリングが適切か確認
5. セキュリティ要件を満たしているか確認
```

## よくある間違いと回避方法

### ❌ よくある間違い

1. **MASTER.mdを参照せずにコード生成**
   - 結果: プロジェクトの技術スタックと異なる実装
   - 回避: 必ずMASTER.mdを最初に読み込む

2. **マジックナンバーの使用**
   ```typescript
   // ❌ 間違い
   if (user.age > 18) { ... }
   
   // ✅ 正しい
   const MINIMUM_AGE = 18; // 成人年齢（歳）
   if (user.age > MINIMUM_AGE) { ... }
   ```

3. **any型の使用**
   ```typescript
   // ❌ 間違い
   const data: any = response.data;
   
   // ✅ 正しい
   interface ApiResponse {
     data: unknown;
   }
   const data: ApiResponse = response.data;
   ```

4. **エラーハンドリングの不備**
   ```typescript
   // ❌ 間違い
   try {
     await riskyOperation();
   } catch (error) {
     // 何もしない
   }
   
   // ✅ 正しい
   try {
     await riskyOperation();
   } catch (error) {
     logger.error('Operation failed', { error: error.message });
     return { success: false, error: error as Error };
   }
   ```

### ✅ 正しいアプローチ

1. **MASTER.mdの内容を常に参照**
2. **型安全性を確保**
3. **適切なエラーハンドリング**
4. **セキュリティ要件の遵守**
5. **パフォーマンス目標の考慮**

## 緊急時の対応

### 問題が発生した場合

1. **MASTER.mdの内容を再確認**
2. **関連するドキュメントを参照**
   - `docs/08-knowledge/TROUBLESHOOTING.md`
   - `docs/08-knowledge/LESSONS_LEARNED.md`
   - `docs/08-knowledge/BEST_PRACTICES.md`
3. **チームメンバーに相談**
4. **問題をLESSONS_LEARNED.mdに記録**

## 更新履歴

| 日付 | 更新者 | 更新内容 |
|------|--------|----------|


---

**重要**: この文書は、すべてのAIエージェントが一貫性のある高品質なコードを生成するためのガイドです。必ずMASTER.mdと併せて参照してください。
