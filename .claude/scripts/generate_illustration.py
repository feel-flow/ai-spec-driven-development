#!/usr/bin/env python3
"""Generate illustrations for ai-small-is-accurate book.

Usage:
    python3 generate_illustration.py character "プロンプト" -o output.png
    python3 generate_illustration.py diagram "プロンプト" -o output.png
"""

import argparse
import os
import sys
from pathlib import Path

from google import genai
from google.genai import types

# プロジェクト固有のパス
PROJECT_ROOT = Path(__file__).parent.parent.parent
CHARACTER_IMAGE = PROJECT_ROOT / "books/ai-small-is-accurate/images/characters.png"

# モデル設定
MODEL_NAME = "gemini-3-pro-image-preview"

# キャラクター説明（プロンプトに追加）
CHARACTER_DESCRIPTION = """
The reference image shows two chibi characters (2-3 head proportion):
- AI Samurai (left): Bearded middle-aged man with big smile, dark gray kimono, katana on back
- DJ Town Girl (right): Young girl with brown hair, white headphones, orange/gold floral kimono, cheerful expression

IMPORTANT: Match these exact character designs from the reference image.
"""

# 配色ガイドライン
COLOR_GUIDELINES = """
Color scheme:
- Background: Tech blue (#1E3A5F to #2C5282)
- Positive/Good: Green (#38A169)
- Negative/Bad: Red/Orange (#E53E3E)
- Neutral: Yellow (#ECC94B)
- Accent: Orange (#ED8936)
"""


def get_client() -> genai.Client:
    """Gemini APIクライアントを取得"""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY or GOOGLE_API_KEY environment variable required", file=sys.stderr)
        sys.exit(1)
    return genai.Client(api_key=api_key)


def generate_character(prompt: str, output: str) -> None:
    """キャラクター付きイラストを生成（参照画像あり）"""
    if not CHARACTER_IMAGE.exists():
        print(f"Error: Character image not found: {CHARACTER_IMAGE}", file=sys.stderr)
        sys.exit(1)

    client = get_client()

    # 参照画像を読み込み
    image_bytes = CHARACTER_IMAGE.read_bytes()
    image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/png")

    # プロンプト構築
    full_prompt = f"""Using the EXACT character designs from this reference image, create an illustration.

{CHARACTER_DESCRIPTION}

Scene to create:
{prompt}

Style: Cute chibi anime style matching reference, tech-blue background, Japanese text if needed.
{COLOR_GUIDELINES}
"""

    print(f"Generating character illustration...")
    print(f"Prompt: {prompt}")

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=[full_prompt, image_part],
        config=types.GenerateContentConfig(
            response_modalities=["image", "text"]
        )
    )

    _save_image(response, output)


def generate_diagram(prompt: str, output: str) -> None:
    """図解を生成（参照画像なし）"""
    client = get_client()

    # プロンプト構築
    full_prompt = f"""Create a clean infographic illustration.

Content:
{prompt}

Style: Clean minimalist infographic, professional tech style, Japanese text labels.
{COLOR_GUIDELINES}
"""

    print(f"Generating diagram...")
    print(f"Prompt: {prompt}")

    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=full_prompt,
        config=types.GenerateContentConfig(
            response_modalities=["image", "text"]
        )
    )

    _save_image(response, output)


def _save_image(response, output: str) -> None:
    """レスポンスから画像を保存"""
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    saved = False
    if response.candidates and response.candidates[0].content:
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                output_path.write_bytes(part.inline_data.data)
                print(f"✓ Saved to: {output_path}")
                saved = True
                break
            elif part.text:
                print(f"Text response: {part.text}")

    if not saved:
        print("Error: No image generated", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Generate illustrations for ai-small-is-accurate book"
    )
    parser.add_argument(
        "type",
        choices=["character", "diagram"],
        help="Type of illustration: 'character' (with reference image) or 'diagram' (infographic)"
    )
    parser.add_argument(
        "prompt",
        help="Description of the illustration to generate"
    )
    parser.add_argument(
        "-o", "--output",
        required=True,
        help="Output file path (e.g., images/scene1.png)"
    )

    args = parser.parse_args()

    if args.type == "character":
        generate_character(args.prompt, args.output)
    else:
        generate_diagram(args.prompt, args.output)


if __name__ == "__main__":
    main()
