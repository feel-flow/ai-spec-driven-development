---
title: "ERRORS"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "2026-10-15"
changeImpact: "medium"
---

# ERRORS.md - エラー型と外部境界の正規化

> **Origin**: [PATTERNS.md](./PATTERNS.md) セクション 3（エラーハンドリング） | **Related**: [FALLBACK.md](./FALLBACK.md)

`AppError` 階層・`ErrorCategory`・`HTTP_STATUS`・`normalizeExternalError()` の正典。PATTERNS.md §3 は索引で、定義は本ファイルで維持する。

## 1. カスタムエラークラス

```typescript
// 前提: tsconfig の lib に ES2022 を含める（Error.cause / new Error(message, { cause })）。
// options.cause で元エラー（外部 SDK のエラー等）を保持する。元エラーの status / code /
// レスポンス本文が消えると、呼び出し元は「利用者が対処できる失敗（カード拒否）」と
// 「再試行すべき障害（API 障害）」を区別できない。ラップするときは必ず cause を渡す。
type AppErrorOptions = { cause?: unknown };

// エラー分類。フォールバック可否・再試行可否は statusCode から推測せず、各サブクラスが
// 宣言する（抽象メンバなので、サブクラスを追加した瞬間にコンパイルが宣言を要求する）。
//   never-fallback: 認証・認可・バリデーション・データ整合性・セキュリティ・上流の恒久拒否
//                   （自コードの要求誤り）— 環境を問わずスロー、再試行しない（FALLBACK.md Section 1）
//   transient:      外部サービスの一時障害 — 再試行可、本番ではフォールバック可
//   permanent:      再試行しても結果が変わらない失敗（未検出・自コードのバグ）
//                   — 再試行しない、本番ではフォールバック可
type ErrorCategory = "never-fallback" | "transient" | "permanent";

// エラー基底クラス。code / statusCode は readonly（分類の判定入力を後から書き換えさせない）
abstract class AppError extends Error {
  abstract readonly category: ErrorCategory;

  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    options?: AppErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

// HTTP ステータス（意味のある値の定数化（採用時） / MASTER.md）。エラー階層と正規化で共用する
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
} as const;

// バリデーション詳細の型定義（any[] の代わりに明示的な型を使用し型安全性を確保）
interface ValidationDetail {
  field: string;
  message: string;
  constraint?: string;
}

// 具体的なエラークラス
class ValidationError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(
    message: string,
    // readonly: 呼び出し元へ返した配列を書き換えられないようにする
    public readonly details: readonly ValidationDetail[],
    options?: AppErrorOptions,
  ) {
    super(message, "VALIDATION_ERROR", HTTP_STATUS.BAD_REQUEST, options);
  }
}

class NotFoundError extends AppError {
  readonly category: ErrorCategory = "permanent";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "NOT_FOUND", HTTP_STATUS.NOT_FOUND, options);
  }
}

class ForbiddenError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "FORBIDDEN", HTTP_STATUS.FORBIDDEN, options);
  }
}

class ConflictError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "CONFLICT", HTTP_STATUS.CONFLICT, options);
  }
}

// 認証エラー（未認証）。認可エラー(ForbiddenError)と合わせて
// FALLBACK.md のフォールバック禁止カテゴリを構成する
class UnauthorizedError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "UNAUTHORIZED", HTTP_STATUS.UNAUTHORIZED, options);
  }
}

// セキュリティ違反（改ざん検知・署名不一致・レート制限違反など）
class SecurityError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "SECURITY_VIOLATION", HTTP_STATUS.FORBIDDEN, options);
  }
}

// 予期しない内部エラー（詳細はログに残し、利用者には露出しない）。自コードのバグは
// 再試行しても直らないので permanent
class InternalError extends AppError {
  readonly category: ErrorCategory = "permanent";
  constructor(message: string, options?: AppErrorOptions) {
    super(
      message,
      "INTERNAL_ERROR",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      options,
    );
  }
}

// 外部サービス（決済・メール・API）の一時的な障害。transient を宣言する既定の型で、
// サービス固有の型（INTEGRATIONS.md の PaymentError 等）も transient を宣言すれば再試行対象になる
class UpstreamError extends AppError {
  readonly category: ErrorCategory = "transient";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "UPSTREAM_UNAVAILABLE", HTTP_STATUS.BAD_GATEWAY, options);
  }
}

// 外部サービスがこちらの要求を恒久的に拒否した（4xx）。利用者の入力検証エラー
// （ValidationError）とは別物として扱う — 上流の拒否をローカルの入力エラーとして
// 名乗ると、details をフィールドエラーとして描画するハンドラが誤動作し、
// 上流の失敗理由（cause）も details からは辿れなくなる。
// 上流に拒否されたのは自コードの要求が誤っているサインなので、本番で黙って
// フォールバックすると欠陥が隠れる — never-fallback（再試行もしない）
class UpstreamRejectedError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(
    message: string,
    public readonly upstreamStatus: number,
    options?: AppErrorOptions,
  ) {
    super(message, "UPSTREAM_REJECTED", HTTP_STATUS.BAD_GATEWAY, options);
  }
}
```

