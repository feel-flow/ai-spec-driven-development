# 目次

## なぜAIは期待通りに動かないのか
**小さく、でも余白を残して**

---

## はじめに
- 「AIに頼んだのに、なんか微妙」の正体
- 本書のアプローチ：コンテキスト縮小戦略
- 精度と推論のバランス

→ [00_preface.md](./00_preface.md)

---

## 第1部　なぜAIは期待通りに動かないのか？

### 第1章　70%問題──「全部やって」が生む微妙さ
- ChatGPTでも、Claudeでも、画像生成でも同じ現象
- みんなが経験してる「なんか微妙」問題
- 大きなお願いほど曖昧になる理由

→ [part1_why-ai-fails/01_the-seventy-percent-problem.md](./part1_why-ai-fails/01_the-seventy-percent-problem.md)

---

## 第2部　AIの「見える範囲」には限界がある

### 第2章　Lost in the Middle──中間を忘れるAI
- 論文「Lost in the Middle」が示した事実
- LLMは「最初」と「最後」を覚えている
- コンテキストが長いほど、中間は忘れやすい
- 小さく分ける＝中間がない＝全部覚える

→ [part2_context-limit/02_lost-in-the-middle.md](./part2_context-limit/02_lost-in-the-middle.md)

---

## 第3部　細かく指示する──精度を上げる

### 第3章　分けて渡す──スコープ収束パターン
- 一度に全部求めない
- 小さな成功を積み重ねる
- 二段階AI活用：AIにツールを作らせる
- 検証可能な形で出力させる

→ [part3_precision/03_divide-and-conquer.md](./part3_precision/03_divide-and-conquer.md)

---

## 第4部　曖昧にする──推論を引き出す

### 第4章　余白を残す──推論の力を借りる
- 細かすぎると推論の邪魔をする
- 「〜と思うけど、どう思う？」の威力
- 実行させたい時は具体的に、考えさせたい時は曖昧に
- 壁打ち相手としてのAI活用

→ [part4_inference/04_leave-room-for-thinking.md](./part4_inference/04_leave-room-for-thinking.md)

---

## 第5部　よくある失敗とその対処法

### 第5章　Before/After──失敗パターンと解決策
- パターン1：全部一度に頼む → 分けて頼む
- パターン2：曖昧なまま大きく頼む → 要素を分けて具体的に
- パターン3：AIに直接判断させる → 検証可能な形で出力させる
- パターン4：修正を一度に全部頼む → 1つずつ確認しながら

→ [part5_failures/05_before-after-patterns.md](./part5_failures/05_before-after-patterns.md)

---

## 第6部　VSCodeでの実践

### 第6章　ファイル分割の技術──AIが見える範囲を設計する
- ファイル分割の考え方
- どう分けるか、どう渡すか
- この本の壁打ち例（メタな紹介）

→ [part6_vscode/06_practical-tips.md](./part6_vscode/06_practical-tips.md)

---

## 第7部　AIと人間の新しい役割分担

### 第7章　人間の仕事は「分けること」になる
- AIは「小さいことを正確に」
- 組み合わせで大きな成果を出す
- 姉妹編「AIエージェント開発は仕様が9割」への橋渡し

→ [part7_new-roles/07_human-as-divider.md](./part7_new-roles/07_human-as-divider.md)

---

## おわりに
- 小さく、でも余白を残して
- 次にやること

→ [99_afterword.md](./99_afterword.md)
