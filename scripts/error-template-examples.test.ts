import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const root = new URL("../docs-template/", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const documents = () => ({
  errors: read("03-implementation/ERRORS.md"),
  fallback: read("03-implementation/FALLBACK.md"),
  patterns: read("03-implementation/PATTERNS.md"),
  testing: read("04-quality/TESTING.md"),
  skill: read(".github/skills/error-handling-standards/SKILL.md"),
});

async function verify(input: ReturnType<typeof documents>) {
  const results: { pass: boolean; label: string; detail?: string }[] = [];
  const modulePath = new URL("./error-template-examples.mjs", import.meta.url);
  const { verifyErrorExamples } = await import(fileURLToPath(modulePath));
  await verifyErrorExamples(
    input,
    (pass: boolean, label: string, detail?: string) =>
      results.push({ pass, label, detail }),
  );
  return results;
}

test("公開する実コードで外部分類・cause・環境分岐・決済 DI の成功と失敗を検証する", async () => {
  const results = await verify(documents());
  expect(results, JSON.stringify(results)).toHaveLength(2);
  expect(
    results.every((result) => result.pass),
    JSON.stringify(results),
  ).toBe(true);
});

test.each([
  "missing",
  "permissive",
  "raw-cause",
  "environment",
  "real-payment",
])("安全契約を壊す変異を検出する: %s", async (mutation) => {
  const input = documents();
  const replace = (
    key: keyof typeof input,
    before: string,
    after: string,
    count = 1,
  ) => {
    expect(input[key].split(before)).toHaveLength(count + 1);
    input[key] = input[key].replace(before, after);
  };
  if (mutation === "missing") input.errors = "";
  if (mutation === "permissive")
    replace(
      "errors",
      'class UnknownExternalError extends AppError {\n  readonly category: ErrorCategory = "never-fallback";',
      'class UnknownExternalError extends AppError {\n  readonly category: ErrorCategory = "transient";',
    );
  if (mutation === "raw-cause")
    replace(
      "errors",
      "const cause = error;",
      "const cause = new Error(String(error));",
    );
  if (mutation === "environment")
    replace(
      "fallback",
      'if (env !== "production") {',
      'if (env === "test") {',
      2,
    );
  if (mutation === "real-payment")
    replace("testing", "useValue: payment", "useValue: new PaymentService(),");
  const results = await verify(input);
  expect(
    results.some((result) => !result.pass),
    JSON.stringify(results),
  ).toBe(true);
});

test.each([false, true])(
  "性能ガイドの失敗返却を実行し、未定義 err の変異も検出する: %s",
  async (mutate) => {
    const input = {
      ...documents(),
      performance: read(
        "08-knowledge/best-practices/03-performance-and-operations.md",
      ),
    };
    if (mutate) {
      const needle = "return { success: false, error };";
      expect(input.performance.split(needle)).toHaveLength(2);
      input.performance = input.performance.replace(
        needle,
        "return { success: false, error: err };",
      );
    }
    const { verifyPerformanceExample } = await import(
      fileURLToPath(new URL("./error-template-examples.mjs", import.meta.url))
    );
    const results: { pass: boolean; label: string; detail?: string }[] = [];
    await verifyPerformanceExample(
      input,
      (pass: boolean, label: string, detail?: string) =>
        results.push({ pass, label, detail }),
    );
    expect(results, JSON.stringify(results)).toHaveLength(1);
    expect(results[0].pass, JSON.stringify(results)).toBe(!mutate);
  },
);