## 2. 外部境界のエラー正規化

```typescript
// SDK ごとに status の置き場所が違う（axios: response.status / Stripe: statusCode / fetch: status）
function readHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const e = error as {
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    response?: { status?: unknown };
  };
  // SendGrid の ResponseError は HTTP ステータスを数値の `code` に入れる（`response` に
  // headers / body を持つ）。範囲チェックだけでは MongoDB の WriteConflict(112) のような
  // 100〜599 に収まる独自エラー番号を弾けないので、HTTP レスポンスの形（`response` が
  // オブジェクト）を伴う場合に限って数値 `code` を採用する
  const looksLikeHttpResponseError =
    typeof e.response === "object" && e.response !== null;
  const candidate =
    e.statusCode ??
    e.status ??
    e.response?.status ??
    (looksLikeHttpResponseError &&
    typeof e.code === "number" &&
    isHttpStatusRange(e.code)
      ? e.code
      : undefined);
  return typeof candidate === "number" ? candidate : undefined;
}

const HTTP_STATUS_MIN = 100;
const HTTP_STATUS_MAX = 599;
function isHttpStatusRange(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= HTTP_STATUS_MIN &&
    value <= HTTP_STATUS_MAX
  );
}

// Node のシステムエラーコード（ECONNREFUSED / ENOTFOUND / ETIMEDOUT 等）を cause に持つか
function hasSystemErrorCode(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  // 形式は照合しない（ECONNREFUSED / EAI_AGAIN / UND_ERR_CONNECT_TIMEOUT 等、
  // Node と undici で表記が揃わない）。素のプログラミング TypeError は cause を持たない
  const code = (error.cause as { code?: unknown } | undefined)?.code;
  return typeof code === "string" && code.length > 0;
}

// 自コードのバグ。HTTP ステータスを持たないので、放置すると「ステータス無し = 一時障害」
// と誤分類され、本番でフォールバック・再試行される。
// 例外: WHATWG fetch / undici はネットワーク障害を `TypeError: fetch failed`
// （cause に ECONNREFUSED 等）で reject する。これはバグではなく一時障害
function isProgrammingError(error: unknown): boolean {
  if (error instanceof TypeError && hasSystemErrorCode(error)) return false;
  return (
    error instanceof TypeError ||
    error instanceof RangeError ||
    error instanceof ReferenceError ||
    error instanceof SyntaxError
  );
}

/**
 * HTTP クライアント / 外部 SDK の境界で、生のエラーを AppError に正規化する。
 *
 * 汎用 Error / AxiosError のままだと category の判定がすべて素通りし、外部 API の
 * 401/403 がフォールバックや再試行の対象になる（FALLBACK.md §4）。
 * ステータスは `status` / `statusCode` / `response.status` に加え、SendGrid の
 * ResponseError のように数値の `code` に入っている場合も読む（`response` を伴い、
 * HTTP ステータスの範囲にある数値のみ）。読めないとすべて transient に化ける。
 * 写像: 401 / 403 → 認証・認可（never-fallback）、404 → NotFoundError（permanent）、
 * 409 → ConflictError（never-fallback）、429 / 5xx / ステータス不明 → UpstreamError
 * （transient）、専用クラスを持たないその他の 4xx（400 / 422 等）→ UpstreamRejectedError
 * （never-fallback。こちらの要求誤りなので本番でも握りつぶさない）。
 * 1xx〜3xx をエラーとして投げる HTTP ラッパは想定外なので UpstreamError に寄せる。
 * cause には元の値をそのまま保持する（Error でない値も String() に潰さない —
 * 上流のステータスやレスポンス本文は cause からしか辿れない）。
 *
 * 対象は HTTP ステータスを持つ境界のみ。DB ドライバ・キュー・ファイル I/O のエラーは
 * ステータスを持たないため、リポジトリ層に専用のマッパー（driver code →
 * ConflictError / NotFoundError / UpstreamError）を置き、この関数には通さない。
 * `fetch` の `!res.ok` を `throw new Error(...)` で表す書き方も status を失う —
 * 境界では `{ status: res.status }` を持つエラーを投げるか、この関数に
 * `{ status: res.status, body }` を直接渡す。
 */
function normalizeExternalError(
  error: unknown,
  message = "External service call failed",
): AppError {
  if (error instanceof AppError) return error;
  if (isProgrammingError(error)) {
    return new InternalError(message, { cause: error });
  }
  const cause = error;
  const status = readHttpStatus(error);

  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return new UnauthorizedError(message, { cause });
    case HTTP_STATUS.FORBIDDEN:
      return new ForbiddenError(message, { cause });
    case HTTP_STATUS.NOT_FOUND:
      return new NotFoundError(message, { cause });
    case HTTP_STATUS.CONFLICT:
      return new ConflictError(message, { cause });
    case undefined:
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      // ステータスを取り出せなかった（接続断・タイムアウト、または status を添えない
      // HTTP ラッパ）。429 とともに一時障害として扱う
      return new UpstreamError(message, { cause });
    default:
      // 4xx（専用クラスを持たないもの）だけが「こちらの要求誤り」。5xx と、エラーとして
      // 投げられた 1xx〜3xx（リダイレクト等）は上流側の事情として transient に寄せる
      return status >= HTTP_STATUS.BAD_REQUEST &&
        status < HTTP_STATUS.INTERNAL_SERVER_ERROR
        ? new UpstreamRejectedError(message, status, { cause })
        : new UpstreamError(message, { cause });
  }
}
```

