/**
 * サンプル版（試し読み）書籍設定
 * - Kindle/Apple Books向けのサンプル版を生成するための設定
 * - Part 1（第1〜2章）のみを含む
 */

module.exports = {
  // サンプル版フラグ
  isSample: true,

  // ファイル順序（Part 1のみ）
  files: [
    '_metadata.md',
    '00_preface.md',
    'part1_why-ai-fails/01_typical-failure-patterns.md',
    'part1_why-ai-fails/02_ai-weakness.md',
    '99_afterword.md'
  ],

  // メタデータ（タイトルに「サンプル版」を追記）
  metadata: {
    title: 'AIエージェント開発は仕様が9割【サンプル版】',
    subtitle: 'Vibe Codingで失敗しないための設計図',
    author: 'Futoshi Okazaki',
    language: 'ja',
    version: '0.1.0',
    date: '2026-01-01',
    coverImage: 'images/cover.jpg',
    description: '【サンプル版】AIコーディングツール（Claude Code, GitHub Copilot, Cursor等）を活用したいエンジニア向けの実践ガイド。',
    publisher: 'Futoshi Okazaki',
    isbn: '' // サンプル版にはISBNなし
  },

  /**
   * EPUB用のファイルリストを取得
   * @returns {string[]} _metadata.md を除外したファイルリスト
   */
  getEpubFiles() {
    return this.files.filter(file => file !== '_metadata.md');
  }
};
