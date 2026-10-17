// 配布文書の実コードを検証する。ff-dev-toolkit v0.154.0 の検証器を移植（Issue #586）。
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { Script, createContext } from "node:vm";

const require = createRequire(new URL("../package.json", import.meta.url));
const ts = require("typescript");

function block(document, needle) {
  const matches = [...document.matchAll(/```typescript\n([\s\S]*?)\n```/g)]
    .map((match) => match[1])
    .filter((code) => code.includes(needle));
  assert.equal(
    matches.length,
    1,
    `expected exactly one non-empty example: ${needle}`,
  );
  return matches[0];
}

function run(code, context) {
  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
    reportDiagnostics: true,
  });
  assert.equal(
    result.diagnostics.length,
    0,
    "example must parse as TypeScript",
  );
  return new Script(result.outputText).runInContext(context, { timeout: 3000 });
}

export async function verifyErrorExamples(documents, check) {
  try {
    const { errors, fallback, patterns, testing, skill } = documents;
    assert.ok(
      skill && !skill.includes("new Error(String(error))"),
      "skill preserves original unknown values",
    );
    assert.ok(
      skill.includes('env !== "production"'),
      "skill permits only explicit production",
    );
    assert.ok(
      skill.includes("UnknownExternalError"),
      "skill documents unknown external failures",
    );
    const context = createContext({
      assert,
      DOMException,
      capturedLogs: [],
      process: { env: {} },
      setTimeout: (fn) => fn(),
      console: {
        error: (value) => context.capturedLogs.push(JSON.parse(value)),
        log() {},
      },
      logger: { error() {}, warn() {} },
      Result: { fail: (error) => ({ error }), ok: (value) => ({ value }) },
      userRepository: {
        findById: async () => {
          throw { status: 401, payload: "original" };
        },
      },
      fetchUser: async () => {
        throw { status: 403, payload: "original" };
      },
      configService: {
        get: async (key) => {
          throw key === "missing"
            ? new Error("missing setting")
            : { status: 503 };
        },
      },
    });
    run(block(errors, "abstract class AppError"), context);
    run(block(errors, "function normalizeExternalError("), context);
    run(block(errors, "function normalizeDynamoDbError("), context);
    run(block(patterns, "interface Logger {"), context);
    run("logger = new JsonLogger();", context);
    run(block(fallback, "function fallbackInProdOnly<"), context);
    run(block(fallback, "async function retryWithBackoff<"), context);
    run(block(errors, "async function readUpstreamJson("), context);
    run(block(errors, "async function processUser("), context);
    run("class DataFetchError extends Error {}", context);
    run(block(patterns, "// Promise チェーンパターン"), context);
    run(block(fallback, "// 方法1（推奨）"), context);
    await run(
      `(async () => {
      const original = { payload: [1, 2], nested: { secret: "keep" } };
      for (const error of [original, new Error("unknown"), "failure", null, undefined,
        new TypeError("Failed to fetch"), new SyntaxError("Unexpected token <"),
        { code: "TLS_CERT_ERROR" }, { cause: { code: "ARBITRARY_CODE" } }, new DOMException("cancelled", "AbortError"),
        { code: "ECONNABORTED" }]) {
        const normalized = normalizeExternalError(error);
        assert.equal(normalized.category, "never-fallback");
        assert.equal(normalized.cause, error);
        assert.equal(isRetryableError(normalized), false);
        process.env.NODE_ENV = "production";
        assert.throws(() => fallbackInProdOnly("fallback", normalized), (thrown) => thrown === normalized);
        let calls = 0;
        await assert.rejects(() => retryWithBackoff(async () => { calls++; throw error; },
          { operation: "unknown", baseDelayMs: 0 }), (thrown) => thrown.cause === error);
        assert.equal(calls, 1);
      }
      for (const [error, Type] of [
        [{ $metadata: { httpStatusCode: 401 } }, UnauthorizedError],
        [{ $metadata: { httpStatusCode: 403 } }, ForbiddenError],
        [{ response: { statusCode: 401 } }, UnauthorizedError],
        [{ response: { statusCode: 403 } }, ForbiddenError],
        [{ response: { status: 401 } }, UnauthorizedError],
        [{ statusCode: 403 }, ForbiddenError],
        [{ code: 401, response: {} }, UnauthorizedError],
        [{ statusCode: "401", response: { status: 403 } }, ForbiddenError],
        [{ statusCode: NaN, $metadata: { httpStatusCode: 401 } }, UnauthorizedError],
        [{ statusCode: 999, response: { statusCode: 403 } }, ForbiddenError],
        [{ status: 401, cause: { code: "ETIMEDOUT" } }, UnauthorizedError],
        [Object.assign(new TypeError("fetch"), { status: 403 }), ForbiddenError],
      ]) {
        const normalized = normalizeExternalError(error);
        assert.ok(normalized instanceof Type);
        assert.equal(normalized.category, "never-fallback");
        assert.equal(normalized.cause, error);
      }
      for (const status of [400, 422]) assert.ok(normalizeExternalError({ status }) instanceof UpstreamRejectedError);
      assert.ok(normalizeExternalError({ status: 404 }) instanceof NotFoundError);
      assert.ok(normalizeExternalError({ status: 409 }) instanceof ConflictError);
      for (const status of [200, 302]) assert.equal(normalizeExternalError({ status }).category, "never-fallback");
      for (const error of [{ status: 429 }, { status: 503 }, { code: "ECONNRESET" },
        new TypeError("fetch failed", { cause: { code: "ETIMEDOUT" } }),
        new DOMException("timed out", "TimeoutError")]) {
        const normalized = normalizeExternalError(error);
        assert.equal(normalized.category, "transient");
        assert.equal(isRetryableError(normalized), true);
        assert.equal(normalized.cause, error);
      }
      for (const name of ["ProvisionedThroughputExceededException", "ThrottlingException"]) {
        const error = { name, $metadata: { httpStatusCode: 400 } };
        assert.equal(normalizeDynamoDbError(error).category, "transient");
        assert.equal(normalizeDynamoDbError(error).cause, error);
        for (const status of [401, 403]) {
          assert.equal(normalizeDynamoDbError({ name, $metadata: { httpStatusCode: status } }).category, "never-fallback");
        }
      }
      assert.equal(normalizeDynamoDbError({ name: "Unknown", $metadata: { httpStatusCode: 400 } }).category, "never-fallback");
      let retryCalls = 0;
      assert.equal(await retryWithBackoff(async () => {
        if (++retryCalls === 1) throw { code: "ECONNRESET" }; return "recovered";
      }, { operation: "retry", baseDelayMs: 0 }), "recovered");
      assert.equal(retryCalls, 2);
      const invalidJson = new SyntaxError("HTML instead of JSON");
      await assert.rejects(() => readUpstreamJson({ ok: true, json: async () => { throw invalidJson; } }),
        (error) => error.category === "never-fallback" && error.cause === invalidJson);
      await assert.rejects(() => readUpstreamJson({ ok: false, status: 401 }),
        (error) => error instanceof UnauthorizedError);
      const droppedBody = { code: "ECONNRESET" };
      await assert.rejects(() => readUpstreamJson({ ok: true, json: async () => { throw droppedBody; } }),
        (error) => error.category === "transient" && error.cause === droppedBody);
      logger.error("original", { response: { statusCode: 403 }, body: "denied" });
      assert.equal(capturedLogs.at(-1).error.status, 403);
      assert.equal(capturedLogs.at(-1).error.body, "denied");
      const forbidden = new UnauthorizedError("auth", { cause: original });
      assert.equal(normalizeExternalError(forbidden), forbidden);
      const transient = new UpstreamError("down", { cause: original });
      for (const env of [undefined, "", "staging", "development", "test", "unknown"]) {
        if (env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = env;
        assert.throws(() => fallbackInProdOnly("fallback", transient), (thrown) => thrown === transient);
        await assert.rejects(() => getConfig("temporary"), (error) => error.category === "transient");
      }
      process.env.NODE_ENV = "production";
      assert.equal(fallbackInProdOnly("fallback", transient), "fallback");
      assert.equal(await getConfig("temporary"), "");
      for (const error of [original, null, "raw"]) {
        assert.throws(() => fallbackInProdOnly("fallback", error), (thrown) => thrown === error);
      }
      const processed = await processUser("user");
      assert.equal(processed.error.cause.status, 401);
      assert.equal(processed.error.cause.payload, "original");
      assert.equal(capturedLogs.at(-1).error.status, 401);
      await assert.rejects(() => fetchUserWithPosts("user"), (error) =>
        error.cause.status === 403 && error.cause.payload === "original");
      await assert.rejects(() => getConfig("missing"), (error) => error.category === "never-fallback");
    })()`,
      context,
    );
    run(block(skill, "async function processUser("), context);
    await run(
      `(async () => {
      const result = await processUser("user");
      assert.equal(result.error.cause.status, 401);
      assert.equal(result.error.cause.payload, "original");
    })()`,
      context,
    );
    run(block(patterns, "async function fetchUserWithPosts("), context);
    await run(
      `assert.rejects(() => fetchUserWithPosts("user"), (error) =>
      error.cause.status === 403 && error.cause.payload === "original")`,
      context,
    );
    check(
      true,
      "エラー例の実行: 不明エラーの禁止・SDK status・無効候補・cause・環境・再試行",
    );

    // Execute the sample's own beforeEach and success/failure tests with a local HTTP/DI harness.
    // No server, network access or real payment provider is available in this context.
    const paymentExample = block(testing, 'describe("Payment Integration"');
    for (const env of [undefined, "test", "production"]) {
      const paymentContext = createContext({
        assert,
        process: { env: env === undefined ? {} : { NODE_ENV: env } },
      });
      run(block(errors, "abstract class AppError"), paymentContext);
      run(
        `
        const tests = []; let setup; let selected; let registrations = 0;
        const container = { register(name, entry) {
          assert.equal(name, "PaymentService");
          assert.ok(entry.useValue instanceof MockPaymentService);
          selected = entry.useValue; registrations++;
        }};
        class PaymentService { constructor() { throw new Error("real provider forbidden"); } }
        const describe = (_name, fn) => fn();
        const beforeEach = (fn) => { setup = fn; };
        const it = (name, fn) => tests.push({ name, fn });
        const createApp = async () => ({ payment: selected });
        const expect = (value) => ({
          toHaveProperty: (key) => assert.ok(Object.hasOwn(value, key)),
          not: { toHaveProperty: (key) => assert.ok(!Object.hasOwn(value, key)) },
        });
        const request = (app) => ({ post: () => ({ send: ({ amount }) => ({
          expect: async (status) => {
            let actual; let body;
            try { const result = await app.payment.createPaymentIntent(amount);
              actual = 200; body = { paymentIntentId: result.id };
            } catch (error) { assert.ok(error instanceof AppError); actual = error.statusCode; body = { code: error.code }; }
            assert.equal(actual, status); return { body };
          }
        }) }) });
      `,
        paymentContext,
      );
      run(paymentExample, paymentContext);
      await run(
        `(async () => {
        assert.equal(typeof setup, "function"); assert.ok(tests.length >= 2);
        for (const test of tests) { await setup(); await test.fn(); }
        assert.equal(registrations, tests.length);
      })()`,
        paymentContext,
      );
    }
    check(
      true,
      "決済テスト例の実行: 環境未設定/test/production のすべてでモック DI・成功と失敗",
    );
  } catch (error) {
    check(
      false,
      "配布エラー処理例の実行契約（例の不在・空・改名・意味の変更も赤）",
      error.stack,
    );
  }
}
