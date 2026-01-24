#!/usr/bin/env node
/**
 * PDF生成用のMarkdown結合スクリプト
 * - 章番号を自動付与 (1.1, 1.1.1 形式)
 * - 章タイトル情報をメタデータとして保持
 */

const fs = require('fs');
const path = require('path');
const bookConfig = require('./book-config');

// ファイル順序をbook-config.jsから取得
const files = bookConfig.files;

// 章番号を抽出するパターン（1-1のような部-章形式に対応）
const chapterPattern = /^# 第(\d+-\d+)章/;
const partPattern = /^# 第\d+部/;
const sectionPattern = /^## /;
const subsectionPattern = /^### /;
const subsubsectionPattern = /^#### /;

let currentChapter = '0';
let currentChapterNum = 0;
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
    currentChapter = chapterMatch[1]; // '12' or '12a'
    currentChapterNum = parseInt(chapterMatch[1]); // 数値部分のみ（カウント用）
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
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const processedLines = lines.map(processLine);
    return processedLines.join('\n');
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    throw error;
  }
}

// メイン処理
const baseDir = __dirname;
let combined = '';
const missingFiles = [];

for (const file of files) {
  const filePath = path.join(baseDir, file);
  if (fs.existsSync(filePath)) {
    try {
      const processed = processFile(filePath);
      combined += processed + '\n\n';
    } catch (error) {
      console.error(`Failed to process file: ${filePath}`);
      process.exit(1);
    }
  } else {
    missingFiles.push(filePath);
  }
}

// ファイル未検出エラー処理
if (missingFiles.length > 0) {
  console.error(`\nMissing files:\n${missingFiles.map(f => `  - ${f}`).join('\n')}`);
  process.exit(1);
}

// 出力
const outputPath = path.join(baseDir, 'combined-numbered.md');
fs.writeFileSync(outputPath, combined);
console.log(`Generated: ${outputPath}`);
console.log(`Total chapters processed: ${currentChapterNum}`);
