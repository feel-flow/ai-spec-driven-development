#!/usr/bin/env python3
"""
第1-1章コラム用の2コマ漫画生成スクリプト

AI侍とDJ町娘が登場する2コマ漫画を生成します：
- コマ1: 70%問題（DJ町娘が困る）
- コマ2: Lost in the Middle（懐中電灯の比喩）

使用モデル: Nano Banana Pro (gemini-3-pro-image-preview)
"""

import os
import sys
from google import genai
from google.genai import types
from PIL import Image

def main():
    # APIキーの確認
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print("❌ エラー: GEMINI_API_KEY 環境変数が設定されていません")
        sys.exit(1)
    
    # Gemini Client初期化
    client = genai.Client(api_key=api_key)
    
    # 参照画像のパス（リポジトリルートからの相対パス）
    ref_image_path = "books/ai-small-is-accurate/images/characters.png"
    
    if not os.path.exists(ref_image_path):
        print(f"❌ エラー: 参照画像が見つかりません: {ref_image_path}")
        sys.exit(1)
    
    print(f"📁 参照画像を読み込み中: {ref_image_path}")
    character_image = Image.open(ref_image_path)
    
    # プロンプト（映画の黄金律インフォグラフィック）
    prompt = """
Create an educational infographic-style illustration with chibi characters explaining "The Movie Golden Rule for AI Prompts".

Reference: Use the exact character designs from the uploaded reference image.
- AI Samurai: Bearded middle-aged man, dark gray kimono, katana, confident and wise expression
- DJ Machimusume: Young girl, orange/gold kimono, white headphones, curious and expressive

Layout (Horizontal, 21:9 aspect ratio):

LEFT SECTION - "The Question":
- DJ Machimusume looking frustrated/confused
- Speech bubble: "なんで真ん中だけ見落とすの？"
- Small icon: question mark

CENTER SECTION - "Movie Structure Diagram":
- Film strip visual showing 3 acts:
  1. OPENING (bright): "観客を掴む" with strong visual (explosion/impact icon)
  2. MIDDLE (dimmed/faded): "伏線" with faded elements
  3. ENDING (bright): "感動を残す" with heart/star icon
- Visual: movie reel or cinema screen frame
- Japanese text labels for each section

RIGHT SECTION - "The Golden Rule":
- AI Samurai pointing to the diagram with teaching gesture
- Speech bubble: "映画と同じじゃ！"
- Key points in clean boxes:
  • 冒頭: 明確な指示
  • 中盤: 70%
  • ラスト: 締めの指示
- Small cinema/movie icon (🎬)

Overall Style:
- Clean infographic aesthetic
- Tech-blue background (#1E3A5F)
- Cute chibi anime style (2-3 heads tall)
- Professional educational material
- Clear visual hierarchy
- Minimal but engaging
- Japanese text integrated naturally
- 21:9 wide format for reading flow
"""
    
    print("🎨 Nano Banana Pro (gemini-3-pro-image-preview) で画像生成中...")
    print(f"プロンプト:\n{prompt}\n")
    
    try:
        # 画像生成実行（Nano Banana Pro）
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[prompt, character_image],
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE'],
                image_config=types.ImageConfig(
                    aspect_ratio="21:9",  # 2コマ漫画用のワイド比率
                    image_size="2K"  # 高品質
                ),
            )
        )
        
        # 出力ファイル名
        output_dir = "books/ai-small-is-accurate/part1_why-ai-fails/images"
        os.makedirs(output_dir, exist_ok=True)
        output_filename = f"{output_dir}/column_01-1_movie.png"
        
        # 画像保存
        image_saved = False
        for part in response.parts:
            if part.text is not None:
                print(f"📝 モデルの説明: {part.text}")
            elif hasattr(part, 'as_image') and callable(part.as_image):
                image = part.as_image()
                image.save(output_filename)
                print(f"✅ 画像を保存しました: {output_filename}")
                image_saved = True
        
        if not image_saved:
            print("❌ レスポンスに画像データが含まれていません")
            print(f"レスポンス: {response}")
            sys.exit(1)
        if not image_saved:
            print("❌ レスポンスに画像データが含まれていません")
            print(f"レスポンス: {response}")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
