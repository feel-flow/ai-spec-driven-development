/**
 * 書籍設定の一元管理
 * - PDF生成とEPUB生成の両方で使用
 * - ファイル順序とメタデータを定義
 */

module.exports = {
  // ファイル順序
  // 注: 00_toc.md はEPUB生成時に除外 (Pandocの自動目次生成を使用)
  files: [
    '_metadata.md',
    '00_preface.md',
    '00_toc.md', // PDF生成では使用、EPUB生成では除外
    'part1_why-ai-fails/01_the-seventy-percent-problem.md',
    'part2_context-limit/02_lost-in-the-middle.md',
    'part3_precision/03_divide-and-conquer.md',
    'part4_inference/04_leave-room-for-thinking.md',
    'part5_failures/05_before-after-patterns.md',
    'part6_vscode/06_practical-tips.md',
    'part7_new-roles/07_human-as-divider.md',
    '99_afterword.md'
  ],

  // メタデータ
  metadata: {
    title: 'なぜAIは期待通りに動かないのか',
    subtitle: '小さく、でも余白を残して',
    author: 'Futoshi Okazaki',
    language: 'ja',
    version: '0.1.0',
    date: '2026-01-18',
    coverImage: 'images/cover.jpg',
    description: 'AIを使う全ての人向けの思想編。ChatGPT、Claude、画像生成AIなど、あらゆるAIツールで「なんか微妙」になる原因と解決策を解説。コンテキスト縮小戦略とスコープ収束パターンで、AIの精度を意図的に設計する方法を学ぶ。',
    publisher: 'Futoshi Okazaki',
    isbn: '' // 出版時に実際のISBNに置き換え
  },

  /**
   * EPUB用のファイルリストを取得
   * @returns {string[]} _metadata.md と 00_toc.md を除外したファイルリスト
   */
  getEpubFiles() {
    return this.files.filter(file =>
      file !== '00_toc.md' && file !== '_metadata.md'
    );
  }
};
