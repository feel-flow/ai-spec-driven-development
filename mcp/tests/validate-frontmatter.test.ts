import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import path from 'path';

const SCRIPT = path.resolve(__dirname, '../../scripts/validate-docs.mjs');
const VALID_DOCS = path.resolve(__dirname, 'fixtures/valid-docs');
const INVALID_DOCS = path.resolve(__dirname, 'fixtures/invalid-docs');

function run(docsDir: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execFileSync('node', [SCRIPT, docsDir], { encoding: 'utf-8' });
    return { stdout, exitCode: 0 };
  } catch (error: unknown) {
    const e = error as { stdout?: string; status?: number };
    return { stdout: e.stdout ?? '', exitCode: e.status ?? 1 };
  }
}

describe('validate-docs.mjs Frontmatter バリデーション', () => {
  describe('正常な Frontmatter', () => {
    it('すべてのフィールドが正しい場合、エラーなしで終了する', () => {
      const { stdout, exitCode } = run(VALID_DOCS);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Frontmatterに問題はありません');
      expect(stdout).toContain('Frontmatter: 0件');
    });
  });

  describe('不正な Frontmatter', () => {
    it('バリデーションエラーを検出し exit code 1 で終了する', () => {
      const { stdout, exitCode } = run(INVALID_DOCS);

      expect(exitCode).toBe(1);
    });

    it('必須フィールド欠落を検出する', () => {
      const { stdout } = run(INVALID_DOCS);

      expect(stdout).toContain('必須フィールド "version" が未設定です');
      expect(stdout).toContain('必須フィールド "status" が未設定です');
    });

    it('無効な status 値を検出する', () => {
      const { stdout } = run(INVALID_DOCS);

      expect(stdout).toContain('status "active" は無効です');
    });

    it('SemVer 形式でない version を検出する', () => {
      const { stdout } = run(INVALID_DOCS);

      expect(stdout).toContain('version "v1.0" はSemVer形式ではありません');
    });

    it('Frontmatter エラー件数がサマリーに表示される', () => {
      const { stdout } = run(INVALID_DOCS);

      expect(stdout).toContain('Frontmatter: 4件');
    });
  });
});
