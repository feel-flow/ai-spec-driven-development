---
name: generate-illustration
description: 本書「ai-small-is-accurate」専用のイラスト生成スキル。キャラクター参照画像を自動で渡し、一貫したスタイルの画像を生成する。
triggers:
  - "nanobanana"
  - "/nanobanana"
  - "イラスト生成"
  - "画像を作成"
  - "図解を生成"
  - "/generate-illustration"
allowed-tools:
  - Bash(python3:*)
---

# イラスト生成スキル（/nanobanana）

## 概要

本書「ai-small-is-accurate」専用のイラスト生成スキルです。
別名: `/generate-illustration`、`nanobanana`
キャラクター参照画像（`characters.png`）を自動的にGemini APIに渡し、
一貫したスタイルのイラストを生成します。

## 実行コマンド

```bash
# キャラクター付きイラスト（参照画像を自動で渡す）
python3 .claude/scripts/generate_illustration.py character "<プロンプト>" -o <出力パス>

# 図解・インフォグラフィック（参照画像なし）
python3 .claude/scripts/generate_illustration.py diagram "<プロンプト>" -o <出力パス>
```

## 依存関係

- `google-genai` パッケージ
- 環境変数 `GEMINI_API_KEY`

## キャラクター

### AI侍（あいさむらい）
- **役割**: 知識を授ける師匠キャラ
- **外見**: ひげを生やした中年男性、グレー/ダークグレーの着物、腰に刀
- **スタイル**: 2〜3頭身のちびキャラ
- **セリフ調**: 「〜である」「〜なのだ」「わしは〜」

### DJ町娘（でぃーじぇーまちむすめ）
- **役割**: 読者代理、学ぶ側のキャラ
- **外見**: 若い女性、オレンジ/金色の着物（花柄）、白いヘッドフォン
- **スタイル**: 2〜3頭身のちびキャラ
- **セリフ調**: 「〜ですか？」「なるほど！」「〜ですね✨」

## 画像タイプ

### 1. キャラクター付きイラスト（シーン・漫画）
キャラクターを使った説明用イラスト。

**用途**:
- AI侍道場の漫画
- 概念説明のシーン
- Before/After比較

**必須**: 参照画像（characters.png）を渡す

### 2. 図解・インフォグラフィック
キャラクターなしのシンプルな図解。

**用途**:
- フローチャート
- 比較表・タイムライン
- データの可視化
- プロセス説明

**任意**: 参照画像は不要だが、配色は統一

## 配色ガイドライン

| 用途 | 色 |
| --- | --- |
| 背景 | テックブルー（#1E3A5F〜#2C5282） |
| 良い状態 | グリーン（#38A169） |
| 悪い状態 | レッド/オレンジ（#E53E3E） |
| 中間状態 | イエロー（#ECC94B） |
| アクセント | オレンジ（#ED8936） |

## 使用方法

```
/generate-illustration [タイプ] [説明]
```

### パラメータ

| パラメータ | 説明 | 例 |
| --- | --- | --- |
| タイプ | `character` または `diagram` | `character` |
| 説明 | 生成したい画像の説明 | 「感情の変化を6段階で」 |

### 例

```bash
# キャラクター付きイラスト
/generate-illustration character AI侍がDJ町娘に「小さく分ける」を説明するシーン

# 図解
/generate-illustration diagram 期待シナリオと実際のシナリオのフローチャート比較
```

## 実行手順

### キャラクター付きイラスト（character）

1. **参照画像を読み込む**
   ```python
   character_image = genai.upload_file("books/ai-small-is-accurate/images/characters.png")
   ```

2. **プロンプトを構築**
   - 必ず「Using the exact character designs from the reference image」で始める
   - キャラクターの特徴を明記
   - シーンの説明を英語で記述
   - 日本語テキストはそのまま含める

3. **画像を生成**
   ```python
   response = model.generate_content([prompt, character_image])
   ```

4. **保存先を決定**
   - 章と同じディレクトリに保存
   - 命名規則: `[内容]_[タイプ].png`（例: `emotional_journey.png`）

### 図解（diagram）

1. **プロンプトを構築**
   - 配色ガイドラインに従う
   - 日本語ラベルを含める
   - スタイル: クリーン、ミニマル、プロフェッショナル

2. **画像を生成**
   ```python
   response = model.generate_content(prompt)
   ```

## コード例

### キャラクター付きイラスト

```python
from google import genai
import os

genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-3-pro-image-preview')

# 公式キャラクター画像を参照として渡す
character_image = genai.upload_file("books/ai-small-is-accurate/images/characters.png")

prompt = """Using the exact character designs from the reference image, create [シーンの説明].

The reference image shows two chibi characters (2-3 head proportion):
- AI Samurai: Bearded middle-aged man in dark gray kimono with katana
- DJ Town Girl: Young girl in orange/gold floral kimono with white headphones

[具体的なシーンの説明を英語で]

Style: Match the exact character designs from reference, cute chibi anime style,
tech-blue gradient background, Japanese text labels, horizontal 16:9 layout."""

response = model.generate_content([prompt, character_image])

# 画像を保存
if hasattr(response, 'candidates') and response.candidates:
    for candidate in response.candidates:
        if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
            for part in candidate.content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    with open('[保存先パス]', 'wb') as f:
                        f.write(part.inline_data.data)
                    print("Image saved!")
```

### 図解

```python
from google import genai
import os

genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-3-pro-image-preview')

prompt = """Create a clean infographic illustration showing [図解の説明].

[具体的な内容を英語で]

Style: Clean minimalist infographic, professional tech style,
blue (#1E3A5F) background, green for positive (#38A169),
red/orange for negative (#E53E3E), Japanese text labels,
horizontal 16:9 layout."""

response = model.generate_content(prompt)

# 画像を保存（同様の処理）
```

## 本文への挿入

生成後、Markdownファイルに以下の形式で追加：

```markdown
![説明テキスト](./ファイル名.png)
```

**重要**: 画像生成用のコメント（`<!-- -->`）は削除し、実際の画像参照に置き換える。

## ASCIIアート→図解の置き換えガイド

本書のASCIIアートを図解画像に置き換える際の指針：

### 置き換え対象

1. **フローチャート**: `↓` や矢印を使ったプロセス図
2. **比較図**: 左右に分かれた対比
3. **タイムライン**: 時系列の流れ
4. **ダイアグラム**: ボックスや枠を使った構造図

### 置き換え手順

1. ASCIIアートの内容を分析
2. 適切な画像タイプを選択（character/diagram）
3. 画像を生成
4. ASCIIアートを `![alt](./image.png)` に置き換え
5. コードブロック（```text ... ```）を削除

### 置き換え例

**Before（ASCIIアート）**:
```markdown
```text
期待: 40分
実際: 4時間
```
```

**After（画像）**:
```markdown
![期待と実際の時間比較](./time_comparison.png)
```

## 関連スキル

- `/proofread` - 総合校正
- `/proofread-depth` - 内容充実度チェック

## 注意事項

- 環境変数 `GEMINI_API_KEY` が必要
- `google-generativeai` パッケージがインストールされている必要あり
- キャラクター付きイラストは必ず参照画像を渡すこと
- 配色は統一感を保つこと
