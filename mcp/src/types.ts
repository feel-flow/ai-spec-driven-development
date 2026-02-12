import { SpecStatus } from './constants.js';

export interface SectionIndexEntry {
  file: string;
  title: string;
  content: string;
}

export interface SpecRecordMeta {
  specId?: string;
  title?: string;
  owners?: unknown; // TODO: refine schema (array of { github: string })
  status?: string; // validate separately against SpecStatus
  version?: string;
  lastUpdated?: string;
  tags?: unknown;
  links?: unknown;
  summary?: string;
  riskLevel?: string;
  impact?: string;
  metrics?: unknown;
  file: string; // relative path
  body: string;
}

export interface SpecIndexResult {
  specs: SpecRecordMeta[];
  errors: Array<{ file: string; specId: string | null; errors: string[] }>;
}

export type Glossary = Record<string, string>;

export interface SearchResultItem {
  file: string;
  title: string;
  score: number;
  excerpt: string;
}

// Obsidian統合関連の型定義

export interface UpdateResult {
  success: boolean;
  updated: number;
  total: number;
  failed: Array<{ file: string; error: string }>;
}

export interface ValidationResult {
  success: boolean;
  totalFiles: number;
  totalLinks: number;
  brokenLinks: number;
  errors: Array<{
    file: string;
    linkText: string;
    linkPath: string;
    errorType: 'FILE_NOT_FOUND' | 'INVALID_ANCHOR';
    message: string;
  }>;
}
