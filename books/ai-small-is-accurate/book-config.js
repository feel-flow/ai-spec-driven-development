/**
 * 書籍設定の一元管理
 * - PDF生成とEPUB生成の両方で使用
 * - ファイル順序とメタデータを定義
 */

module.exports = {
  // ファイル順序
  files: [
    '_metadata.md',
    '00_preface.md',
    '00_toc.md',
    'part1_why-ai-fails/_part.md',
    'part1_why-ai-fails/01-1_the-seventy-percent-problem.md',
    'part1_why-ai-fails/01-2_hidden-costs-and-solutions.md',
    'part2_context-limit/_part.md',
    'part2_context-limit/02-1_lost-in-the-middle.md',
    'part2_context-limit/02-2_lost-at-the-beginning.md',
    'part3_precision/_part.md',
    'part3_precision/03-1_scope-convergence.md',
    'part3_precision/03-2_two-stage-ai.md',
    'part4_inference/_part.md',
    'part4_inference/04-1_leave-room-for-thinking.md',
    'part5_vscode/_part.md',
    'part5_vscode/05-1_practical-tips.md',
    'part6_new-roles/_part.md',
    'part6_new-roles/06-1_human-as-divider.md',
    'appendix_quick-reference.md',
    '99_afterword.md'
  ],

  // メタデータ
  metadata: {
    title: 'なぜあの人のAIは優秀なのか',
    subtitle: '「分割と余白」で変わるAIと協働術',
    author: 'Futoshi Okazaki',
    language: 'ja',
    version: '1.3.1',
    date: '2026-02-05',
    coverImage: 'images/cover.jpg',
    description: 'AIを使う全ての人向けの思想編。ChatGPT、Claude、画像生成AIなど、あらゆるAIツールで「なんか微妙」になる原因と解決策を解説。コンテキスト縮小戦略とスコープ収束パターンで、AIの精度を意図的に設計する方法を学ぶ。',
    publisher: 'Futoshi Okazaki',
    isbn: '' // 出版時に実際のISBNに置き換え
  },

  /**
   * EPUB用のファイルリストを取得
   * @returns {string[]} _metadata.md と 00_toc.md を除外したファイルリスト
   * 注: 00_toc.md は Pandoc の --toc オプションで自動生成されるため除外
   */
  getEpubFiles() {
    return this.files.filter(file => file !== '_metadata.md' && file !== '00_toc.md');
  }
};
