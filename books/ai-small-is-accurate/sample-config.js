/**
 * サンプル版（試し読み）書籍設定
 * - Kindle/Apple Books向けのサンプル版を生成するための設定
 * - Part 1のみを含む（約25%の内容）
 */

module.exports = {
  // サンプル版フラグ
  isSample: true,

  // ファイル順序（Part 1のみ）
  files: [
    '_metadata.md',
    '00_preface.md',
    'part1_why-ai-fails/_part.md',
    'part1_why-ai-fails/01-1_the-seventy-percent-problem.md',
    'part1_why-ai-fails/01-2_hidden-costs-and-solutions.md',
    '99_afterword.md'
  ],

  // メタデータ（タイトルに「サンプル版」を追記）
  metadata: {
    title: 'なぜあの人のAIは優秀なのか【サンプル版】',
    subtitle: '「分割と余白」で変わるAIと協働術',
    author: 'Futoshi Okazaki',
    language: 'ja',
    version: '0.1.0',
    date: '2026-01-18',
    coverImage: 'images/cover.jpg',
    description: '【サンプル版】AIを使う全ての人向けの思想編。ChatGPT、Claude、画像生成AIなど、あらゆるAIツールで「なんか微妙」になる原因と解決策を解説。',
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
