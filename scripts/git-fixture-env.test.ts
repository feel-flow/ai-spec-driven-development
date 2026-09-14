import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  GIT_FIXTURE_USER_EMAIL,
  GIT_FIXTURE_USER_NAME,
  gitFixtureEnv,
} from "./git-fixture-env";

const NULL_CONFIG = process.platform === "win32" ? "NUL" : "/dev/null";
const PROBE_NAME = "real-user";
const PROBE_EMAIL = "real@example.com";

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function isolatedEnv(
  name: string,
  email: string,
  extra: Record<string, string> = {},
): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && !key.startsWith("GIT_")) env[key] = value;
  }
  env.GIT_CONFIG_GLOBAL = NULL_CONFIG;
  env.GIT_CONFIG_SYSTEM = NULL_CONFIG;
  env.GIT_AUTHOR_NAME = name;
  env.GIT_AUTHOR_EMAIL = email;
  env.GIT_COMMITTER_NAME = name;
  env.GIT_COMMITTER_EMAIL = email;
  return { ...env, ...extra };
}

function git(
  cwd: string,
  env: NodeJS.ProcessEnv,
  ...args: string[]
): ReturnType<typeof spawnSync> {
  return spawnSync("git", args, { cwd, encoding: "utf8", env });
}

function makeProbe(): { dir: string; gitDir: string; config: Buffer } {
  const dir = mkdtempSync(join(tmpdir(), "git-identity-probe-"));
  dirs.push(dir);
  const env = isolatedEnv(PROBE_NAME, PROBE_EMAIL);
  const init = git(dir, env, "init", "-b", "develop");
  expect(init.status, init.stderr).toBe(0);
  const name = git(dir, env, "config", "user.name", PROBE_NAME);
  const email = git(dir, env, "config", "user.email", PROBE_EMAIL);
  expect(name.status, name.stderr).toBe(0);
  expect(email.status, email.stderr).toBe(0);
  writeFileSync(join(dir, "README"), "probe\n");
  expect(git(dir, env, "add", "README").status).toBe(0);
  expect(git(dir, env, "commit", "-m", "init").status).toBe(0);
  return {
    dir,
    gitDir: git(dir, env, "rev-parse", "--absolute-git-dir").stdout.trim(),
    config: readFileSync(join(dir, ".git", "config")),
  };
}

describe("Git fixture 環境の隔離（Issue #529）", () => {
  it("フック相当の GIT_DIR を継承した git config は別リポジトリの identity を書き換える", () => {
    const probe = makeProbe();
    const unrelated = mkdtempSync(join(tmpdir(), "git-identity-unrelated-"));
    dirs.push(unrelated);
    const leaked = git(unrelated, {
      ...process.env,
      GIT_DIR: probe.gitDir,
      GIT_WORK_TREE: probe.dir,
    }, "config", "user.name", GIT_FIXTURE_USER_NAME);
    expect(leaked.status, leaked.stderr).toBe(0);
    expect(readFileSync(join(probe.dir, ".git", "config"), "utf8")).toMatch(
      /name\s*=\s*test/,
    );
    expect(readFileSync(join(probe.dir, ".git", "config")).equals(probe.config)).toBe(
      false,
    );
  });

  it("gitFixtureEnv は GIT_DIR を捨て、probe の config を byte-identical のままにする", () => {
    const probe = makeProbe();
    const previousDir = process.env.GIT_DIR;
    const previousWorkTree = process.env.GIT_WORK_TREE;
    process.env.GIT_DIR = probe.gitDir;
    process.env.GIT_WORK_TREE = probe.dir;
    try {
      const fixture = mkdtempSync(join(tmpdir(), "git-identity-fixture-"));
      dirs.push(fixture);
      const env = gitFixtureEnv();
      expect(env.GIT_DIR).toBeUndefined();
      expect(env.GIT_WORK_TREE).toBeUndefined();
      expect(git(fixture, env, "init", "-b", "develop").status).toBe(0);
      writeFileSync(join(fixture, "README"), "fixture\n");
      expect(git(fixture, env, "add", "README").status).toBe(0);
      const commit = git(fixture, env, "commit", "-m", "fixture");
      expect(commit.status, commit.stderr).toBe(0);
      const author = git(
        fixture,
        env,
        "log",
        "-1",
        "--format=%an <%ae>",
      ).stdout.trim();
      expect(author).toBe(`${GIT_FIXTURE_USER_NAME} <${GIT_FIXTURE_USER_EMAIL}>`);
      expect(readFileSync(join(probe.dir, ".git", "config")).equals(probe.config)).toBe(
        true,
      );
    } finally {
      if (previousDir === undefined) delete process.env.GIT_DIR;
      else process.env.GIT_DIR = previousDir;
      if (previousWorkTree === undefined) delete process.env.GIT_WORK_TREE;
      else process.env.GIT_WORK_TREE = previousWorkTree;
    }

    const afterEnv = isolatedEnv(PROBE_NAME, PROBE_EMAIL);
    const after = git(probe.dir, afterEnv, "commit", "--allow-empty", "-m", "after");
    expect(after.status, after.stderr).toBe(0);
    const probeAuthor = git(
      probe.dir,
      afterEnv,
      "log",
      "-1",
      "--format=%an <%ae>",
    ).stdout.trim();
    expect(probeAuthor).toBe(`${PROBE_NAME} <${PROBE_EMAIL}>`);
  });

  it("extra の GIT_DIR は採用せず、config パスはプロセス固有である", () => {
    const env = gitFixtureEnv({
      GIT_DIR: "/tmp/evil",
      GIT_WORK_TREE: "/tmp/evil",
    });
    expect(env.GIT_DIR).toBeUndefined();
    expect(env.GIT_WORK_TREE).toBeUndefined();
    expect(env.GIT_CONFIG_GLOBAL).toContain("asdd-git-fixture-config-");
    expect(env.GIT_CONFIG_GLOBAL).not.toBe(
      join(tmpdir(), "asdd-git-fixture-config", "global.gitconfig"),
    );
  });
});
