/**
 * ACE Playbook の健全性チェック（Issue #367, #444, #487）。
 * - Category ごとのエントリ件数を数え、refine 目安超過は警告のみ（exit 0）、
 *   ブロック上限超過で終了コード 1。件数が主指標。
 * - 総行数は既定で件数から導出する上限と比較し、超過時は警告のみ
 *   （終了コードは変えない）。上限 = ヘッダ行数 + 件数 × 16。
 *   `ACE_MAX_PLAYBOOK_LINES` を明示したときだけ固定上限（後方互換）。
 * 実行例: npx --yes tsx scripts/ace/check-category-size.ts path/to/PLAYBOOK.md
 */
import * as fs from "node:fs";
import * as path from "node:path";

const EXIT_OK = 0;
const EXIT_THRESHOLD_EXCEEDED = 1;
const EXIT_USAGE_ERROR = 2;

export const DEFAULT_MAX_ENTRIES_PER_CATEGORY = 280;
export const DEFAULT_WARN_ENTRIES_PER_CATEGORY = 130;
export const DEFAULT_MAX_ENTRY_LINES = 15;
/**
 * PLAYBOOK の ID 規則。旧 3 桁形式（ACE-001）と新 PRスコープ式（ACE-438-1 / ACE-i425-1）の両方に対応する。
 * 実 ID は必ず数字始まり（旧 3 桁・PR 番号）か `i` ＋数字（Issue 由来）で始まるため、
 * テンプレートのプレースホルダ見出し（### ACE-XXX: 等）はマッチさせず集計から除外する。
 */
const ACE_ENTRY_HEADER_PATTERN = /^### ACE-(?:\d[\w-]*|i\d[\w-]*):/m;
const CATEGORY_TABLE_LINE_PATTERN = /^\|\s*Category\s*\|\s*([^|]+)\|/im;

export type CategoryHistogram = Readonly<Record<string, number>>;

export type AnalyzeSuccess = Readonly<{
  readonly kind: "ok";
  readonly histogram: CategoryHistogram;
  readonly totalEntries: number;
}>;

export type AnalyzeFailure = Readonly<{
  readonly kind: "error";
  readonly message: string;
}>;

export type AnalyzeResult = AnalyzeSuccess | AnalyzeFailure;

function trimCategoryValue(raw: string): string {
  return raw.replace(/\s+/gu, " ").trim();
}

function incrementHistogram(
  histogram: Record<string, number>,
  categoryKey: string,
): void {
  const next = (histogram[categoryKey] ?? 0) + 1;
  histogram[categoryKey] = next;
}

/**
 * Playbook の総行数を数える。wc -l 準拠で改行文字（\n）の出現回数を返す。
 * 末尾に改行が無い最終行は数えない（wc -l と同じ挙動）。
 */
export function countPlaybookLines(content: string): number {
  const matches = content.match(/\n/gu);
  return matches ? matches.length : 0;
}

/**
 * 行数が閾値を超過しているか。境界（ちょうど）は超過扱いしない。
 */
export function isOverLineThreshold(lineCount: number, max: number): boolean {
  return lineCount > max;
}

function stripHtmlBlockComments(source: string): string {
  return source.replace(/<!--[\s\S]*?-->/gu, "");
}

/**
 * PLAYBOOK.md 本文から ACE エントリブロックを走査し、Category 行を集計する。
 * HTML コメント内の追記例（### ACE-001 など）を除外するため、先にコメントを除去する。
 */
export function analyzePlaybookMarkdown(content: string): AnalyzeResult {
  const cleaned = stripHtmlBlockComments(content);
  const segments = cleaned.split(ACE_ENTRY_HEADER_PATTERN).slice(1);
  if (segments.length === 0) {
    return {
      kind: "error",
      message: "ACE エントリ見出し（### ACE-数字:）が見つかりません。",
    };
  }
  const histogram: Record<string, number> = {};

  for (const segment of segments) {
    const match = segment.match(CATEGORY_TABLE_LINE_PATTERN);
    if (!match?.[1]) {
      return {
        kind: "error",
        message: "Category 行を解析できない ACE ブロックがあります。",
      };
    }
    const categoryKey = trimCategoryValue(match[1]);
    incrementHistogram(histogram, categoryKey);
  }

  return {
    kind: "ok",
    histogram,
    totalEntries: segments.length,
  };
}

