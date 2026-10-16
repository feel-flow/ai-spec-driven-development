import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname, normalize, relative } from "node:path";
import { toPosixPath } from "./path-utils";

// 配布版 GitHub テンプレート (docs-template/.github/) の参照が、
// 「利用者側レイアウト」で解決することを検証する（Issue #483）。
//
// 利用者側レイアウト: リポジトリ直下に .github/ と docs/ が並ぶ。
//   docs-template/.github/**  →  <repo>/.github/**
//   docs-template/**（.github 以外） →  <repo>/docs/**
//
// 本リポジトリは docs-template/ を自身の docs としてもドッグフードするため、
// 「本リポでは解決するが利用者側では壊れる」参照が混入しやすい。
// 実際に ISSUE_TEMPLATE / PR テンプレ / agents / skills の約 30 箇所が
// 上流レイアウト前提になっていた（Issue #483-1）。
//
// 配布ツリーに存在することと、/init-docs が実際に配置することは別物である。
// リンクは「展開先に必ず在る」ことが前提なので初期セット内に限り、初期セット外
// （05-operations/deployment/ 配下など）は所在の案内として inline code で書く。
// この線引きを INITIAL_SET で機械検証する（Issue #488）。
//
// 検証範囲は .github/ 配下と、docs-template/ 本体のうち初期セット内の文書
// （Issue #490）。線引き:
//   - 初期セット内文書 → 初期セット外文書 のリンクは違反（展開先で切れる）。
//     拡張子は問わない（.md だけでなく雛形 .ts / .sql へのリンクも展開先で切れる）
//   - 初期セット外文書（05-operations/deployment/ 等）からのリンクは対象外。
//     それらは展開先に配置されないので、内部リンクの解決可否を検証する意味がない
//     （利用者がファイル単位でコピーした後の相互リンクは未検証の残課題）
//   - inline code のパス表記（`docs/...` `.github/...`）の実在検査は .github/ と
//     初期セット内文書の両方（初期セット外の所在案内はこの表記で書くため）。
//     配布ツリーに実体を持たない正当な表記は INLINE_PATH_EXEMPT で除外する
//   - 上流レイアウト固有パス（docs-template/）の混入検査も .github/ と初期セット内
//     文書の両方（Issue #509）。展開先には docs/ しか無いので、docs-template/ 起点の
//     相対パス・構造図は展開先で誤りになる。配布元の所在を説明する正当な言及
//     （プラグイン同梱パス・絶対 URL）は UPSTREAM_PATH_EXEMPT_PATTERNS で除外する
//   - frontmatter references の検査は従来どおり .github/ のみ

const REPO_ROOT = resolve(__dirname, "..");
const TEMPLATE_ROOT = join(REPO_ROOT, "docs-template");
const DIST_GITHUB = join(TEMPLATE_ROOT, ".github");

// /init-docs が初期配置する 21 ファイル。出典は ff-dev-toolkit の
// skills/init-docs/SKILL.md「2. ディレクトリ構造の作成」。
// 03-implementation/ERRORS.md は Issue #550 で PATTERNS.md §3 から切り出して追加した。
// 上流 SKILL.md（20 ファイル）と同梱 docs-template への反映は
// feel-flow/feelflow-plugins#2137 で追跡しており、反映までは上流と 1 件ずれる。
// 上流へ移植するときは PATTERNS.md 1.6.0 と ERRORS.md を必ず同時に入れること
// （PATTERNS.md だけ入れると §3 が索引だけになり、エラー型の正典が展開先から消える）。
// 00-planning/ と 08-knowledge/ は初期セットに含まれない（後者は /ace-setup が作成）。
const INITIAL_SET = new Set([
  "docs/MASTER.md",
  "docs/01-context/PROJECT.md",
  "docs/01-context/CONSTRAINTS.md",
  "docs/02-design/ARCHITECTURE.md",
  "docs/02-design/DOMAIN.md",
  "docs/02-design/API.md",
  "docs/02-design/DATABASE.md",
  "docs/03-implementation/PATTERNS.md",
  "docs/03-implementation/CONVENTIONS.md",
  "docs/03-implementation/INTEGRATIONS.md",
  "docs/03-implementation/DECISION_TREE.md",
  "docs/03-implementation/FALLBACK.md",
  "docs/03-implementation/ERRORS.md",
  "docs/04-quality/TESTING.md",
  "docs/04-quality/VALIDATION.md",
  "docs/05-operations/DEPLOYMENT.md",
  "docs/06-reference/GLOSSARY.md",
  "docs/06-reference/DECISIONS.md",
  "docs/07-project-management/ROADMAP.md",
  "docs/07-project-management/TASKS.md",
  "docs/07-project-management/RISKS.md",
]);

