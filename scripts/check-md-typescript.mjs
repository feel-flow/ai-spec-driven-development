#!/usr/bin/env node
/**
 * check-md-typescript.mjs
 * Markdown 内の TypeScript コードフェンスを構文検査する（Issue #512）。
 *
 * Usage: node scripts/check-md-typescript.mjs [dir...]
 *   dir: 検査対象のディレクトリ（デフォルト: docs-template）。配下の *.md を再帰的に辿る
 *
 * 対象: 情報文字列の先頭語が typescript / ts / tsx のフェンス（大文字小文字は区別しない）。
 * 検査は構文だけ（TypeScript の syntactic diagnostics）。コード例はファイル横断で識別子を
 * 参照するため、型検査（未定義の識別子・引数の数など）はしない。
 *
 * 検査から外すマーカー: 先頭語の後ろに `no-check:` と理由を書く。理由が無ければ違反として報告する。
 *   ```typescript no-check: 意図的に構文を崩した悪い例
 *
 * フェンスは引用（>）の中・リスト項目の開始行・タブでインデントした位置にあっても拾う。
 * 他言語のフェンス（```` ````markdown ```` など）の中に書かれた TypeScript フェンスは、
 * 外側のフェンスの本文として扱い検査しない。
 *
 * 終了コード: 0 = 違反なし / 1 = 違反あり / 2 = 対象ディレクトリが無い・Markdown が 1 件も無い
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const DEFAULT_DIRS = ['docs-template'];
const SKIPPED_DIR_NAMES = new Set(['node_modules', '.git']);
const TS_LANGS = new Set(['typescript', 'ts', 'tsx']);
const NO_CHECK_MARKER = 'no-check';
const MIN_FENCE_LENGTH = 3;

const EXIT_OK = 0;
const EXIT_VIOLATION = 1;
const EXIT_NO_TARGET = 2;

// フェンス行の判定は、引用（>）とリストの記号を取り除いた後の本文に対して行う
const FENCE_OPEN = new RegExp(`^(\`{${MIN_FENCE_LENGTH},}|~{${MIN_FENCE_LENGTH},})(.*)$`);
const FENCE_CLOSE = new RegExp(`^[ \\t]*(\`{${MIN_FENCE_LENGTH},}|~{${MIN_FENCE_LENGTH},})[ \\t]*$`);
const QUOTE_MARKER = /^ {0,3}>[ \t]?/;
const LIST_MARKER = /^[ \t]*(?:[-*+]|\d{1,9}[.)])[ \t]+/;
const LEADING_WHITESPACE = /^[ \t]*/;
const NO_CHECK_TOKEN = new RegExp(`^${NO_CHECK_MARKER}(?::|\\s|$)`);
const LINE_BREAK = /\r?\n/;
// CommonMark のタブストップ（桁）
const TAB_STOP = 4;

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function collectMarkdown(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIR_NAMES.has(entry.name)) collectMarkdown(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

/**
 * 情報文字列を言語と no-check 指定に分ける。
 * @returns {{ lang: string, noCheck: boolean, reason: string }}
 */
function parseInfo(info) {
  const trimmed = info.trim();
  const [first = '', ...rest] = trimmed.split(/\s+/);
  const lang = first.toLowerCase();
  const tail = rest.join(' ');
  // no-check は語として一致させる（no-checking などを受理しない）
  if (!NO_CHECK_TOKEN.test(tail)) return { lang, noCheck: false, reason: '' };
  const reason = tail.slice(NO_CHECK_MARKER.length).replace(/^:/, '').trim();
  return { lang, noCheck: true, reason };
}

/** 先頭から最大 maxDepth 段の引用記号（>）を取り除く。取り除いた段数と文字数も返す。 */
function stripQuotes(line, maxDepth = Infinity) {
  let depth = 0;
  let removed = 0;
  let rest = line;
  while (depth < maxDepth) {
    const m = rest.match(QUOTE_MARKER);
    if (!m) break;
    depth++;
    removed += m[0].length;
    rest = rest.slice(m[0].length);
  }
  return { depth, removed, rest };
}

function nextColumn(col, ch) {
  return ch === '\t' ? col + TAB_STOP - (col % TAB_STOP) : col + 1;
}

/** 先頭 end 文字が占める桁数（タブは TAB_STOP 桁のタブストップまで進める）。 */
function columnsOf(text, end) {
  let col = 0;
  for (let i = 0; i < end; i++) col = nextColumn(col, text[i]);
  return col;
}

/** CommonMark と同じく、開きフェンスの桁位置までの空白を行頭から取り除く。取り除いた文字数も返す。 */
function stripColumns(text, cols) {
  let col = 0;
  let i = 0;
  while (i < text.length && col < cols && (text[i] === ' ' || text[i] === '\t')) {
    col = nextColumn(col, text[i]);
    i++;
  }
  return { text: text.slice(i), removed: i };
}

/** 引用・リスト記号・インデントの後ろにあるフェンスの開始を読む。フェンスでなければ null。 */
function readFenceOpen(line) {
  const q = stripQuotes(line);
  const listMarker = q.rest.match(LIST_MARKER);
  const prefix = (listMarker ?? q.rest.match(LEADING_WHITESPACE))[0];
  const m = q.rest.slice(prefix.length).match(FENCE_OPEN);
  // バッククォートのフェンスは情報文字列にバッククォートを含められない（CommonMark）
  if (!m || (m[1][0] === '`' && m[2].includes('`'))) return null;
  return {
    quoteDepth: q.depth,
    indentCols: columnsOf(q.rest, prefix.length),
    inListItem: listMarker !== null,
    fence: m[1],
    info: parseInfo(m[2]),
  };
}

/**
 * Markdown 1 ファイルから TypeScript フェンスを抜き出す。
 * removed[k] は本文 k 行目で行頭から取り除いた文字数（列番号を元の行へ戻すのに使う）。
 * @returns {Array<{ lang: string, noCheck: boolean, reason: string, fenceLine: number, removed: number[], source: string }>}
 */
export function extractBlocks(text) {
  const lines = text.split(LINE_BREAK);
  const blocks = [];
  let open = null;
  const finish = () => {
    if (TS_LANGS.has(open.info.lang)) {
      blocks.push({ ...open.info, fenceLine: open.fenceLine, removed: open.removed, source: open.body.join('\n') });
    }
    open = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!open) {
      const fence = readFenceOpen(line);
      if (fence) open = { ...fence, fenceLine: i + 1, body: [], removed: [] };
      continue;
    }
    const q = stripQuotes(line, open.quoteDepth);
    // 引用が終わる、またはリスト項目の開始行で開いたフェンスで内容の桁より浅い非空行が来ると、
    // その入れ物が終わりフェンスも閉じる（CommonMark）。この行は改めてフェンスの開始として読む。
    // 空白だけでインデントしたフェンスは、リストの中か外かを追わないのでこの判定をしない
    const leftContainer =
      q.depth < open.quoteDepth ||
      (open.inListItem && q.rest.trim() !== '' && columnsOf(q.rest, q.rest.match(LEADING_WHITESPACE)[0].length) < open.indentCols);
    if (leftContainer) {
      finish();
      i--;
      continue;
    }
    const c = q.rest.match(FENCE_CLOSE);
    if (c && c[1][0] === open.fence[0] && c[1].length >= open.fence.length) {
      finish();
      continue;
    }
    const stripped = stripColumns(q.rest, open.indentCols);
    open.body.push(stripped.text);
    open.removed.push(q.removed + stripped.removed);
  }
  // 閉じられないフェンスは文書末尾まで続く（CommonMark）
  if (open) finish();
  return blocks;
}

