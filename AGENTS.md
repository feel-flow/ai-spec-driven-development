# AIエージェント向けガイド

この文書は、このプロジェクトで作業するすべてのAIエージェント（Gemini Code Assist、Claude Code、GitHub Copilot、Cursor、その他）に向けた統一ガイドです。

## 🌐 言語設定 (Language Settings)

**すべての応答、解説、コード内のコメントは必ず「日本語」で行ってください。**
(All responses, explanations, and comments must be in Japanese.)

## 🚨 必須: 作業開始前にMASTER.mdを必ず参照

**このプロジェクトで作業を開始する前に、必ず `docs-template/MASTER.md` を読み、内容を理解してください。**

### 📁 重要: 番号付きフォルダ構造を使用

**このプロジェクトでは、7つの必須文書を番号付きフォルダに配置しています。AIツールは必ずこの構造に従ってください。**

```
docs/
├── MASTER.md                           # 中央管理文書（必須）
├── 01-business/
│   ├── PROJECT.md                      # ビジョンと要件
│   └── DOMAIN.md                       # ビジネスロジック
├── 02-design/
│   └── ARCHITECTURE.md                 # システム設計
├── 03-implementation/
│   └── PATTERNS.md                     # 実装パターン
├── 05-operations/
│   └── DEPLOYMENT.md                   # 運用手順
├── 06-reference/
│   ├── GLOSSARY.md                     # 用語集
│   └── DECISIONS.md                    # 設計判断記録
└── 07-quality/
    └── TESTING.md                      # テスト戦略
```

**重要ポイント**:
- 新しいドキュメントを作成する際は、適切な番号付きフォルダ内に配置してください
- ドキュメント参照時は必ずフォルダパスを含めてください（例: `01-business/PROJECT.md`）
- フラットな `docs/` 直下には MASTER.md のみを配置してください

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
- **ドキュメント構造**: 番号付きフォルダの使い方と読み込み順序

### MASTER.mdを参照しない場合のリスク

- プロジェクトの技術スタックと異なる実装を生成
- 禁止されているパターン（any型、マジックナンバー等）を使用
- セキュリティ要件を満たさないコードを生成
- パフォーマンス目標を無視した非効率な実装
- チームのコーディング規約に反するコード
- 誤ったフォルダ構造でドキュメントを作成

## 🚨 重要: 情報不足時の確認ルール

**すべてのAIエージェントは、情報が不足している場合、推論で埋めずに必ず確認を求めること。**

### 必須確認が必要な情報

以下の情報が不明な場合は、**推論せずに必ず確認**してください：

**プロジェクト基本情報**:
- プロジェクト名（具体的な名称）
- ターゲットユーザー（誰のために作るか）
- 主要機能（何を実現するか）
- 技術スタック（使用する言語・フレームワーク）

**技術的詳細**:
- データベース種別（PostgreSQL? MongoDB? MySQL?）
- 認証方式（JWT? OAuth? Session?）
- デプロイ環境（AWS? GCP? Azure? Vercel?）
- API形式（REST? GraphQL? gRPC?）

**ビジネス要件**:
- パフォーマンス要件（具体的な数値）
- セキュリティ要件（必須の対策）
- スケーラビリティ要件（同時接続数等）

### 確認の出力形式（テンプレート）

```markdown
⚠️ 情報不足により確認が必要です

以下の情報が不足しているため、推論では進められません。
確認をお願いします：

【必須確認事項】
1. [項目名]: [何が不明か]
   - 例: データベース種別
   - 理由: PostgreSQLとMongoDBで設計が大きく異なるため
   - 推奨: PostgreSQL（リレーショナルデータの場合）/ MongoDB（ドキュメント指向の場合）

2. [項目名]: [何が不明か]
   ...

【オプション確認事項（推論で進める場合の前提）】
1. [項目名]: [推論内容]
   - 前提: [この前提で進めます]
   - リスク: [後で変更が必要になる可能性]
   - 確認推奨: はい/いいえ

【次のステップ】
上記を確認後、以下のように指示してください：
「[確認された情報]で進めてください」
```

### 推論が許容される範囲（明記が必須）

以下は**明示的な指示がない場合のデフォルト値**として使用可（ただし必ず明記すること）：

- ✅ TypeScript strict mode: 常に有効
- ✅ テストカバレッジ目標: 80%以上
- ✅ マジックナンバー禁止: 常に適用
- ✅ エラーハンドリング: Result pattern使用
- ✅ 命名規則: MASTER.mdの規則に従う

