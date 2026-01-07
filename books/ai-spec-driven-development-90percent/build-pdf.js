#!/usr/bin/env node
/**
 * PDF生成用のMarkdown結合スクリプト
 * - 章番号を自動付与 (1.1, 1.1.1 形式)
 * - 章タイトル情報をメタデータとして保持
 */

const fs = require('fs');
const path = require('path');

// ファイル順序
const files = [
  '_metadata.md',
  '00_preface.md',
  '00_toc.md',
  'part1_why-ai-fails/01_typical-failure-patterns.md',
  'part1_why-ai-fails/02_ai-weakness.md',
  'part2_spec-is-90percent/03_living-spec.md',
  'part2_spec-is-90percent/04_seven-documents.md',
  'part2_spec-is-90percent/05_minimum-rules.md',
  'part3_practice/06_introduction.md',
  'part3_practice/07_daily-workflow.md',
  'part3_practice/08_decision-matrix.md',
  'part3_practice/09_change-impact.md',
  'part4_faq/10_engineer-role.md',
  'part4_faq/11_quality-security.md',
  'part4_faq/12_tool-implementation.md',
  'part5_organization/13_team-standardization.md',
  'part5_organization/14_roadmap-knowledge.md',
  '99_afterword.md',
  'appendix_agent-config.md'
];

// 章番号を抽出するパターン
const chapterPattern = /^# 第(\d+)章/;
const partPattern = /^# 第\d+部/;
const sectionPattern = /^## /;
const subsectionPattern = /^### /;
const subsubsectionPattern = /^#### /;

let currentChapter = 0;
let currentSection = 0;
let currentSubsection = 0;
let currentSubsubsection = 0;
let inNumberedContent = false;

function processLine(line) {
  // 部（Part）のタイトル - 番号付けしない
  if (partPattern.test(line)) {
    inNumberedContent = false;
    return line;
  }

  // 章タイトル
  const chapterMatch = line.match(chapterPattern);
  if (chapterMatch) {
    currentChapter = parseInt(chapterMatch[1]);
    currentSection = 0;
    currentSubsection = 0;
    currentSubsubsection = 0;
    inNumberedContent = true;
    return line; // 章タイトルはそのまま（「第1章」が既に番号）
  }

  // 番号付けコンテンツ内でない場合はそのまま返す
  if (!inNumberedContent) {
    return line;
  }

  // セクション (##)
  if (sectionPattern.test(line) && !line.startsWith('## 目次') && !line.startsWith('## AIエージェント')) {
    currentSection++;
    currentSubsection = 0;
    currentSubsubsection = 0;
    const title = line.replace(/^## /, '');
    return `## ${currentChapter}.${currentSection}　${title}`;
  }

  // サブセクション (###)
  if (subsectionPattern.test(line)) {
    currentSubsection++;
    currentSubsubsection = 0;
    const title = line.replace(/^### /, '');
    return `### ${currentChapter}.${currentSection}.${currentSubsection}　${title}`;
  }

  // サブサブセクション (####)
  if (subsubsectionPattern.test(line)) {
    currentSubsubsection++;
    const title = line.replace(/^#### /, '');
    return `#### ${currentChapter}.${currentSection}.${currentSubsection}.${currentSubsubsection}　${title}`;
  }

  return line;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const processedLines = lines.map(processLine);
  return processedLines.join('\n');
}

// メイン処理
const baseDir = __dirname;
let combined = '';

for (const file of files) {
  const filePath = path.join(baseDir, file);
  if (fs.existsSync(filePath)) {
    const processed = processFile(filePath);
    combined += processed + '\n\n';
  } else {
    console.error(`File not found: ${filePath}`);
  }
}

// 出力
const outputPath = path.join(baseDir, 'combined-numbered.md');
fs.writeFileSync(outputPath, combined);
console.log(`Generated: ${outputPath}`);
console.log(`Total chapters processed: ${currentChapter}`);