/** 利用者側レイアウトのパス（.github/... または docs/...）を実ファイルへ写像する */
function toTemplatePath(deployedPath: string): string | null {
  const p = toPosixPath(normalize(deployedPath));
  if (p.startsWith(".github/")) return join(TEMPLATE_ROOT, p);
  if (p.startsWith("docs/"))
    return join(TEMPLATE_ROOT, p.slice("docs/".length));
  return null;
}

/**
 * 初期セット内文書の実ファイル（docs-template/<rel>）。INITIAL_SET から導く。
 * 写像できない・実在しないエントリはここでは除き、専用テスト
 * 「INITIAL_SET の全エントリが配布ツリーに実在する」で原因つきで落とす
 * （ここで readFileSync に渡すと生の ENOENT で診断が埋もれる）。
 */
function listInitialSetFiles(): string[] {
  return [...INITIAL_SET]
    .map((p) => toTemplatePath(p))
    .filter((p): p is string => p !== null && existsSync(p));
}

function listMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listMarkdown(full));
    else if (entry.endsWith(".md")) out.push(full);
  }
  return out;
}

/**
 * 配布ファイルの、利用者リポジトリ内での配置。
 *   docs-template/.github/** → .github/**（例: .github/ISSUE_TEMPLATE/bug.md）
 *   docs-template/**        → docs/**（例: docs/05-operations/DEPLOYMENT.md）
 */
function deployedLocation(absPath: string): string {
  const rel = toPosixPath(relative(TEMPLATE_ROOT, absPath));
  if (rel.startsWith(".github/")) return rel;
  return toPosixPath(join("docs", rel));
}

/** 相対リンクの href を、利用者リポジトリ内の絶対パスへ解決する */
function resolveLinkTarget(deployedFile: string, href: string): string {
  return toPosixPath(normalize(join(dirname(deployedFile), href)));
}

/**
 * その参照先をリンクとして書いてよいか。
 * .github/ 配下は配布物一式がまとめてコピーされるので常に在る。
 * docs/ 配下は /init-docs が配置する初期セットに限る。
 */
function isLinkableTarget(target: string): boolean {
  return target.startsWith(".github/") || INITIAL_SET.has(target);
}

/**
 * 1 文書分の相対リンクを走査し、初期セット外を指すものを報告文にして返す。
 * 実ファイルに対しては違反ゼロを期待するため、この関数を合成入力で別途固定する
 * （検出器の自己検証）。
 */
function findOutOfSetLinks(
  sourceLabel: string,
  deployedFile: string,
  content: string,
): string[] {
  const outside: string[] = [];
  for (const match of relativeLinks(content)) {
    const target = resolveLinkTarget(deployedFile, match[1]);
    if (!isLinkableTarget(target)) {
      outside.push(
        `${sourceLabel} → ${target}（初期セット外。リンクではなく inline code で所在を案内する）`,
      );
    }
  }
  return outside;
}

const MD_FILES = listMarkdown(DIST_GITHUB);
// リンク・inline code パス・上流レイアウト混入の検査対象: .github/ 配下 + 初期セット内の docs 本体
const LINK_CHECKED_FILES = [...MD_FILES, ...listInitialSetFiles()];