**❌ 推論禁止の例**:
```
悪い例:
「データベースは一般的なので、PostgreSQLで進めます」
→ ユーザーがMySQLを想定していた場合、全て作り直し

良い例:
「データベース種別が指定されていません。
以下から選択してください：
1. PostgreSQL（推奨: リレーショナル、高機能）
2. MySQL（推奨: シンプル、広く普及）
3. MongoDB（推奨: ドキュメント指向、柔軟）
4. その他（具体的に指定してください）」
```

詳細は `docs-template/MASTER.md` の「情報不足時の必須確認プロトコル」を参照。

---

## 各AIエージェント別の設定

### Gemini Code Assist

**設定ファイル**: `AGENTS.md` (本ファイル)

**必須手順**:
1. **常に日本語で応答する** (Always respond in Japanese)
2. プロジェクト開始時に `AGENTS.md` と `docs-template/MASTER.md` を確認
3. コード生成前にMASTER.mdの内容を参照

**プロンプト例**:
`このプロジェクトのAGENTS.mdとMASTER.mdに従い、日本語で[タスク]を行ってください。`

### Claude Code (claude.ai/code)

**設定ファイル**: `CLAUDE.md`

**必須手順**:
1. プロジェクト開始時に `CLAUDE.md` を確認
2. `docs-template/MASTER.md` を必ず読み込む
3. コード生成前にMASTER.mdの内容を参照

**プロンプト例**:
```
このプロジェクトで作業を開始する前に、docs-template/MASTER.mdの内容を確認し、以下の点を理解してください：
- 技術スタック（TypeScript、React、Node.js等）
- コード生成ルール（型安全性、エラーハンドリング等）
- 禁止事項（any型、マジックナンバー等）
- 実装優先順位（Phase 1のMVP機能等）

その後、[具体的なタスク]を実装してください。
```

### GitHub Copilot

**設定ファイル**: `.github/copilot-instructions.md` または `AGENTS.md`  
**校正スキル**: `.github/copilot/skills/*.md`

**必須手順**:
1. リポジトリのルートに `AGENTS.md` を配置
2. コード補完前にMASTER.mdの内容を確認
3. コメントでMASTER.mdの参照を明記

**校正スキル（Book Writing Workflow 用）**:

スコープを分割した 5 つの校正スキルを `.github/copilot/skills` に配置：

| スキル | 対象 | 説明 |
|--------|------|------|
| [`proofread-japanese.md`](.github/copilot/skills/proofread-japanese.md) | 日本語表現 | 誤字脱字、文法、読みやすさ |
| [`proofread-terms.md`](.github/copilot/skills/proofread-terms.md) | 用語統一 | 表記揺れ、用語の一貫性 |
| [`proofread-facts.md`](.github/copilot/skills/proofread-facts.md) | ファクトチェック | 統計データ、出典、技術的正確性 |
| [`proofread-structure.md`](.github/copilot/skills/proofread-structure.md) | 文書構造 | 見出しレベル、必須セクション |
| [`proofread-markdown.md`](.github/copilot/skills/proofread-markdown.md) | Markdown 記法 | リスト、強調、コードブロック、テーブル |

**スキル実行方法**:

PR コメントで自動実行（PR 作成時）：
```
PR #XXX が作成されると、5 つのスキルが自動実行され、
各スキルが独立した PR コメントを投稿
```

または手動実行：
```markdown
@github-copilot /proofread-japanese
@github-copilot /proofread-terms
@github-copilot /proofread-facts
```

**コメント例（コード補完時）**:
```typescript
// MASTER.md参照: TypeScript、型安全性必須、マジックナンバー禁止
// Phase 1 MVP機能: ユーザー認証システム
interface User {
  id: string;
  name: string;
  email: string;
}
```

**詳細**: [`.github/copilot/skills/README.md`](.github/copilot/skills/README.md) を参照

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
Before generating any code, you MUST read and understand docs-template/MASTER.md.

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
2. `docs-template/MASTER.md` を必ず読み込む
3. プロジェクト固有の要件を理解してから作業開始

## 作業フロー