/**
 * 正の整数を表す環境変数を厳密に解釈する。`"800abc"` や `"1e3"` のような
 * 曖昧な値・0 以下・空値は無効として既定値にフォールバックし、stderr に警告を出す。
 * rawValue を引数で受け取り、副作用なくユニットテストできるようにしている。
 * warnPrefix は警告の発信元スクリプト名（他スクリプトから再利用する際に上書きする）。
 */
export function parsePositiveIntEnv(
  rawValue: string | undefined,
  defaultValue: number,
  envName: string,
  warnPrefix: string = "ace-check",
): number {
  if (rawValue === undefined || rawValue.trim() === "") {
    return defaultValue;
  }
  const trimmed = rawValue.trim();
  if (!/^[0-9]+$/u.test(trimmed) || Number.parseInt(trimmed, 10) < 1) {
    console.warn(
      `${warnPrefix}: ${envName}="${trimmed}" は無効のため、既定値 ${String(defaultValue)} を使います。`,
    );
    return defaultValue;
  }
  return Number.parseInt(trimmed, 10);
}

function parseMaxPerCategory(): number {
  return parsePositiveIntEnv(
    process.env.ACE_MAX_ENTRIES_PER_CATEGORY,
    DEFAULT_MAX_ENTRIES_PER_CATEGORY,
    "ACE_MAX_ENTRIES_PER_CATEGORY",
  );
}

function parseMaxPlaybookLines(): number | undefined {
  const raw = process.env.ACE_MAX_PLAYBOOK_LINES;
  if (raw === undefined || raw.trim() === "") {
    return undefined;
  }
  const trimmed = raw.trim();
  if (!/^[0-9]+$/u.test(trimmed) || Number.parseInt(trimmed, 10) < 1) {
    console.warn(
      `ace-check: ACE_MAX_PLAYBOOK_LINES="${trimmed}" は無効のため、件数から上限を導出します。`,
    );
    return undefined;
  }
  return Number.parseInt(trimmed, 10);
}

export function countHeaderLines(content: string): number {
  const masked = content.replace(/<!--[\s\S]*?-->/gu, (block) =>
    " ".repeat(block.length),
  );
  const match = masked.match(ACE_ENTRY_HEADER_PATTERN);
  if (!match || match.index === undefined) {
    return countPlaybookLines(content);
  }
  return countPlaybookLines(content.slice(0, match.index));
}

export function deriveMaxLines(
  headerLines: number,
  entryCount: number,
  maxEntryLines: number = DEFAULT_MAX_ENTRY_LINES,
): number {
  return headerLines + entryCount * (maxEntryLines + 1);
}

function resolvePlaybookPath(argv: readonly string[]): string | undefined {
  const fromArg = argv[2];
  if (fromArg && fromArg.trim() !== "") {
    return path.resolve(fromArg);
  }
  const fromEnv = process.env.ACE_PLAYBOOK_PATH;
  if (fromEnv && fromEnv.trim() !== "") {
    return path.resolve(fromEnv);
  }
  return undefined;
}

function formatHistogram(histogram: CategoryHistogram): string {
  return Object.entries(histogram)
    .map(([key, count]) => `${key}: ${String(count)}`)
    .join("\n");
}

