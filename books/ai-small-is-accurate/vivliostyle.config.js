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
    'part1_why-ai-fails/01-1_the-seventy-percent-problem.md',
    'part1_why-ai-fails/01-2_hidden-costs-and-solutions.md',
    'part2_context-limit/02-1_lost-in-the-middle.md',
    'part2_context-limit/02-2_lost-at-the-beginning.md',
    'part3_precision/03-1_scope-convergence.md',
    'part3_precision/03-2_two-stage-ai.md',
    'part4_inference/04-1_leave-room-for-thinking.md',
    'part5_failures/05-1_before-after-patterns.md',
    'part6_vscode/06-1_practical-tips.md',
    'part7_new-roles/07-1_human-as-divider.md',
    '99_afterword.md'
  ],
  output: [
    './output/book.pdf',
  ],
  workspaceDir: '.vivliostyle',
  cover: 'images/cover.jpg',
};