// 相対リンク（絶対 URL・ページ内アンカー・mailto を除く、拡張子付きファイルへのリンク）。
// 拡張子は限定しない — DECISION_TREE.md の雛形表は .skeleton.ts / .sql を指しており、
// .md 限定だと初期セット外への 38 リンクを素通りした（Issue #490 のレビューで発覚）。
// 末尾の `#anchor` を許容する — `foo.md#section` は本リポで一般的な書き方で、
// これを取りこぼすとガードを素通りする（ACE-046 の拡張 grep より広い）。
// キャプチャ 1 = アンカーを除いたパス部分。
const RELATIVE_LINK =
  /\]\((?!https?:\/\/|#|mailto:)([^)\s#]+\.[A-Za-z0-9]+)(?:#[^)\s]*)?\)/g;
// HTMLコメント内の記入例は描画されるリンクではない（ASDD 2.0のACE昇格例）。
// コメント外の同じリンクは通常どおり実在・初期セットを検査する。
function* relativeLinks(content: string): IterableIterator<RegExpMatchArray> {
  const comments = [...content.matchAll(/<!--[\s\S]*?-->/g)];
  for (const link of content.matchAll(RELATIVE_LINK)) {
    // 原文を連結せず、リンクの開始位置がコメント内かを判定する。
    if (!comments.some(comment => link.index >= comment.index && link.index < comment.index + comment[0].length)) yield link;
  }
}
// inline code のパス表記。`docs/...` `.github/...` のみを対象にする
// （`src/services/auth.ts` のような架空の実装例は対象外）。
// 角括弧・山括弧を含むものはプレースホルダー（例: `docs/[フォルダ]/[ファイル名].md`）として除外する。
// 拡張子は限定しない — 初期セット外の雛形（.skeleton.ts / .sql）もこの表記で案内するため。
const INLINE_PATH = /`((?:docs|\.github)\/[^`\s\[\]<>]+\.[A-Za-z0-9]+)`/g;
// 配布ツリーに実体を持たないが正当な inline code パス表記。
//   .github/copilot-instructions.md — /setup-ai-config が利用者側で生成する
//   docs/specs/*.md                 — MASTER.md の仕様書運用例（架空の例示）
//   .github/workflows/xxx.yml       — Issue テンプレ（infra.md）の記入例
// ここに載せる場合は理由を書く（黙って増やすと検査が骨抜きになる）。
const INLINE_PATH_EXEMPT = new Set([
  ".github/copilot-instructions.md",
  "docs/specs/spec-template.md",
  "docs/specs/authentication.md",
  ".github/workflows/xxx.yml",
]);
// frontmatter の references: "a, b" 形式（agents / skills が使う）
const FRONTMATTER_REFERENCES = /^\s*references:\s*"([^"]+)"\s*$/gm;

// 上流レイアウト固有のパス表記。展開先には docs/ しか無いので、この文字列を含む
// 相対パス・ディレクトリ構造図は展開先で誤りになる（Issue #483 / #509）。
const UPSTREAM_LAYOUT_PATH = "docs-template/";
// 配布元の所在を説明する正当な言及。この 2 形だけは展開先レイアウトに対して解決
// されないので除外する。それ以外（`docs-template/MASTER.md` のような相対パス、
// `docs-template/` 起点の構造図）は展開先で切れるため除外しない。
//   1. `${CLAUDE_PLUGIN_ROOT}/docs-template/` — ff-dev-toolkit プラグイン同梱ツリーの絶対参照。
//      初期セット外文書のコピー元案内（MASTER.md「関連ドキュメント」、DEPLOYMENT.md
//      「配置について」注記など）がこの形で書かれる
//   2. 絶対 URL（https://github.com/.../docs-template/...）— MASTER.md 冒頭の「テンプレート
//      直接利用」の配布元リンク、PATTERNS.md の ACE 出典リンクなど。URL は相対解決されない
// 「docs-template ディレクトリ」のようなスラッシュ無しの散文は UPSTREAM_LAYOUT_PATH に
// 一致しないので規則は不要。ここに載せる場合は理由を書く（黙って増やすと検査が骨抜きになる）。
// URL は ASCII の印字可能文字に限り、括弧・引用符・`|`・バッククォートで終端する。全角の句読点や
// 括弧（「URL、docs-template/…」「（URL）docs-template/…」）の向こうまで食うと混入を見逃す。
// `replace` 専用（g フラグの lastIndex を持つので `.test()` / `.exec()` には使わない）。
const UPSTREAM_PATH_EXEMPT_PATTERNS: readonly RegExp[] = [
  /\$\{CLAUDE_PLUGIN_ROOT\}\/docs-template\//g,
  /https?:\/\/(?:(?![)\]>`"'|])[!-~])+/g,
];