export function main(): number {
  const playbookPath = resolvePlaybookPath(process.argv);
  if (!playbookPath) {
    console.error(
      "引数に PLAYBOOK.md のパスを渡すか、ACE_PLAYBOOK_PATH を設定してください。",
    );
    return EXIT_USAGE_ERROR;
  }

  let content: string;
  try {
    content = fs.readFileSync(playbookPath, "utf8");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`読み込み失敗: ${message}`);
    return EXIT_USAGE_ERROR;
  }

  const analyzed = analyzePlaybookMarkdown(content);
  if (analyzed.kind === "error") {
    console.error(analyzed.message);
    return EXIT_USAGE_ERROR;
  }

  const maxAllowed = parseMaxPerCategory();
  const warnAllowed = DEFAULT_WARN_ENTRIES_PER_CATEGORY;
  const overCategories: string[] = [];
  const warnCategories: string[] = [];

  for (const [categoryKey, count] of Object.entries(analyzed.histogram)) {
    if (count > maxAllowed) {
      overCategories.push(`${categoryKey} (${String(count)} > ${String(maxAllowed)})`);
    } else if (count > warnAllowed) {
      warnCategories.push(
        `${categoryKey} (${String(count)} > ${String(warnAllowed)} / ブロック上限 ${String(maxAllowed)})`,
      );
    }
  }

  const lineCount = countPlaybookLines(content);
  const headerLines = countHeaderLines(content);
  const fixedMaxLines = parseMaxPlaybookLines();
  const derivedMax = deriveMaxLines(headerLines, analyzed.totalEntries);
  const maxLines = fixedMaxLines ?? derivedMax;
  const breakdown = `ヘッダ ${String(headerLines)} + ${String(analyzed.totalEntries)} 件 × ${String(DEFAULT_MAX_ENTRY_LINES + 1)}`;

  console.log(`Playbook: ${playbookPath}`);
  console.log(`総エントリ数: ${String(analyzed.totalEntries)}`);
  if (fixedMaxLines === undefined) {
    console.log(
      `総行数: ${String(lineCount)} (導出上限 ${String(derivedMax)} = ${breakdown})`,
    );
  } else {
    console.log(`総行数: ${String(lineCount)} (閾値 ${String(fixedMaxLines)})`);
  }
  if (isOverLineThreshold(lineCount, maxLines)) {
    if (fixedMaxLines === undefined) {
      const perEntry =
        analyzed.totalEntries === 0
          ? "n/a"
          : ((lineCount - headerLines) / analyzed.totalEntries).toFixed(1);
      console.error(
        `⚠ エントリ密度が行数バジェットを超過しています（${String(lineCount)} 行 > 導出上限 ${String(derivedMax)} 行 = ${breakdown}）。実測 ${perEntry} 行/件（バジェット ${String(DEFAULT_MAX_ENTRY_LINES)} 行 + ブロック間の空行 1 行）。ファイル全体が大きいことではなく 1 エントリが太いことが原因なので、/ace-refine の圧縮・正準化で密度を下げてください（旧テーブル形式のエントリが残っていると 16〜19 行/件になります）。`,
      );
    } else {
      console.error(
        `⚠ 行数が閾値を超過しています（${String(lineCount)} > ${String(fixedMaxLines)}）。分割・アーカイブを検討してください（別 Issue 起票を推奨）。`,
      );
    }
  }
  console.log("カテゴリ別件数:\n" + formatHistogram(analyzed.histogram));
  console.log(
    `ブロック上限: ${String(maxAllowed)} 件/カテゴリ（refine 目安: ${String(warnAllowed)} 件/カテゴリ）`,
  );

  if (warnCategories.length > 0 && overCategories.length === 0) {
    console.warn(
      "refine 目安を超えたカテゴリがあります（警告のみ）:\n- " +
        warnCategories.join("\n- "),
    );
  }

  if (overCategories.length > 0) {
    console.error(
      "ブロック上限を超えたカテゴリがあります:\n- " +
        overCategories.join("\n- "),
    );
    return EXIT_THRESHOLD_EXCEEDED;
  }

  return EXIT_OK;
}

// 直接実行（tsx 経由の CLI）のときのみ自動実行する。テストから import した
// ときは副作用なく関数だけを取り込めるようにする。
if ((process.argv[1] ?? "").includes("check-category-size")) {
  process.exitCode = main();
}
