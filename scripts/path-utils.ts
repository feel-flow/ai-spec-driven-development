import { sep } from "node:path";

// 純粋なパス処理だけを置く。shell-tools.ts は import 時に git --exec-path を起動するので、
// 子プロセスを使わないテストはこちらから import する。ファイル名は vitest の include
// （scripts/**/*.test.ts）に一致させないこと。
// sync-to-public.mjs / check-md-typescript.mjs にも同じ関数がある（.mjs と .ts は import し合えない）。

/**
 * OS のパス区切りを `/` に揃える（Issue #575）。
 * 利用者側レイアウトのパスは `.github/...` `docs/...` の `/` 区切りで扱うが、
 * normalize / join / relative は Windows で `\` を返すので、判定・比較の前に必ず通す。
 */
export function toPosixPath(p: string): string {
  return p.split(sep).join("/");
}
