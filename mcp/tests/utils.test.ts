import { describe, it, expect } from 'vitest';
import { splitSections, parseScalar, parseFrontMatter, buildGlossary } from '../src/utils.js';

// ---------- splitSections ----------
describe('splitSections', () => {
  it('空文字列からは1つの空セクションを返す', () => {
    const result = splitSections('');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('');
  });

  it('## 見出しで正しく分割する', () => {
    const md = `# Title\nIntro text\n## Section A\nContent A\n## Section B\nContent B`;
    const result = splitSections(md);
    expect(result).toHaveLength(3); // intro + A + B
    expect(result[0].title).toBe('');
    expect(result[1].title).toBe('Section A');
    expect(result[1].content).toContain('Content A');
    expect(result[2].title).toBe('Section B');
    expect(result[2].content).toContain('Content B');
  });

  it('## のみの見出し（レベル2）で分割し、### は無視する', () => {
    const md = `## Top\n### Sub\nDetail\n## Another`;
    const result = splitSections(md);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Top');
    expect(result[0].content).toContain('### Sub');
    expect(result[1].title).toBe('Another');
  });

  it('file フィールドは常に空文字列', () => {
    const result = splitSections('## Test\nContent');
    for (const s of result) {
      expect(s.file).toBe('');
    }
  });
});

// ---------- parseScalar ----------
describe('parseScalar', () => {
  it('空配列 "[]" を空配列に変換', () => {
    expect(parseScalar('[]')).toEqual([]);
  });

  it('配列 "[a, b, c]" をパース', () => {
    expect(parseScalar('[a, b, c]')).toEqual(['a', 'b', 'c']);
  });

  it('true/false をbooleanに変換', () => {
    expect(parseScalar('true')).toBe(true);
    expect(parseScalar('false')).toBe(false);
  });

  it('数値文字列を数値に変換', () => {
    expect(parseScalar('42')).toBe(42);
    expect(parseScalar('0')).toBe(0);
  });

  it('それ以外は文字列のまま返す', () => {
    expect(parseScalar('hello world')).toBe('hello world');
  });

  it('前後の空白をトリムする', () => {
    expect(parseScalar('  42  ')).toBe(42);
    expect(parseScalar('  true  ')).toBe(true);
  });
});

// ---------- parseFrontMatter ----------
describe('parseFrontMatter', () => {
  it('front matterがない場合は空metaと全体をbodyとして返す', () => {
    const result = parseFrontMatter('Just some text');
    expect(result.meta).toEqual({});
    expect(result.body).toBe('Just some text');
  });

  it('基本的なfront matterをパースする', () => {
    const raw = `---\ntitle: Hello\nstatus: draft\nversion: 1\n---\nBody content`;
    const result = parseFrontMatter(raw);
    expect(result.meta.title).toBe('Hello');
    expect(result.meta.status).toBe('draft');
    expect(result.meta.version).toBe(1);
    expect(result.body).toBe('Body content');
  });

  it('閉じ境界がない場合は空metaを返す', () => {
    const raw = `---\ntitle: Hello\nno closing`;
    const result = parseFrontMatter(raw);
    expect(result.meta).toEqual({});
    expect(result.body).toBe(raw);
  });

  it('配列値をパースする', () => {
    const raw = `---\ntags: [api, backend]\n---\nContent`;
    const result = parseFrontMatter(raw);
    expect(result.meta.tags).toEqual(['api', 'backend']);
  });

  it('リスト形式の配列をパースする', () => {
    const raw = `---\nowners:\n  - alice\n  - bob\n---\nContent`;
    const result = parseFrontMatter(raw);
    expect(result.meta.owners).toEqual(['alice', 'bob']);
  });

  it('空値と >- をパースする', () => {
    const raw = `---\nempty:\nsummary: >-\n---\nContent`;
    const result = parseFrontMatter(raw);
    expect(result.meta.empty).toBe('');
    expect(result.meta.summary).toBe('');
  });
});

// ---------- buildGlossary ----------
describe('buildGlossary', () => {
  it('箇条書き形式の用語をパースする', () => {
    const md = `- SSOT: Single Source of Truth\n- MVP: Minimum Viable Product`;
    const result = buildGlossary(md);
    expect(result['SSOT']).toBe('Single Source of Truth');
    expect(result['MVP']).toBe('Minimum Viable Product');
  });

  it('### 見出し形式の用語をパースする', () => {
    const md = `### API\n\nApplication Programming Interface`;
    const result = buildGlossary(md);
    expect(result['API']).toBe('Application Programming Interface');
  });

  it('括弧付き見出しから用語を抽出する', () => {
    const md = `### SSOT (Single Source of Truth)\n\n唯一の信頼できる情報源`;
    const result = buildGlossary(md);
    expect(result['SSOT']).toBe('唯一の信頼できる情報源');
  });

  it('空文字列からは空のGlossaryを返す', () => {
    const result = buildGlossary('');
    expect(result).toEqual({});
  });

  it('箇条書きと見出しが混在する場合、箇条書きが優先される', () => {
    const md = `- API: REST interface\n\n### API\n\nApplication Programming Interface`;
    const result = buildGlossary(md);
    expect(result['API']).toBe('REST interface');
  });
});