### 1. プロジェクト開始時
```
1. AGENTS.md を確認
2. docs-template/MASTER.md を読み込む
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
   - `docs-template/08-knowledge/TROUBLESHOOTING.md`
   - `docs-template/08-knowledge/LESSONS_LEARNED.md`
   - `docs-template/08-knowledge/BEST_PRACTICES.md`
3. **チームメンバーに相談**
4. **問題をLESSONS_LEARNED.mdに記録**

## 更新履歴

| 日付 | 更新者 | 更新内容 |
|------|--------|----------|
| 2026-01-25 | Gemini | 言語設定（日本語固定）およびGemini Code Assist設定の追加 |


---

## � Book Writing Git Workflow

本の執筆タスクは、以下のGit Workflowに従って作業を行うこと。

### Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Issue作成 → 2. ブランチ作成 → 3. プラン作成                   │
│       ↓                                                          │
│  4. 実装 → 5. 自己レビュー → 6. PR作成                           │
│       ↓                                                          │
│  7. レビュー（/proofread自動実行）                                │
│       ↓                                                          │
│  8. 指摘対応 → 9. 再レビュー（ループ）                            │
│       ↓                                                          │
│  10. マージ可能 → ユーザー確認 → 11. マージ → 12. クリーンナップ   │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Process

#### 1. Issue作成
- タスクの内容を明確にしたIssueをGitHubに作成
- 適切なラベルを付与

#### 2. ブランチ作成
- Issue番号を含むブランチ名で作成
- 命名規則: `feature/#<issue番号>-<簡潔な説明>`
- 例: `feature/#42-add-chapter3-section`

#### 3. プラン作成
- 複雑なタスクの場合は `EnterPlanMode` でプランを作成
- ユーザー承認を得てから実装開始

#### 4. 実装
- 執筆・編集作業を実施
- 小さな単位でコミット

#### 5. 自己レビュー（Pre-commit）
- コミット前に内容を確認
- 明らかなミスを修正

#### 6. PR作成
- `/commit-push-pr` または個別コマンドでPR作成
- **※ PR作成後、hookにより自動的に校正レビューが促される**

#### 7. レビュー（文章校正）
- `/proofread` スキルを実行
- 日本語・構造・用語・Markdown・ファクトチェックを実施

#### 8. 指摘対応
- レビュー結果に基づき修正を実施
- 対応可能な指摘はすべて対応

#### 9. 再レビュー
- 修正完了後、再度 `/proofread` を実行
- 問題がなくなるまで 8-9 を繰り返す

#### 10. マージ確認
- すべての指摘に対応完了後、**必ずユーザーに確認を取る**
- 「マージしてよろしいですか？」と確認

#### 11. マージ
- ユーザー承認後にPRをマージ

#### 12. クリーンナップ
- `/clean_gone` でマージ済みブランチを削除
- developブランチに戻る

### Available Commands

| ステップ | 使用するスキル/コマンド |
|---------|----------------------|
| コミット | `/commit` |
| コミット→PR一括 | `/commit-push-pr` |
| 文章校正（総合） | `/proofread` |
| 構造チェック | `/proofread-structure` |
| ファクトチェック | `/proofread-facts` |
| 用語抽出 | `/extract-terms` |
| ブランチクリーンナップ | `/clean_gone` |

### Important Rules

1. **PRマージ前には必ずユーザー確認を取ること**
2. **レビュー指摘は可能な限りすべて対応すること**
3. **ブランチはマージ後に必ずクリーンナップすること**
4. **大きな変更は複数のPRに分割すること**

---

## 🎨 書籍「ai-small-is-accurate」挿絵ルール

### キャラクター使用ルール

本書籍の挿絵・図解には、以下の2キャラクターを使用すること。

**公式キャラクターデザイン**: `books/ai-small-is-accurate/images/characters.png` を参照

#### AI侍（あいさむらい）
- **役割**: 知識を授ける師匠キャラ
- **外見**:
  - ひげを生やした中年男性
  - グレー/ダークグレーの着物
  - 腰に刀を差している
  - 自信満々でニッコリした笑顔
  - ちびキャラ（2〜3頭身）スタイル
- **セリフ調**: 「〜である」「〜なのだ」「わしは〜」など武士言葉

#### DJ町娘（でぃーじぇーまちむすめ）
- **役割**: 読者代理、学ぶ側のキャラ
- **外見**:
  - 若い女性
  - オレンジ/金色の着物（花柄）
  - 白いヘッドフォン着用
  - かわいらしい笑顔、明るい表情
  - ちびキャラ（2〜3頭身）スタイル
