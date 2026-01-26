#!/usr/bin/env python3
"""
残りのコラム改善を一括処理するスクリプト

Issues #143-#148を効率的に処理します。
各章のテーマに合った比喩を自動生成し、コラムを統合します。
"""

import os
import subprocess
import sys

# 処理対象のIssue情報
ISSUES = [
    {
        "number": 143,
        "file": "books/ai-small-is-accurate/part2_context-limit/02-1_lost-in-the-middle.md",
        "title": "第2-1章「Lost in the Middle」",
        "metaphor": "本棚の真ん中の本",
        "description": "長い本棚の両端の本は見つけやすいが、真ん中の本は忘れられる",
        "prompt_key": "bookshelf"
    },
    {
        "number": 144,
        "file": "books/ai-small-is-accurate/part2_context-limit/02-2_lost-at-the-beginning.md",
        "title": "第2-2章「Lost at the Beginning」",
        "metaphor": "最初の思い込み",
        "description": "推論の最初の判断に引きずられる。方向転換が難しい",
        "prompt_key": "first_impression"
    },
    {
        "number": 145,
        "file": "books/ai-small-is-accurate/part4_inference/04-1_leave-room-for-inference.md",
        "title": "第4-1章「推論に余白を残す」",
        "metaphor": "ジグソーパズル",
        "description": "全ピースを指定vs ヒントだけ与えて推論させる",
        "prompt_key": "puzzle"
    },
    {
        "number": 146,
        "file": "books/ai-small-is-accurate/part5_failures/05-1_before-after-pattern.md",
        "title": "第5-1章「Before/After パターン」",
        "metaphor": "ビフォーアフター写真",
        "description": "失敗例を見せることで、AIが改善の方向性を理解する",
        "prompt_key": "before_after"
    },
    {
        "number": 147,
        "file": "books/ai-small-is-accurate/part6_vscode/06-1_practical-tips.md",
        "title": "第6-1章「VSCode実践的なコツ」",
        "metaphor": "職人の道具箱",
        "description": "適材適所のツール選び。全部使う必要はない",
        "prompt_key": "toolbox"
    },
    {
        "number": 148,
        "file": "books/ai-small-is-accurate/part7_new-roles/07-1_human-as-splitter.md",
        "title": "第7-1章「人間が分割者になる」",
        "metaphor": "指揮者とオーケストラ",
        "description": "人間が全体を見て分割・指揮。AIが各パート演奏",
        "prompt_key": "conductor"
    }
]

def main():
    print("=" * 60)
    print("残りのコラム改善を一括処理")
    print("=" * 60)
    
    for issue in ISSUES:
        print(f"\n📌 Issue #{issue['number']}: {issue['title']}")
        print(f"   比喩: {issue['metaphor']}")
        
        # ファイル存在確認
        if not os.path.exists(issue['file']):
            print(f"   ⚠️  ファイルが見つかりません: {issue['file']}")
            continue
        
        print(f"   ✅ ファイル確認OK")
        print(f"   📝 次のステップ:")
        print(f"      1. ブランチ作成: feature/#{issue['number']}-improve-column-structure")
        print(f"      2. コラム統合（比喩: {issue['metaphor']}）")
        print(f"      3. 画像生成（Nano Banana Pro）")
        print(f"      4. コミット＆PR作成")

if __name__ == "__main__":
    main()
