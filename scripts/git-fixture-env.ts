import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const GIT_FIXTURE_USER_NAME = "test";
export const GIT_FIXTURE_USER_EMAIL = "test@example.com";

const NULL_CONFIG = process.platform === "win32" ? "NUL" : "/dev/null";
const CONFIG_DIR = mkdtempSync(join(tmpdir(), "asdd-git-fixture-config-"));
const GLOBAL_CONFIG = join(CONFIG_DIR, "global.gitconfig");

writeFileSync(
  GLOBAL_CONFIG,
  `[user]\n\tname = ${GIT_FIXTURE_USER_NAME}\n\temail = ${GIT_FIXTURE_USER_EMAIL}\n`,
);

/**
 * Git fixture の子プロセス環境（Issue #529）。
 * hook が渡す GIT_DIR を継承すると、cwd が一時ディレクトリでも
 * git config / commit は呼び出し元リポジトリを向く。
 * 継承 GIT_* は捨て、identity は専用 GIT_CONFIG_GLOBAL と
 * GIT_AUTHOR_* / GIT_COMMITTER_* に閉じ、local user.name は書かない。
 * extra の GIT_* は採用しない（GIT_DIR を戻すと #529 が再発する）。
 * GIT_CONFIG_NOSYSTEM で /etc/gitconfig を遮断し、GIT_CONFIG_SYSTEM は null device。
 */
export function gitFixtureEnv(
  extra: Record<string, string | undefined> = {},
): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && !key.startsWith("GIT_")) env[key] = value;
  }
  for (const [key, value] of Object.entries(extra)) {
    if (key.startsWith("GIT_")) continue;
    if (value === undefined) delete env[key];
    else env[key] = value;
  }
  env.GIT_CONFIG_GLOBAL = GLOBAL_CONFIG;
  env.GIT_CONFIG_SYSTEM = NULL_CONFIG;
  env.GIT_CONFIG_NOSYSTEM = "1";
  env.GIT_AUTHOR_NAME = GIT_FIXTURE_USER_NAME;
  env.GIT_AUTHOR_EMAIL = GIT_FIXTURE_USER_EMAIL;
  env.GIT_COMMITTER_NAME = GIT_FIXTURE_USER_NAME;
  env.GIT_COMMITTER_EMAIL = GIT_FIXTURE_USER_EMAIL;
  return env;
}
