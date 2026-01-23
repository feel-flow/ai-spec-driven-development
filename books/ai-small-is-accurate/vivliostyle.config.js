module.exports = {
  title: 'なぜあの人のAIは優秀なのか',
  author: '岡崎 太',
  language: 'ja',
  size: 'A5',
  theme: [
    '@vivliostyle/theme-techbook',
    'styles/custom.css'
  ],
  entry: [
    '00_preface.md',
    '00_toc.md',
    'part1_why-ai-fails/01_the-seventy-percent-problem.md',
    'part1_why-ai-fails/01b_hidden-costs-and-solutions.md',
    'part2_context-limit/02_lost-in-the-middle.md',
    'part3_precision/03_scope-convergence.md',
    'part3_precision/04_two-stage-ai.md',
    'part4_inference/05_leave-room-for-thinking.md',
    'part5_failures/06_before-after-patterns.md',
    'part6_vscode/07_practical-tips.md',
    'part7_new-roles/08_human-as-divider.md',
    '99_afterword.md'
  ],
  output: [
    './output/book.pdf',
  ],
  workspaceDir: '.vivliostyle',
  cover: 'images/cover.jpg',
};
