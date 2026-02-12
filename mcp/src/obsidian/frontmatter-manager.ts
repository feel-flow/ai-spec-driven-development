/**
 * Frontmatter（メタデータ）管理機能
 * 
 * MarkdownファイルのYAML frontmatter を読み書きします。
 * js-yaml を使用して完全なYAML対応を実現します。
 */

import fs from 'fs';
import * as yaml from 'js-yaml';

/**
 * Frontmatterの型定義
 */
export interface FrontMatter {
  [key: string]: unknown;
  title?: string;
  version?: string;
  status?: string;
  owner?: string;
  created?: string;
  updated?: string;
  tags?: string[];
}

/**
 * Frontmatterをパースした結果
 */
export interface ParsedFrontMatter {
  /** パースされたfrontmatter */
  frontmatter: FrontMatter;
  /** frontmatter部分の文字列 */
  frontmatterText: string;
  /** frontmatter以降のコンテンツ */
  content: string;
  /** frontmatterが存在するか */
  hasFrontMatter: boolean;
}

/**
 * Frontmatterをパース
 * @param markdownContent Markdownファイルの内容
 * @returns パースされたfrontmatter
 */
export function parseFrontMatter(markdownContent: string): ParsedFrontMatter {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
  const match = markdownContent.match(frontmatterRegex);
  
  if (!match) {
    return {
      frontmatter: {},
      frontmatterText: '',
      content: markdownContent,
      hasFrontMatter: false
    };
  }
  
  const frontmatterText = match[1];
  const content = markdownContent.substring(match[0].length);
  
  try {
    const frontmatter = yaml.load(frontmatterText) as FrontMatter;
    
    return {
      frontmatter: frontmatter || {},
      frontmatterText,
      content,
      hasFrontMatter: true
    };
  } catch (error) {
    // パースエラーの場合は空のfrontmatterを返す
    return {
      frontmatter: {},
      frontmatterText: frontmatterText,
      content,
      hasFrontMatter: true
    };
  }
}

/**
 * Frontmatterを更新
 * @param markdownContent 元のMarkdownファイルの内容
 * @param updates 更新するフィールド
 * @returns 更新されたMarkdownファイルの内容
 */
export function updateFrontMatter(markdownContent: string, updates: Partial<FrontMatter>): string {
  const parsed = parseFrontMatter(markdownContent);
  
  // 既存のfrontmatterに更新内容をマージ
  const updatedFrontMatter = {
    ...parsed.frontmatter,
    ...updates
  };
  
  // 'updated'フィールドが明示的に指定されていない場合、現在日時を設定
  if (!updates.updated && parsed.hasFrontMatter) {
    updatedFrontMatter.updated = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
  }
  
  // Frontmatterを文字列に変換
  const newFrontMatterText = yaml.dump(updatedFrontMatter, {
    lineWidth: -1, // 行の折り返しを無効化
    sortKeys: false, // キーの順序を維持
    quotingType: '"', // 文字列をダブルクォートで囲む
    forceQuotes: false // 必要な場合のみクォート
  }).trim();
  
  // 新しいMarkdownを構築
  return `---\n${newFrontMatterText}\n---\n${parsed.content}`;
}

/**
 * ファイルのFrontmatterを読み込み
 * @param filePath ファイルパス
 * @returns パースされたfrontmatter
 */
export async function readFrontMatter(filePath: string): Promise<ParsedFrontMatter> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  return parseFrontMatter(content);
}

/**
 * ファイルのFrontmatterを更新
 * @param filePath ファイルパス
 * @param updates 更新するフィールド
 * @returns 更新されたかどうか
 */
export async function writeFrontMatter(filePath: string, updates: Partial<FrontMatter>): Promise<boolean> {
  const originalContent = await fs.promises.readFile(filePath, 'utf-8');
  const updatedContent = updateFrontMatter(originalContent, updates);
  
  // 内容が変更された場合のみ書き込み
  if (updatedContent !== originalContent) {
    await fs.promises.writeFile(filePath, updatedContent, 'utf-8');
    return true;
  }
  
  return false;
}

/**
 * 複数のファイルのFrontmatterを一括更新
 * @param filePaths ファイルパスの配列
 * @param updates 更新するフィールド
 * @returns 更新結果
 */
export async function bulkUpdateFrontMatter(
  filePaths: string[], 
  updates: Partial<FrontMatter>
): Promise<{ updated: number; failed: Array<{ file: string; error: string }> }> {
  let updatedCount = 0;
  const failed: Array<{ file: string; error: string }> = [];
  
  for (const filePath of filePaths) {
    try {
      const updated = await writeFrontMatter(filePath, updates);
      if (updated) {
        updatedCount++;
      }
    } catch (error) {
      failed.push({
        file: filePath,
        error: (error as Error).message
      });
    }
  }
  
  return { updated: updatedCount, failed };
}
