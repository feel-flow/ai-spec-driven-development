/**
 * Obsidian統合モジュール共通ユーティリティ
 */

import fs from 'fs';
import path from 'path';

/**
 * Markdownファイル処理関数の型定義
 */
type FileProcessor = (filePath: string, content: string) => Promise<void>;

/**
 * Markdownファイルを再帰的に走査
 * @param dir 走査するディレクトリ
 * @param processor 各ファイルに適用する処理関数
 * @param excludeDirs 除外するディレクトリ名の配列
 */
export async function walkMarkdownFiles(
  dir: string,
  processor: FileProcessor,
  excludeDirs: string[] = ['.obsidian']
): Promise<void> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (excludeDirs.includes(entry.name)) continue;
      await walkMarkdownFiles(fullPath, processor, excludeDirs);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      await processor(fullPath, content);
    }
  }
}

/**
 * Result型定義（エラーハンドリング用）
 */
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

/**
 * 成功結果を生成
 */
export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * 失敗結果を生成
 */
export function err<T>(error: Error): Result<T> {
  return { success: false, error };
}
