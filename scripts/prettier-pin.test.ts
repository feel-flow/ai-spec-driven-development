import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXACT_SEMVER = /^\d+\.\d+\.\d+$/;

function isExactVersion(spec: unknown): spec is string {
  return typeof spec === "string" && EXACT_SEMVER.test(spec);
}

describe("prettier version pin (Issue #485)", () => {
  it("rejects caret/tilde ranges so a broken detector cannot stay green", () => {
    expect(isExactVersion("^3.8.3")).toBe(false);
    expect(isExactVersion("~3.8.3")).toBe(false);
    expect(isExactVersion("3.8.3")).toBe(true);
  });

  it("pins prettier in package.json without a range", () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as {
      devDependencies?: { prettier?: string };
    };
    const spec = pkg.devDependencies?.prettier;
    expect(isExactVersion(spec), `prettier spec must be exact, got ${String(spec)}`).toBe(true);
  });

  it("records the same exact prettier version in package-lock.json", () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8")) as {
      devDependencies?: { prettier?: string };
    };
    const lock = JSON.parse(readFileSync(join(REPO_ROOT, "package-lock.json"), "utf8")) as {
      packages?: Record<string, { version?: string; devDependencies?: { prettier?: string } }>;
    };
    const spec = pkg.devDependencies?.prettier;
    expect(lock.packages?.[""]?.devDependencies?.prettier).toBe(spec);
    expect(lock.packages?.["node_modules/prettier"]?.version).toBe(spec);
  });
});
