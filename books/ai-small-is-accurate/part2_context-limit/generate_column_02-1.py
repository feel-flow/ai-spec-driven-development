#!/usr/bin/env python3
"""
Column 02-1: 本棚の真ん中の本

Lost in the Middle現象を視覚化します。
"""

from google import genai
from google.genai import types
from PIL import Image
import os

api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    raise ValueError("環境変数 GEMINI_API_KEY が設定されていません")

client = genai.Client(api_key=api_key)
ref_image_path = "/Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development/books/ai-small-is-accurate/images/characters.png"
character_image = Image.open(ref_image_path)

prompt = """Using the exact character designs from the reference image, create a chibi-style educational infographic.

Characters:
- AI Samurai: Explaining with confident expression
- DJ Machimusume: Understanding expression

Scene: Long bookshelf comparison showing "Lost in the Middle"

LEFT SIDE (❌ Problem):
- Long bookshelf with many books
- Books on both ends are highlighted/glowing
- Middle books are faded/forgotten
- Question marks (?) over middle section
- Label: "長い入力（真ん中が忘れられる）"

RIGHT SIDE (✅ Solution):
- Three short bookshelves side by side
- All books clearly visible and highlighted
- Checkmarks (✓) on all books
- Label: "小さく分割（全部が『端』になる）"

STYLE:
- Cute chibi anime style (2-3 heads tall)
- Tech-blue background (#1E3A5F)
- 21:9 aspect ratio, 2K resolution

Japanese text:
- Left: "長い入力（真ん中が忘れられる）❌"
- Right: "小さく分割（全部が『端』）✓"
"""

print("生成中...")
response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[prompt, character_image],
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],
        image_config=types.ImageConfig(aspect_ratio="21:9", image_size="2K"),
    )
)

output_filename = "images/column_02-1_bookshelf.png"
os.makedirs("images", exist_ok=True)

if response.candidates and len(response.candidates) > 0:
    for part in response.candidates[0].content.parts:
        if part.inline_data and part.inline_data.mime_type.startswith('image/'):
            with open(output_filename, 'wb') as f:
                f.write(part.inline_data.data)
            file_size = os.path.getsize(output_filename)
            print(f"✅ {output_filename} ({file_size / 1024 / 1024:.2f} MB)")
            with Image.open(output_filename) as img:
                print(f"   {img.width}x{img.height}px")
            break