/**
 * 1 文書分を行単位で走査し、上流レイアウト固有のパス（docs-template/）が除外形以外で
 * 残っている行を `<label>:<行番号>: <行>` の報告文にして返す。
 * 除外形を行から取り除いてから判定するので、同じ行に除外形と混入が同居しても検出する。
 * 実ファイルに対しては違反ゼロを期待するため、この関数を合成入力で別途固定する
 * （検出器の自己検証）。
 */
function findUpstreamLayoutPaths(
  sourceLabel: string,
  content: string,
): string[] {
  const leaked: string[] = [];
  const LINE_NUMBER_BASE = 1;
  content.split("\n").forEach((line, index) => {
    const masked = UPSTREAM_PATH_EXEMPT_PATTERNS.reduce(
      (acc, pattern) => acc.replace(pattern, ""),
      line,
    );
    if (masked.includes(UPSTREAM_LAYOUT_PATH)) {
      leaked.push(`${sourceLabel}:${index + LINE_NUMBER_BASE}: ${line.trim()}`);
    }
  });
  return leaked;
}

describe("配布版 GitHub テンプレートの参照解決", () => {
  it("検証対象の Markdown が存在する（glob 破綻で空振りしない）", () => {
    expect(MD_FILES.length).toBeGreaterThan(10);
  });

  it("相対リンクが利用者側レイアウトで解決する", () => {
    const broken: string[] = [];
    for (const file of LINK_CHECKED_FILES) {
      const content = readFileSync(file, "utf8");
      const deployedFile = deployedLocation(file);
      for (const match of relativeLinks(content)) {
        const target = resolveLinkTarget(deployedFile, match[1]);
        const templatePath = toTemplatePath(target);
        if (templatePath === null || !existsSync(templatePath)) {
          broken.push(
            `${relative(REPO_ROOT, file)} → ${match[1]} (展開先: ${target})`,
          );
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("inline code のパス表記が配布ツリー内に存在する", () => {
    const broken: string[] = [];
    for (const file of LINK_CHECKED_FILES) {
      const content = readFileSync(file, "utf8");
      for (const match of content.matchAll(INLINE_PATH)) {
        if (INLINE_PATH_EXEMPT.has(match[1])) continue;
        const templatePath = toTemplatePath(match[1]);
        if (templatePath === null || !existsSync(templatePath)) {
          broken.push(`${relative(REPO_ROOT, file)} → ${match[1]}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  // frontmatter の references はエージェントが実行時に解決する機械可読パスなので、
  // 散文の言及ではなくリンクと同じ扱いにする（存在 + 初期セット内の両方を要求する）。
  it("frontmatter の references が配布ツリーに実在し INITIAL_SET 内にある", () => {
    const broken: string[] = [];
    for (const file of MD_FILES) {
      const content = readFileSync(file, "utf8");
      for (const match of content.matchAll(FRONTMATTER_REFERENCES)) {
        for (const ref of match[1].split(",").map((r: string) => r.trim())) {
          if (ref === "") continue;
          const templatePath = toTemplatePath(ref);
          if (templatePath === null || !existsSync(templatePath)) {
            broken.push(
              `${relative(REPO_ROOT, file)} → ${ref}（配布ツリーに無い）`,
            );
          } else if (!isLinkableTarget(ref)) {
            broken.push(
              `${relative(REPO_ROOT, file)} → ${ref}（初期セット外。展開先には配置されない）`,
            );
          }
        }
      }
    }
    expect(broken).toEqual([]);
  });

  // リンクは「展開先に必ず在る」ことが前提。/init-docs が配置しないファイルへ
  // リンクを張ると、パスが正しくても展開先で切れる（Issue #483-1 で
  // review-response-policy.md / agent-deletion-prevention-harness.md が該当した）。
  it("相対リンクの参照先が INITIAL_SET 内にある", () => {
    const outside: string[] = [];
    for (const file of LINK_CHECKED_FILES) {
      outside.push(
        ...findOutOfSetLinks(
          relative(REPO_ROOT, file),
          deployedLocation(file),
          readFileSync(file, "utf8"),
        ),
      );
    }
    expect(outside).toEqual([]);
  });

  // INITIAL_SET は別リポジトリ（ff-dev-toolkit）にある一覧の手書きスナップショット。
  // 配布ツリー側でリネーム・削除が起きた場合はここで落ちる。逆方向（/init-docs が
  // 初期セットを増やした場合）は CI からプラグインを読めないため検出できず、
  // 定数の出典コメントで担保する。
  it("INITIAL_SET の全エントリが配布ツリーに実在する", () => {
    const missing = [...INITIAL_SET].filter((p) => {
      const templatePath = toTemplatePath(p);
      return templatePath === null || !existsSync(templatePath);
    });
    expect(missing).toEqual([]);
  });

  // 検査対象の構成を固定する。「含まれる」ことは toContain が担保し、件数の等式は
  // listInitialSetFiles() が空を返す退行と .github/ との二重計上を捕まえるためのもの
  // （INITIAL_SET の実在は上のテストが担う）。
  it("検証対象に docs 本体の初期セット文書が含まれる（Issue #490）", () => {
    expect(LINK_CHECKED_FILES).toContain(join(TEMPLATE_ROOT, "MASTER.md"));
    expect(LINK_CHECKED_FILES).toContain(
      join(TEMPLATE_ROOT, "05-operations/DEPLOYMENT.md"),
    );
    expect(LINK_CHECKED_FILES.length).toBe(MD_FILES.length + INITIAL_SET.size);
  });

  // 本リポジトリは docs-template/ を自身の docs としてもドッグフードするため、
  // 構造図や相対パスを docs-template/ 起点で書いても本リポでは通ってしまう。
  // 展開先（docs/）で誤りになる表記を .github/ と初期セット文書の両方で拒否する（Issue #509）。
  it("上流レイアウト固有のパス（docs-template/）を含まない", () => {
    const leaked: string[] = [];
    for (const file of LINK_CHECKED_FILES) {
      leaked.push(
        ...findUpstreamLayoutPaths(
          // 報告のラベルは OS によらず `/` 区切り（自己検証のラベルと同じ形）
          toPosixPath(relative(REPO_ROOT, file)),
          readFileSync(file, "utf8"),
        ),
      );
    }
    expect(leaked).toEqual([]);
  });

  // ACE-046: Issue / PR テンプレートは body として展開され、相対リンクが
  // issues/N/ ・ pull/N/ 起点で解決されて 404 になる。採用先リポジトリの URL は
  // 不明で絶対 URL にもできないため、配布版ではリンクにせず inline code で書く。
  it("Issue / PR テンプレートに相対リンクを持たない（ACE-046）", () => {
    const templates = MD_FILES.filter(
      (f) =>
        f.startsWith(join(DIST_GITHUB, "ISSUE_TEMPLATE")) ||
        f === join(DIST_GITHUB, "pull_request_template.md"),
    );
    expect(templates.length).toBeGreaterThan(0);

    const offenders: string[] = [];
    for (const file of templates) {
      for (const match of relativeLinks(readFileSync(file, "utf8"))) {
        offenders.push(`${relative(REPO_ROOT, file)} → ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

// 上のテスト群は実ファイルだけを入力にしており、しかも「違反ゼロ」を期待する形なので、
// 検出器（正規表現・分類）が壊れても緑のまま素通りする。合成入力で検出器自体を固定する。
describe("検出器の自己検証", () => {
  const extract = (md: string) =>
    [...relativeLinks(md)].map((m) => m[1]);

  it("相対リンクを抽出する（アンカー付き・拡張子前の記号を含む）", () => {
    expect(extract("- [MASTER](../../docs/MASTER.md)")).toEqual([
      "../../docs/MASTER.md",
    ]);
    // アンカー付きを取りこぼすとガードを素通りする
    expect(
      extract("[節](../../docs/03-implementation/FALLBACK.md#section-1)"),
    ).toEqual(["../../docs/03-implementation/FALLBACK.md"]);
    // 先頭が h / # 以外という素朴な判定だと落ちる形
    expect(extract("[hooks](hooks/setup.md)")).toEqual(["hooks/setup.md"]);
    // .md 以外の拡張子（雛形ファイル）も展開先で切れるので拾う
    expect(
      extract("[q1](./templates/typescript/q1-http-api-client.skeleton.ts)"),
    ).toEqual(["./templates/typescript/q1-http-api-client.skeleton.ts"]);
    expect(
      extract("[schema](./templates/sql/q1-migration.skeleton.sql)"),
    ).toEqual(["./templates/sql/q1-migration.skeleton.sql"]);
  });

  it("HTMLコメントの記入例を除き、コメント外の同じ壊れたリンクは検出する", () => {
    const example = "出典: [ACE-XXX](../08-knowledge/playbook/<category>.md#ace-xxx)";
    const hidden = `<!-- /ace-refineの記入例\n${example}\n-->`;
    expect(extract(hidden)).toEqual([]);
    expect(extract("[split]<!-- 記入例 -->(missing.md)")).toEqual([]);
    expect(findOutOfSetLinks("PATTERNS.md", "docs/03-implementation/PATTERNS.md", hidden)).toEqual([]);
    expect(extract(`${hidden}\n${example}`)).toEqual(["../08-knowledge/playbook/<category>.md"]);
    expect(findOutOfSetLinks("PATTERNS.md", "docs/03-implementation/PATTERNS.md", `${hidden}\n${example}`)).toHaveLength(1);
  });

  it("inline code のパス表記を抽出する（プレースホルダー・実装例は拾わない）", () => {
    const inline = (md: string) =>
      [...md.matchAll(INLINE_PATH)].map((m) => m[1]);
    expect(
      inline("所在は `docs/05-operations/deployment/git-workflow.md`"),
    ).toEqual(["docs/05-operations/deployment/git-workflow.md"]);
    expect(inline("`.github/skills/test-patterns/SKILL.md`")).toEqual([
      ".github/skills/test-patterns/SKILL.md",
    ]);
    expect(
      inline(
        "`docs/03-implementation/templates/typescript/q1-http-api-client.skeleton.ts`",
      ),
    ).toEqual([
      "docs/03-implementation/templates/typescript/q1-http-api-client.skeleton.ts",
    ]);
    expect(inline("`docs/[フォルダ]/[ファイル名].md`")).toEqual([]);
    expect(inline("`src/services/auth.ts`")).toEqual([]);
  });

  it("初期セット外リンクを、参照元と展開先の参照先つきで報告する", () => {
    const report = findOutOfSetLinks(
      "docs-template/05-operations/DEPLOYMENT.md",
      "docs/05-operations/DEPLOYMENT.md",
      "詳細は [git-workflow](./deployment/git-workflow.md#step-1) を参照",
    );
    expect(report).toHaveLength(1);
    expect(report[0]).toContain("docs-template/05-operations/DEPLOYMENT.md");
    expect(report[0]).toContain(
      "docs/05-operations/deployment/git-workflow.md",
    );
    // 初期セット内・.github/ 配下へのリンクは報告しない
    expect(
      findOutOfSetLinks(
        "docs-template/MASTER.md",
        "docs/MASTER.md",
        "[P](./01-context/PROJECT.md) [S](../.github/skills/x/SKILL.md)",
      ),
    ).toEqual([]);
  });

  // Issue #509: 初期セット文書へ拡張した混入検査の検出器を固定する。展開先で誤りになる
  // 相対パス・構造図は参照元と行番号つきで報告し、配布元の所在を示す正当な 2 形は拾わない。
  it("上流レイアウト固有のパスを、参照元と行番号つきで報告する（除外形は拾わない）", () => {
    const label = "docs-template/03-implementation/CONVENTIONS.md";
    // 相対パス（展開先に docs-template/ は無い）
    const relativeLeak = findUpstreamLayoutPaths(
      label,
      "詳細は `docs-template/MASTER.md` を参照",
    );
    expect(relativeLeak).toHaveLength(1);
    expect(relativeLeak[0]).toContain(`${label}:1:`);
    expect(relativeLeak[0]).toContain("docs-template/MASTER.md");
    // ディレクトリ構造図の起点（行番号は 1 始まり）
    expect(
      findUpstreamLayoutPaths(label, "```\ndocs-template/\n├── MASTER.md\n```"),
    ).toEqual([`${label}:2: docs-template/`]);
    // 除外形 1: プラグイン同梱ツリーの絶対参照
    expect(
      findUpstreamLayoutPaths(
        label,
        "`${CLAUDE_PLUGIN_ROOT}/docs-template/README.md` からコピー",
      ),
    ).toEqual([]);
    // 除外形 2: 絶対 URL（Markdown リンクの括弧内でも URL の終端で止まる）
    expect(
      findUpstreamLayoutPaths(
        label,
        "[配布元](https://github.com/feel-flow/ff-dev-toolkit/tree/HEAD/plugins/ff-dev-toolkit/docs-template) から取得",
      ),
    ).toEqual([]);
    // 同じ行に除外形と混入が同居しても、混入の方は検出する
    expect(
      findUpstreamLayoutPaths(
        label,
        "`${CLAUDE_PLUGIN_ROOT}/docs-template/README.md` を `docs-template/README.md` に置く",
      ),
    ).toHaveLength(1);
    // URL と混入の同居（空白無し）。URL のマスクが `)` で止まらないと見逃す
    expect(
      findUpstreamLayoutPaths(
        label,
        "[配布元](https://github.com/x/docs-template/a.md)と[x](docs-template/MASTER.md)",
      ),
    ).toHaveLength(1);
    // URL の直後が全角の句読点・括弧でも、URL のマスクはそこで止まる
    expect(
      findUpstreamLayoutPaths(
        label,
        "https://github.com/x/README.md、docs-template/MASTER.md を参照（https://github.com/x）docs-template/a.md",
      ),
    ).toHaveLength(1);
    // スラッシュ無しの散文（配布元の所在説明）は対象外
    expect(
      findUpstreamLayoutPaths(label, "docs-template ディレクトリから配布される"),
    ).toEqual([]);
  });

  it("リンクでないものを拾わない", () => {
    expect(extract("[外部](https://example.com/a.md)")).toEqual([]);
    expect(extract("[見出しへ](#section)")).toEqual([]);
    expect(extract("`docs/MASTER.md` は inline code")).toEqual([]);
  });

  it("配布ファイルを利用者側レイアウトの配置へ写像する", () => {
    expect(
      deployedLocation(join(TEMPLATE_ROOT, ".github/ISSUE_TEMPLATE/bug.md")),
    ).toBe(".github/ISSUE_TEMPLATE/bug.md");
    expect(deployedLocation(join(TEMPLATE_ROOT, "MASTER.md"))).toBe(
      "docs/MASTER.md",
    );
    expect(
      deployedLocation(join(TEMPLATE_ROOT, "05-operations/DEPLOYMENT.md")),
    ).toBe("docs/05-operations/DEPLOYMENT.md");
    // docs 本体からの相対リンクは docs/ 起点で解決される
    expect(
      resolveLinkTarget(
        "docs/05-operations/DEPLOYMENT.md",
        "./deployment/git-workflow.md",
      ),
    ).toBe("docs/05-operations/deployment/git-workflow.md");
    expect(
      isLinkableTarget("docs/05-operations/deployment/git-workflow.md"),
    ).toBe(false);
  });

  it("参照先を利用者側レイアウトのパスへ解決する", () => {
    expect(
      resolveLinkTarget(
        ".github/ISSUE_TEMPLATE/bug.md",
        "../../docs/MASTER.md",
      ),
    ).toBe("docs/MASTER.md");
    expect(
      resolveLinkTarget(
        ".github/skills/error-handling-standards/SKILL.md",
        "../../../docs/03-implementation/FALLBACK.md",
      ),
    ).toBe("docs/03-implementation/FALLBACK.md");
  });

  it("リンクとして許される参照先を判定する", () => {
    expect(isLinkableTarget("docs/MASTER.md")).toBe(true);
    expect(isLinkableTarget(".github/skills/test-patterns/SKILL.md")).toBe(
      true,
    );
    // /init-docs が配置しない = リンクにしてはいけない
    expect(
      isLinkableTarget(
        "docs/05-operations/deployment/review-response-policy.md",
      ),
    ).toBe(false);
  });
});
