#!/usr/bin/env python3
"""
Column 03-1: 積み木タワーの法則

このスクリプトは、第3-1章のコラム画像を生成します。
積み木の比喩を使い、「大きな積み木（70%で倒れる）」vs「小さな積み木（各段階98%安定）」を視覚化します。

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
# 積み木タワーの比喩：大きな積み木（不安定、70%で倒れる）vs 小さな積み木（安定、各段階確認）
prompt = """Using the exact character designs from the reference image, create a chibi-style educational infographic.

Characters:
- AI Samurai (AI侍): Bearded middle-aged man in dark gray kimono with katana, pointing/explaining with confident expression.
- DJ Machimusume (DJ町娘): Young girl in orange/gold floral kimono with white headphones, surprised/understanding expression.

Scene Description:
Create a comparison showing "Building Block Tower Theory":

COMPOSITION:
- Left side (❌ Bad Example): 
  - Large unstable building blocks stacked carelessly
  - Tower is 70% height but wobbly/collapsing
  - AI Samurai shaking head with disapproval
  - Label: "大きな積み木（70%で倒れる）"
  
- Right side (✅ Good Example):
  - Small building blocks stacked carefully, one by one
  - Tower is taller and stable (98% at each level)
  - DJ Machimusume placing block carefully with smile
  - Checkmarks (✓) at each stable layer
  - Label: "小さな積み木（各段階98%安定）"

CENTER:
- Large vs symbol or arrow between two examples
- Emphasis on "one by one" approach on right side

STYLE REQUIREMENTS:
- Cute chibi anime style (2-3 heads tall)
- Tech-blue background (#1E3A5F)
- Warm character colors
- Clear visual contrast between unstable (left) and stable (right)
- Building blocks in different colors (rainbow gradient)
- Educational infographic aesthetic
- 21:9 aspect ratio for wide layout

VISUAL EMPHASIS:
- Left tower: Tilted, about to fall, red warning signs
- Right tower: Straight, stable, green checkmarks at each level
- Show process of "step by step" verification on right side

Japanese text to include:
- Left: "大きな積み木（70%で倒れる）"
- Right: "小さな積み木（各段階98%安定）"
- Center: "VS" or "→"
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
            image_size="2K"
        ),
    )
)

# 画像保存
output_filename = "images/column_03-1_blocks.png"
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
