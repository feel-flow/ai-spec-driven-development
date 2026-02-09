import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import path from 'path';

const SCRIPT: string = path.resolve(__dirname, '../../scripts/validate-docs.mjs');
const VALID_DOCS: string = path.resolve(__dirname, 'fixtures/valid-docs');
const INVALID_DOCS: string = path.resolve(__dirname, 'fixtures/invalid-docs');
const NO_FRONTMATTER_DOCS: string = path.resolve(__dirname, 'fixtures/no-frontmatter-docs');

const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;
const EXPECTED_INVALID_ERRORS = 4;

/** execFileSync のエラーが子プロセスの終了コードエラーかを判定する型ガード */
const isExecError = (value: unknown): value is { stdout: string; stderr: string; status: number } =>
  typeof value === 'object' &&
  value !== null &&
  'status' in value &&
  typeof (value as Record<string, unknown>).status === 'number';

function run(docsDir: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execFileSync('node', [SCRIPT, docsDir], { encoding: 'utf-8' });
    return { stdout, stderr: '', exitCode: EXIT_SUCCESS };
  } catch (error: unknown) {
    if (!isExecError(error)) throw error;
    return { stdout: error.stdout, stderr: error.stderr, exitCode: error.status };
  }
}

describe('validate-docs.mjs Frontmatter バリデーション', () => {
  describe('正常な Frontmatter', () => {
    it('すべてのフィールドが正しい場合、エラーなしで終了する', () => {
      const { stdout, exitCode } = run(VALID_DOCS);

      expect(exitCode).toBe(EXIT_SUCCESS);
      expect(stdout).toContain('Frontmatterに問題はありません');
      expect(stdout).toContain('Frontmatter: 0件');
    });
  });

  describe('不正な Frontmatter', () => {
    it('バリデーションエラーを検出し exit code 1 で終了する', () => {
      const { exitCode } = run(INVALID_DOCS);

      expect(exitCode).toBe(EXIT_FAILURE);
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

      expect(stdout).toContain(`Frontmatter: ${EXPECTED_INVALID_ERRORS}件`);
    });
  });

  describe('Frontmatter なし', () => {
    it('Frontmatter が見つからない場合、exit code 1 で終了する', () => {
      const { stdout, exitCode } = run(NO_FRONTMATTER_DOCS);

      expect(exitCode).toBe(EXIT_FAILURE);
      expect(stdout).toContain('Frontmatter が見つかりません');
    });

    it('Frontmatter なし件数がサマリーに表示される', () => {
      const { stdout } = run(NO_FRONTMATTER_DOCS);

      expect(stdout).toContain('Frontmatter: 1件');
    });
  });
});
