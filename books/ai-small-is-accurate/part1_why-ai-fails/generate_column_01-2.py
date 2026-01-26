#!/usr/bin/env python3
"""
Column 01-2: 隠れたコストの氷山理論

このスクリプトは、第1-2章のコラム画像を生成します。
氷山の比喩を使い、「見える時間コスト（1割）」と「見えない隠れたコスト（9割）」を視覚化します。

使用モデル: Nano Banana Pro (gemini-3-pro-image-preview)
出力形式: 21:9 アスペクト比、2K解像度、3168x1344px
"""

from google import genai
from google.genai import types
from PIL import Image
import os

# APIキーの設定
api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    raise ValueError("環境変数 GEMINI_API_KEY が設定されていません")

client = genai.Client(api_key=api_key)

# 参照画像のパス（リポジトリルートからの相対パス）
ref_image_path = "/Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development/books/ai-small-is-accurate/images/characters.png"
character_image = Image.open(ref_image_path)

# プロンプト（英語で記述）
# 氷山の比喩：水面上（1割、時間コスト）vs 水面下（9割、認知・機会・チームコスト）
prompt = """Using the exact character designs from the reference image, create a chibi-style educational infographic.

Characters:
- AI Samurai (AI侍): Bearded middle-aged man in dark gray kimono with katana, confident wise expression.
- DJ Machimusume (DJ町娘): Young girl in orange/gold floral kimono with white headphones, surprised/enlightened expression.

Scene Description:
Create an iceberg diagram illustrating "Hidden Costs Theory":

COMPOSITION:
- Left side: AI Samurai explaining with raised finger, serious expression
- Center: Large iceberg diagram (60% of space)
- Right side: DJ Machimusume looking shocked/surprised

ICEBERG STRUCTURE:
**Above Water (10%):**
- Small visible portion labeled "時間コスト" (Time Cost) in large font
- Light blue/white ice color
- Small, representing only tip

**Below Water (90%):**
- Large underwater portion (3 layers, stacked):
  1. "認知コスト" (Cognitive Cost) - light purple layer
  2. "機会コスト" (Opportunity Cost) - light orange layer  
  3. "チームコスト" (Team Cost) - light pink layer
- Each layer clearly labeled with Japanese text
- Darker blue water around it
- Much larger than above-water portion

STYLE REQUIREMENTS:
- Cute chibi anime style (2-3 heads tall)
- Tech-blue ocean background (#1E3A5F)
- Warm character colors
- Clear Japanese labels in readable font
- Educational infographic aesthetic
- 21:9 aspect ratio for wide layout
- Characters positioned to frame the diagram

LIGHTING:
- Soft light above water
- Darker gradient below water to emphasize hidden nature

Japanese text to include:
- "時間コスト（見える1割）" above water
- "認知コスト" (top underwater layer)
- "機会コスト" (middle underwater layer)
- "チームコスト" (bottom underwater layer)
- Small note: "隠れたコスト（9割）" near underwater section
"""

print("生成プロンプト:")
print(f"{prompt[:200]}...")
print("\n画像生成を開始します（Nano Banana Pro使用、2K解像度）...\n")

# 画像生成実行
response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[prompt, character_image],
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],
        image_config=types.ImageConfig(
            aspect_ratio="21:9",
            image_size="2K"  # 2K: ~2048x2048 base, adjusted for 21:9 → 3168x1344px
        ),
    )
)

# 画像保存
output_filename = "images/column_01-2_iceberg.png"
os.makedirs("images", exist_ok=True)

if response.candidates and len(response.candidates) > 0:
    candidate = response.candidates[0]
    
    # 画像パートを探す
    image_saved = False
    for part in candidate.content.parts:
        if part.inline_data and part.inline_data.mime_type.startswith('image/'):
            # 画像データを保存
            image_data = part.inline_data.data
            with open(output_filename, 'wb') as f:
                f.write(image_data)
            
            # ファイルサイズを確認
            file_size = os.path.getsize(output_filename)
            print(f"✅ 画像を保存しました: {output_filename}")
            print(f"   ファイルサイズ: {file_size / 1024 / 1024:.2f} MB")
            
            # 画像の解像度を確認
            with Image.open(output_filename) as img:
                print(f"   解像度: {img.width}x{img.height}px")
                print(f"   アスペクト比: {img.width/img.height:.2f}:1")
            
            image_saved = True
            break
    
    if not image_saved:
        print("❌ 画像パートが見つかりませんでした")
        print(f"レスポンス内容: {response}")
else:
    print("❌ 画像生成に失敗しました")
    print(f"レスポンス: {response}")

print("\n完了！")
