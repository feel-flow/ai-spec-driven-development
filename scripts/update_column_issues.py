#!/usr/bin/env python3
"""
コラム改善Issueを一括更新するスクリプト

Issue #139の成功パターンに基づいて、他のコラムIssue (#140-148) を更新します。
"""

import subprocess
import json

# 更新対象のIssue番号リスト
ISSUES = [140, 141, 142, 143, 144, 145, 146, 147, 148]

# 新しいIssue本文テンプレート
ISSUE_BODY_TEMPLATE = """## 📝 改善内容

書籍「なぜあの人のAIは優秀なのか」のコラムを改善します。

### 🎯 改善方針（Issue #139 成功パターン）

**Issue #139で実証された効果的なアプローチ:**
1. ✅ 3つの冗長なセクションを**1つのコラム**に統合
2. ✅ 本文にない**新しい比喩・視点**を追加（例: 映画の黄金律）
3. ✅ AI侍とDJ町娘の**対話形式**で面白く解説
4. ✅ **Nano Banana Pro** でインフォグラフィック生成
5. ✅ 背景色付きボックスデザイン

**成果:** コンテンツ64%削減、読みやすさ向上、ビジュアル追加

---

### 📋 チェックリスト

#### 1. プラン作成
- [ ] 本章のテーマに合った新しい比喩を考案
- [ ] AI侍とDJ町娘の対話シナリオ作成
- [ ] インフォグラフィックのビジュアル構成を設計

#### 2. 実装
- [ ] 3つのセクションを1つのコラムに統合
- [ ] 対話形式で読者が共感しやすい内容に
- [ ] Nano Banana Pro で画像生成（21:9、2K品質）
- [ ] .column-box で背景色付きボックス実装

#### 3. 校正・PR
- [ ] /proofread 実行（日本語、用語、facts、構造、Markdown）
- [ ] PR作成・レビュー・マージ
- [ ] ブランチクリーンナップ

---

### 🎨 コラムデザイン仕様

```css
.column-box {
  background-color: #f0f4f8;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #1E3A5F;
}
```

---

### 📚 参考リソース
- ✅ 成功事例: Issue #139, PR #150
- 📖 キャラクターデザイン: `books/ai-small-is-accurate/images/characters.png`
- 🎨 スタイル: `books/ai-small-is-accurate/epub-style.css`
- 🤖 スクリプト例: `books/ai-small-is-accurate/part1_why-ai-fails/generate_column_01-1.py`
"""

def update_issue(issue_number):
    """指定されたIssueを更新する"""
    try:
        # gh issue edit コマンドを実行
        result = subprocess.run(
            ['gh', 'issue', 'edit', str(issue_number), '--body', ISSUE_BODY_TEMPLATE],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✅ Issue #{issue_number} を更新しました")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Issue #{issue_number} の更新に失敗: {e.stderr}")
        return False

def main():
    """メイン処理"""
    print("📝 コラム改善Issueを一括更新します...\n")
    
    success_count = 0
    fail_count = 0
    
    for issue_num in ISSUES:
        if update_issue(issue_num):
            success_count += 1
        else:
            fail_count += 1
    
    print(f"\n{'='*50}")
    print(f"完了: {success_count}件成功, {fail_count}件失敗")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()
