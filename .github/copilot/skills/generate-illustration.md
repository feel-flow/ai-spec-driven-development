---
name: github-copilot-generate-illustration
description: 挿絵・図解を生成するための Python コードを作成するスキル
scope: image-generation-code
agent: github-copilot
triggers:
  - "画像生成コード"
  - "イラストを作りたい"
  - "挿絵のコード"
  - "4コマ漫画の画像"
---

# GitHub Copilot 画像生成コード作成スキル

## 役割

本書「ai-small-is-accurate」の挿絵コンベンションに従い、Google Gemini API を使用して画像を生成するための **Python スクリプト** を作成します。

## 対応する画像タイプ

### 1. キャラクター付きイラスト（AI侍道場・4コマ漫画）

「AI侍」と「DJ町娘」が登場するシーンや、AI侍道場の4コマ漫画用画像。

**必須条件:**
- 参照画像 `books/ai-small-is-accurate/images/characters.png` を使用するコードを含める
- キャラクターの特徴（Prompt）を正確に記述する

### 2. 図解・インフォグラフィック

キャラクターが登場しない、概念図やチャート。

**必須条件:**
- 配色ガイドライン（テックブルー背景、緑/赤の対比）に従う Prompt を記述する

## 配色ガイドライン（Prompt に反映）

| 用途 | 色 | コード |
| --- | --- | --- |
| 背景 | テックブルー | #1E3A5F |
| Positive | グリーン | #38A169 |
| Negative | レッド | #E53E3E |

## 出力するコードのテンプレート

### 1. 単発画像生成（通常）

ユーザーが「ここ（4コマ目）の画像を作りたい」と言った場合、以下のコードを生成します。

```python
import google.generativeai as genai
import os

# APIキーの設定（環境変数）
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

# モデル選択（プレビュー版推奨）
model = genai.GenerativeModel('gemini-1.5-pro')

# 参照画像のパス（リポジトリルートからの相対パス）
ref_image_path = "books/ai-small-is-accurate/images/characters.png"
character_image = genai.upload_file(ref_image_path)

# プロンプト（英語で記述）
# [ポイント]: AI侍とDJ町娘の特徴、ちびキャラ、シーンの詳細を含める
prompt = """
Using the exact character designs from the reference image, create a chibi-style illustration.

Characters:
- AI Samurai: Bearded middle-aged man in dark gray kimono with katana, confident smile.
- DJ Machimusume: Young girl in orange/gold floral kimono with white headphones, cheerful.

Scene Description:
[ここに文脈に基づいたシーン説明を挿入]
(例: DJ Machimusume asking a question about "Dialogue", AI Samurai explaining with a fan.)

Style:
- Cute chibi anime style (2-3 heads tall)
- Tech-blue background (#1E3A5F)
- Warm character colors
- 16:9 aspect ratio
"""

print(f"Generating image for: {prompt}")

# 画像生成実行
response = model.generate_content([prompt, character_image])

# 画像保存
output_filename = "[文脈に合わせたファイル名].png"
if response.parts:
    image = response.parts[0].image
    image.save(output_filename)
    print(f"Saved to {output_filename}")
else:
    print("No image generated.")
```

### 2. 4コマ漫画用一括生成テンプレート

ユーザーが「4コマ漫画の画像をまとめて作りたい」「このセクションの画像を全部作って」と言った場合、以下のループ処理を含むコードを生成します。

```python
import google.generativeai as genai
import os
import time

# APIキーの設定
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-pro')

# 参照画像の準備
ref_image_path = "books/ai-small-is-accurate/images/characters.png"
character_image = genai.upload_file(ref_image_path)

# プロンプトの共通部分
base_prompt = """
Using the exact character designs from the reference image, create a chibi-style illustration.

Characters:
- AI Samurai: Bearded middle-aged man in dark gray kimono with katana, confident smile.
- DJ Machimusume: Young girl in orange/gold floral kimono with white headphones, cheerful.

Style:
- Cute chibi anime style (2-3 heads tall)
- Tech-blue background (#1E3A5F)
- Warm character colors
- 16:9 aspect ratio

Scene Description:
"""

# 各コマの定義（文脈に合わせてCopilotが生成）
panels = [
    {
        "filename": "panel_01_intro.png",
        "scene": "DJ Machimusume looking puzzled with a question mark, holding a book. AI Samurai looks on kindly."
    },
    {
        "filename": "panel_02_teaching.png",
        "scene": "AI Samurai explaining with a fan raised. DJ Machimusume has a lightbulb moment (realization)."
    },
    {
        "filename": "panel_03_twist.png",
        "scene": "Both characters looking surprised or facing a new challenge. Comical expression."
    },
    {
        "filename": "panel_04_conclusion.png",
        "scene": "Both characters smiling directly at the camera, giving a thumbs up. Happy conclusion."
    }
]

# 一括生成ループ
for panel in panels:
    print(f"Generating {panel['filename']}...")
    full_prompt = base_prompt + panel['scene']
    
    try:
        response = model.generate_content([full_prompt, character_image])
        
        if response.parts:
            image = response.parts[0].image
            image.save(panel['filename'])
            print(f"✅ Saved to {panel['filename']}")
        else:
            print(f"❌ Failed to generate {panel['filename']}")
            
    except Exception as e:
        print(f"❌ Error generating {panel['filename']}: {e}")
    
    # APIレート制限への配慮
    time.sleep(2)
```

## 使用例

**ユーザー**: 「この4コマ目のセリフに合う画像生成コードを作って」

**Copilot**: 
上記のテンプレートを使用し、`Scene Description` に4コマ目の内容（例：「DJ町娘が納得して目を輝かせているシーン」）を英語で記述したコードを提示する。

## 注意事項

- 直接画像を生成するのではなく、**実行可能な Python コード** を提供する
- 常に `books/ai-small-is-accurate/images/characters.png` を参照画像として含める
- 4コマ漫画の場合は、コマごとの状況を Prompt に反映する
