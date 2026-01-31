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
    'part1_why-ai-fails/01_typical-failure-patterns.md',
    'part1_why-ai-fails/02_ai-weakness.md',
    'part2_spec-is-90percent/03_living-spec.md',
    'part2_spec-is-90percent/04_seven-documents.md',
    'part2_spec-is-90percent/05_minimum-rules.md',
    'part2_spec-is-90percent/06_decision-matrix.md',
    'part2_spec-is-90percent/07_change-impact.md',
    // Part 2と3の間の茶話コーナー（意図的にルート直下に配置）
    'part2-3_break_corner.md',
    'part3_practice/08_introduction.md',
    'part3_practice/09_prototyping.md',
    'part3_practice/10_daily-workflow.md',
    'part3_practice/11_claude-code-skills.md',
    'part3_practice/12_copilot-agents.md',
    'part4_faq/13_engineer-role.md',
    'part4_faq/14_quality-security.md',
    'part5_organization/15_team-standardization.md',
    'part5_organization/16_roadmap-knowledge.md',
    '99_afterword.md',
    'appendix_agent-config.md'
  ],

  // メタデータ
  metadata: {
    title: 'AI仕様駆動開発',
    subtitle: 'AIエージェント開発の新常識',
    author: 'Futoshi Okazaki',
    language: 'ja',
    version: '1.2.0',
    date: '2026-01-29',
    coverImage: 'images/cover_kindle.jpg',
    description: 'AIコーディングツール（Claude Code, GitHub Copilot, Cursor等）を活用したいエンジニア向けの実践ガイド。AI仕様駆動開発の考え方と7文書構成を導入して、AIに安心して開発を任せられるようになる。',
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