- **セリフ調**: 「〜ですか？」「なるほど！」「〜ですね✨」など明るく素直

### 挿絵作成ガイドライン

#### キャラクター付き挿絵（シーン・比喩の説明）
1. **比喩やシーンの説明**: AI侍とDJ町娘を登場させる
2. **概念説明**: AI侍が解説、DJ町娘が質問や驚きのリアクション
3. **スタイル**: 公式デザインに準拠したちびキャラスタイル
4. **配色**: テックブルー背景 ＋ キャラクターの暖色

#### 図解・チャート（データ・グラフ）
1. **キャラクターは使わない**: シンプルなインフォグラフィック
2. **棒グラフ、折れ線、フローチャート等**: クリーンでプロフェッショナルなスタイル
3. **配色**: グリーン→ブルー→イエロー→オレンジ（良→悪のグラデーション）
4. **日本語ラベル**: タイトル、軸、注釈は日本語で

### 画像生成プロンプトの例

```text
Educational illustration with two chibi-style Japanese characters.

AI侍: Bearded middle-aged samurai in dark gray kimono with katana at waist,
confident smile, 2-3 head proportion chibi style.

DJ町娘: Young girl in orange/gold floral kimono with white headphones,
cheerful expression, 2-3 head proportion chibi style.

[場面の説明]

Style: Cute chibi anime style matching the reference design,
tech-blue background, warm character colors.
```

### 重要

**画像生成時は必ず以下の手順を踏むこと：**

1. **参照画像を渡して生成**: `books/ai-small-is-accurate/images/characters.png` をGemini APIに参照画像として渡す
2. **本文への差し込み**: 生成後、Markdownファイルに `![alt](./画像名.png)` で画像参照を追加
3. **コメントのプロンプトは削除**: 画像生成用コメント（`<!-- -->`）は実際の画像に置き換える

### 画像生成コード例

```python
import google.generativeai as genai

# 公式キャラクター画像を参照として渡す
character_image = genai.upload_file("books/ai-small-is-accurate/images/characters.png")

prompt = """Using the exact character designs from the reference image, create...
[場面の説明]
"""

response = model.generate_content([prompt, character_image])
```

---

## �📝 校正レビュー指示（Proofread Review Instructions）

本プロジェクトの書籍（日本語技術書）をレビューする際は、以下の観点でチェックしてください。

### 検査観点

1. **日本語表現**
   - 誤字脱字
   - 文法エラー
   - 読みやすさ（一文の長さ、難解な表現）
   - 敬体・常体の統一

2. **用語統一**
   - `books/ai-small-is-accurate/.proofreading/terminology.yaml` に定義された用語を使用しているか
   - 表記揺れがないか（例: 「AI」「人工知能」の混在）
   - 略語の初出時に正式名称があるか

3. **技術的正確性**
   - 事実誤認がないか
   - 出典が明記されているか（統計データ、研究論文）
   - 古い情報が含まれていないか

4. **章構造**
   - 必須セクション: 学習目標、チェックリスト、AI侍道場、次章橋渡し
   - 見出しレベルの整合性（h2 → h3 → h4）
   - 章番号とファイル名の一致

### 出力形式

レビュー結果は以下の形式で出力してください：

```markdown
## 校正レビュー結果

### サマリー
- 対象ファイル: [ファイル名]
- 🔴 重大: X件（修正必須）
- 🟡 警告: Y件（修正推奨）
- 🔵 提案: Z件（改善案）

### 🔴 重大な問題

1. **[行番号]** [カテゴリ]: [問題の説明]
   - 現在: 「[現在の記述]」
   - 推奨: 「[推奨する修正]」
   - 理由: [修正が必要な理由]

### 🟡 警告

...

### 🔵 改善提案

...
```

### 重要度の基準

| 重要度 | 基準 | 例 |
|--------|------|-----|
| 🔴 重大 | 内容の誤り、読者の誤解を招く | 誤字による意味変化、出典なしの統計データ |
| 🟡 警告 | 品質低下、一貫性の欠如 | 用語の不統一、構造の逸脱 |
| 🔵 提案 | より良くできる点 | 表現の改善、冗長な記述の削除 |

---

**重要**: この文書は、すべてのAIエージェントが一貫性のある高品質なコードを生成するためのガイドです。必ずMASTER.mdと併せて参照してください。