## 3. エラーハンドリングパターン

```typescript
// Try-Catch with proper error handling
async function processUser(userId: string): Promise<Result<User>> {
  try {
    const user = await userRepository.findById(userId);
    if (!user) {
      return Result.fail(new NotFoundError("User not found"));
    }

    const processed = await processUserData(user);
    return Result.ok(processed);
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to process user", normalizedError, { userId });

    // AppError はそのまま返す。ValidationError だけ通して残りを InternalError に
    // 降格させると、UnauthorizedError 等の never-fallback が permanent に化け、
    // 上位の fallbackInProdOnly が本番で握りつぶす
    if (normalizedError instanceof AppError) {
      return Result.fail(normalizedError);
    }

    return Result.fail(
      new InternalError("Processing failed", { cause: normalizedError }),
    );
  }
}
```

## 4. 環境別フォールバック戦略

フォールバック処理はtry-catchレベルだけでなく、UI/サービス/機能/データの各レイヤーにまたがるアプリケーション横断的な関心事である。

**基本原則**: 開発環境ではFail-Fast、本番環境でのみGraceful Degradation。この原則は全レイヤーに適用する。

詳細な戦略・パターン・テンプレートは [FALLBACK.md](./FALLBACK.md) を参照。

## Changelog

### [1.0.0] - 2026-10-15

- PATTERNS.md 1.5.1 の §3「エラーハンドリング」を移設（Issue #550）。本文は変更していない
