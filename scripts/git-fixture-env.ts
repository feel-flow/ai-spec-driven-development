import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Git fixture の子プロセス環境（Issue #529）。
 * pre-push 等がセットする GIT_DIR / GIT_INDEX_FILE を継承すると、
 * cwd が一時ディレクトリでも git config / commit が呼び出し元リポジトリを向く。
 */
export const GIT_FIXTURE_USER_NAME = "test";
export const GIT_FIXTURE_USER_EMAIL = "test@example.com";

const CONFIG_DIR = join(tmpdir(), "asdd-git-fixture-config");
const GLOBAL_CONFIG = join(CONFIG_DIR, "global.gitconfig");
const SYSTEM_CONFIG = join(CONFIG_DIR, "system.gitconfig");

function ensureFixtureConfigFiles(): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(
    GLOBAL_CONFIG,
    `[user]\n\tname = ${GIT_FIXTURE_USER_NAME}\n\temail = ${GIT_FIXTURE_USER_EMAIL}\n`,
  );
  writeFileSync(SYSTEM_CONFIG, "");
}

export function gitFixtureEnv(
  extra: Record<string, string | undefined> = {},
): Record<string, string> {
  ensureFixtureConfigFiles();
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && !key.startsWith("GIT_")) env[key] = value;
  }
  env.GIT_CONFIG_GLOBAL = GLOBAL_CONFIG;
  env.GIT_CONFIG_SYSTEM = SYSTEM_CONFIG;
  env.GIT_CONFIG_NOSYSTEM = "1";
  env.GIT_AUTHOR_NAME = GIT_FIXTURE_USER_NAME;
  env.GIT_AUTHOR_EMAIL = GIT_FIXTURE_USER_EMAIL;
  env.GIT_COMMITTER_NAME = GIT_FIXTURE_USER_NAME;
  env.GIT_COMMITTER_EMAIL = GIT_FIXTURE_USER_EMAIL;
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }
  return env;
}
