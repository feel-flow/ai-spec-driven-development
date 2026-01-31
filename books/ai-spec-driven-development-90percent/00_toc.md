# 目次

## AI仕様駆動開発

**AIエージェント開発の新常識**

---

## はじめに

- 「AIに任せる開発なんて無理」の正体
- 生成AIは"自律"ではなく"条件反射"
- この本で約束すること

→ [00_preface.md](./00_preface.md)

---

## 第1部　なぜ「AI任せ」は失敗するのか（そして、なぜ誤解なのか）

### 第1章　AIに全部任せようとして事故る典型パターン

- "vibe coding"が破綻する瞬間
- PRが巨大化する／レビュー不能になる／仕様が消える
- 「AIが賢くない」のではなく「入力が仕様になっていない」

→ [part1_why-ai-fails/01_typical-failure-patterns.md](./part1_why-ai-fails/01_typical-failure-patterns.md)

### 第2章　AIが苦手なのは"コーディング"ではなく"心を読むこと"

- LLMが強い領域：既知パターンの組み立て
- LLMが弱い領域：未記述要件の補完
- 解法：仮定を排除して、仕様を"書いてから"渡す

→ [part1_why-ai-fails/02_ai-weakness.md](./part1_why-ai-fails/02_ai-weakness.md)

---

## 第2部　結論：AIに任せる開発は「仕様」が9割

### 第3章　仕様を"生きた成果物"にする

- 仕様＝合意の置き場所
- 変更は「差分」ではなく「影響度」で扱う
- "仕様→設計→テスト→運用"の連鎖を切らない

→ [part2_spec-is-90percent/03_living-spec.md](./part2_spec-is-90percent/03_living-spec.md)

### 第4章　7文書が「AI任せ」を成立させる最小構成

- 7文書の全体像
- MASTER.md / PROJECT.md / ARCHITECTURE.md
- DOMAIN.md / PATTERNS.md / TESTING.md / DEPLOYMENT.md

→ [part2_spec-is-90percent/04_seven-documents.md](./part2_spec-is-90percent/04_seven-documents.md)

### 第5章　「7文書」を回すための最低限のルール

- Frontmatterでメタデータを揃える
- 変更時は影響度評価→バージョン更新→Changelogまで一気通貫
- コミット前に検証チェック

→ [part2_spec-is-90percent/05_minimum-rules.md](./part2_spec-is-90percent/05_minimum-rules.md)

### 第6章　文書追加の意思決定（Decision Matrix）

- 「PROJECT？DOMAIN？ARCHITECTURE？」の判断
- 例：DB設計、認証、権限、監査ログ、SLO
- MASTER.mdの索引更新を必須タスクに

→ [part2_spec-is-90percent/06_decision-matrix.md](./part2_spec-is-90percent/06_decision-matrix.md)

### 第7章　変更に強い運用：影響度評価で手戻りを消す

- 変更の種類：文言修正／概念追加／概念再定義
- HIGH変更のチェックリスト
- 仕様変更→AI再実装を"安全に繰り返す"設計

→ [part2_spec-is-90percent/07_change-impact.md](./part2_spec-is-90percent/07_change-impact.md)

---

## 第3部　実践：AI仕様駆動開発のワークフロー

### 第8章　導入手順：既存プロジェクト／新規プロジェクト

- 新規：docs構造を作り、最初の7文書を生成
- 既存：既存設計を"吸い上げ"て、欠けた文書を補完
- 「最初から完璧」を捨てる

→ [part3_practice/08_introduction.md](./part3_practice/08_introduction.md)

### 第9章　プロトタイピング：仕様を書く前に"動くもの"で確かめる

- PoCと本実装の違い——何を検証し、何を捨てるか
- AIで素早くプロトタイプを作るアプローチ
- PoCから仕様に落とすタイミングと方法
- 失敗したPoCの正しい扱い方

→ [part3_practice/09_prototyping.md](./part3_practice/09_prototyping.md)

### 第10章　日々の開発フロー：AIに"タスク"を渡す前にやること

- 仕様の粒度：受け入れ基準が書けているか
- 設計の粒度：アーキテクチャ制約が明示されているか
- テストの粒度：テストが仕様を代替していないか

→ [part3_practice/10_daily-workflow.md](./part3_practice/10_daily-workflow.md)

### 第11章　ツール実装（前編）：Claude Code Skillsで"仕様駆動"を自動化する

- Claude Code Skillsの考え方と設計方法
- 仕様駆動を支援するスキル例（5種）
- pr-review-toolkit（公式プラグイン）

→ [part3_practice/11_claude-code-skills.md](./part3_practice/11_claude-code-skills.md)

### 第12章　ツール実装（後編）：GitHub Copilot Agentsで"仕様駆動"を自動化する

- GitHub Copilot Agentsの仕組みと4つのタイプ
- 仕様駆動開発向けエージェント（6種のテンプレート）
- Claude Code vs GitHub Copilot 比較

→ [part3_practice/12_copilot-agents.md](./part3_practice/12_copilot-agents.md)

---

## 第4部　現場で揉めるポイントへの回答

### 第13章　「それ、結局エンジニアが全部書くのでは？」への答え

- 役割分担の再設計
- "書く"ではなく"編集する"に寄せる

→ [part4_faq/13_engineer-role.md](./part4_faq/13_engineer-role.md)

### 第14章　品質・セキュリティ・責任の所在

- 「AIが書いたコード」の責任
- テスト戦略を先に固める意味
- 監査可能性

→ [part4_faq/14_quality-security.md](./part4_faq/14_quality-security.md)

---

## 第5部　組織に展開する

### 第15章　チーム標準化：レビューの中心を「コード」から「仕様」へ

- 仕様レビュー→タスク→実装レビューの順番
- 「MASTERが更新されていないPRは受け付けない」ルール

→ [part5_organization/15_team-standardization.md](./part5_organization/15_team-standardization.md)

### 第16章　ロードマップとナレッジ蓄積

- 成長フェーズで増やす文書
- "知見"をAIに食わせられる形で残す

→ [part5_organization/16_roadmap-knowledge.md](./part5_organization/16_roadmap-knowledge.md)

---

## おわりに

- AIに任せるために必要なのは「仕様というOS」
- 次にやること

→ [99_afterword.md](./99_afterword.md)

---

## 付録

### 付録：AIエージェント設定ファイル一覧

- AGENTS.mdとは（オープンスタンダード）
- ツール別設定ファイル（Claude Code, GitHub Copilot, Cursor等）
- 7文書との連携テンプレート

→ [appendix_agent-config.md](./appendix_agent-config.md)