/**
 * ブロック群を 1 つの Program に載せ、構文診断だけを取る。
 * @returns {Map<string, readonly ts.Diagnostic[]>} 仮想ファイル名 → 診断
 */
function syntacticDiagnostics(entries) {
  const sources = new Map(
    entries.map(({ name, source, lang }) => [
      name,
      ts.createSourceFile(name, source, ts.ScriptTarget.ES2022, true, lang === 'tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS),
    ]),
  );
  const options = { noLib: true, noResolve: true, noEmit: true, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.Preserve };
  const host = {
    getSourceFile: (name) => sources.get(name),
    getDefaultLibFileName: () => 'lib.d.ts',
    writeFile: () => {},
    getCurrentDirectory: () => '/',
    getCanonicalFileName: (name) => name,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists: (name) => sources.has(name),
    readFile: () => undefined,
  };
  const program = ts.createProgram([...sources.keys()], options, host);
  return new Map([...sources].map(([name, sf]) => [name, program.getSyntacticDiagnostics(sf)]));
}

export function checkDirs(dirs) {
  const missing = dirs.filter((d) => !fs.existsSync(d) || !fs.statSync(d).isDirectory());
  if (missing.length > 0) {
    return { exitCode: EXIT_NO_TARGET, errors: missing.map((d) => `対象ディレクトリがありません: ${d}`) };
  }
  const files = dirs.flatMap((d) => collectMarkdown(d)).sort();
  if (files.length === 0) {
    return { exitCode: EXIT_NO_TARGET, errors: [`Markdown が 1 件もありません: ${dirs.join(', ')}`] };
  }

  const errors = [];
  const entries = [];
  let skipped = 0;
  for (const file of files) {
    const rel = toPosix(path.relative(process.cwd(), file));
    for (const block of extractBlocks(fs.readFileSync(file, 'utf8'))) {
      if (block.noCheck) {
        if (block.reason === '') {
          errors.push(`${rel}:${block.fenceLine}:1 ${NO_CHECK_MARKER} に理由がありません（例: \`\`\`typescript ${NO_CHECK_MARKER}: 意図的な悪い例）`);
        }
        skipped++;
        continue;
      }
      const ext = block.lang === 'tsx' ? 'tsx' : 'ts';
      entries.push({ ...block, rel, name: `/block-${entries.length}.${ext}` });
    }
  }

  const diagnostics = syntacticDiagnostics(entries);
  for (const entry of entries) {
    for (const d of diagnostics.get(entry.name)) {
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
      // 本文 1 行目はフェンス行の次の行。列は引用記号・インデントを取り除く前の位置に戻す
      const mdLine = entry.fenceLine + 1 + line;
      const mdCol = (entry.removed[line] ?? 0) + character + 1;
      const message = ts.flattenDiagnosticMessageText(d.messageText, ' ');
      errors.push(`${entry.rel}:${mdLine}:${mdCol} TS${d.code}: ${message}`);
    }
  }

  return {
    exitCode: errors.length > 0 ? EXIT_VIOLATION : EXIT_OK,
    errors,
    summary: `${files.length} ファイル / ${entries.length} ブロックを構文検査しました（${NO_CHECK_MARKER} ${skipped} 件）`,
  };
}

const isMain = Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const dirs = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_DIRS;
  const { exitCode, errors, summary } = checkDirs(dirs);
  for (const e of errors) console.error(e);
  if (exitCode === EXIT_OK) {
    console.log(`✓ check:md-ts: ${summary}`);
  } else if (exitCode === EXIT_VIOLATION) {
    console.error(`✗ check:md-ts: ${errors.length} 件の違反（${summary}）。修正するか、悪い例なら \`${NO_CHECK_MARKER}: <理由>\` を付けてください`);
  }
  process.exit(exitCode);
}
