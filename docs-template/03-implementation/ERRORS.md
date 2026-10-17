---
title: "ERRORS"
version: "2.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "2026-10-17"
changeImpact: "high"
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
//   never-fallback: 認証・認可・バリデーション・データ整合性・セキュリティ・上流の恒久拒否・原因不明の外部エラー
//                   — 環境を問わずスロー、再試行しない（FALLBACK.md Section 1）
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

// 分類する根拠が無い外部エラー。原因の調査・境界マッパーの追加が必要で、
// 一時障害と推測してフォールバックや再試行をしない。
class UnknownExternalError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "UNKNOWN_EXTERNAL_ERROR", HTTP_STATUS.BAD_GATEWAY, options);
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
    response?: { status?: unknown; statusCode?: unknown };
    $metadata?: { httpStatusCode?: unknown };
  };
  // SendGrid の ResponseError は HTTP ステータスを数値の `code` に入れる（`response` に
  // headers / body を持つ）。範囲チェックだけでは MongoDB の WriteConflict(112) のような
  // 100〜599 に収まる独自エラー番号を弾けないので、HTTP レスポンスの形（`response` が
  // オブジェクト）を伴う場合に限って数値 `code` を採用する
  const looksLikeHttpResponseError =
    typeof e.response === "object" && e.response !== null;
  // 候補ごとに型と範囲を検証する。先頭の "401" / NaN / 範囲外の値で、
  // 後続の有効なステータスを隠さない。文字列の数値への暗黙変換はしない。
  const candidates = [
    e.statusCode,
    e.status,
    e.response?.status,
    e.response?.statusCode,
    e.$metadata?.httpStatusCode,
    looksLikeHttpResponseError ? e.code : undefined,
  ];
  return candidates.find(
    (value): value is number =>
      typeof value === "number" && isHttpStatusRange(value),
  );
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

// HTTP 境界で確認できた接続断・一時的な名前解決失敗・タイムアウトだけを許可する。
// ENOTFOUND / 証明書エラー / 任意の code は設定ミス等も含むため推測しない。
const TRANSIENT_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
  "UND_ERR_SOCKET",
]);
function hasTransientNetworkCode(error: unknown): boolean {
  // AbortSignal.timeout() の標準エラー。利用者キャンセルの AbortError は含めない。
  if (
    typeof DOMException !== "undefined" &&
    error instanceof DOMException &&
    error.name === "TimeoutError"
  )
    return true;
  if (typeof error !== "object" || error === null) return false;
  const e = error as { code?: unknown; cause?: { code?: unknown } };
  return [e.code, e.cause?.code].some(
    (code) => typeof code === "string" && TRANSIENT_NETWORK_CODES.has(code),
  );
}

/**
 * HTTP クライアント / 外部 SDK の境界で、生のエラーを AppError に正規化する。
 *
 * 汎用 Error / AxiosError のままだと category の判定がすべて素通りし、外部 API の
 * 401/403 がフォールバックや再試行の対象になる（FALLBACK.md §4）。
 * ステータスは `status` / `statusCode` / `response.status` / `response.statusCode` /
 * `$metadata.httpStatusCode` に加え、SendGrid の
 * ResponseError のように数値の `code` に入っている場合も読む（`response` を伴い、
 * HTTP ステータスの範囲にある数値のみ）。
 * 写像: 401 / 403 → 認証・認可（never-fallback）、404 → NotFoundError（permanent）、
 * 409 → ConflictError（never-fallback）、429 / 5xx / 既知の接続断・タイムアウト → UpstreamError
 * （transient）、専用クラスを持たないその他の 4xx（400 / 422 等）→ UpstreamRejectedError
 * （never-fallback。こちらの要求誤りなので本番でも握りつぶさない）。
 * ステータス不明・想定外の 1xx〜3xx → UnknownExternalError（never-fallback）。
 * TypeError / SyntaxError という型名だけでは自コードのバグと断定しない。
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
      return hasTransientNetworkCode(error)
        ? new UpstreamError(message, { cause })
        : new UnknownExternalError(message, { cause });
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return new UpstreamError(message, { cause });
    default:
      if (status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
        return new UpstreamError(message, { cause });
      }
      return status >= HTTP_STATUS.BAD_REQUEST
        ? new UpstreamRejectedError(message, status, { cause })
        : new UnknownExternalError(message, { cause });
  }
}
```

`TypeError: Failed to fetch` のようにステータスも既知のネットワークコードも無い場合は、ブラウザの通信障害か自コードの不具合かを判別できないため `UnknownExternalError` にする。自コードの不具合を確認した境界では `InternalError` を明示して渡す。

上流の JSON 解析は、通信呼び出しや自コードの変換処理とは別の try 節で写像する。下の例は、API が JSON を返す契約を破った場合をフォールバック禁止にする（型名だけで `InternalError` にしない）。

```typescript
async function readUpstreamJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw normalizeExternalError({ status: response.status });
  }
  try {
    return await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new UnknownExternalError("Invalid upstream JSON response", {
        cause: error,
      });
    }
    // body の読取中の接続断・タイムアウトは構文エラーと区別する
    throw normalizeExternalError(error, "Failed to read upstream response");
  }
}
```

SDK の配置の確認元: [Smithy ResponseMetadata](https://github.com/smithy-lang/smithy-typescript/blob/main/packages/types/src/response.ts)（AWS SDK v3）、[Got HTTPError](https://github.com/sindresorhus/got/blob/main/source/core/errors.ts)（確認日: 2026-10-17）。

Axios の `ECONNABORTED` はタイムアウトと中断の両方で使われるため、コードだけで再試行可としない。タイムアウトを区別する呼び出しでは `transitional.clarifyTimeoutError: true` を設定して `ETIMEDOUT` を受け取る（[Axios XHR adapter](https://github.com/axios/axios/blob/v1.x/lib/adapters/xhr.js)）。標準 `AbortSignal.timeout()` の `DOMException` / `TimeoutError` は一時障害、利用者キャンセルの `AbortError` は再試行しない（[Node.js 実装](https://github.com/nodejs/node/blob/v24.x/lib/internal/abort_controller.js)）。

HTTP ステータスだけでは分類できない SDK 固有の例外は、サービス専用の境界マッパーを先に通す。[DynamoDB GetItem](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_GetItem.html) のスロットリングは HTTP 400 でも再試行対象なので、確認済みの例外名とステータスの組だけを写す。SDK 自体の再試行との合計回数にも上限を設ける。

```typescript
function normalizeDynamoDbError(error: unknown): AppError {
  const name =
    typeof error === "object" && error !== null
      ? (error as { name?: unknown }).name
      : undefined;
  if (
    readHttpStatus(error) === HTTP_STATUS.BAD_REQUEST &&
    (name === "ProvisionedThroughputExceededException" ||
      name === "ThrottlingException")
  ) {
    return new UpstreamError("DynamoDB throttled", { cause: error });
  }
  return normalizeExternalError(error);
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
    logger.error("Failed to process user", error, { userId });

    // AppError はそのまま返す。ValidationError だけ通して残りを InternalError に
    // 降格させると、UnauthorizedError 等の never-fallback が permanent に化け、
    // 上位の fallbackInProdOnly が本番で握りつぶす
    if (error instanceof AppError) {
      return Result.fail(error);
    }

    return Result.fail(
      new InternalError("Processing failed", { cause: error }),
    );
  }
}
```

## 4. 環境別フォールバック戦略

フォールバック処理はtry-catchレベルだけでなく、UI/サービス/機能/データの各レイヤーにまたがるアプリケーション横断的な関心事である。

**基本原則**: 開発環境ではFail-Fast、本番環境でのみGraceful Degradation。この原則は全レイヤーに適用する。

詳細な戦略・パターン・テンプレートは [FALLBACK.md](./FALLBACK.md) を参照。

## Changelog

### [2.0.0] - 2026-10-17

#### 変更

- **破壊的変更**: 原因不明の外部エラーと想定外の 1xx〜3xx を `UnknownExternalError`（never-fallback）へ分類し、既知のネットワークコードのみ一時障害として許可する。TypeError / SyntaxError の型名で内部バグと推測しない
- AWS SDK v3 / Got のステータス配置を読み、無効な先頭候補でも後続を検査する
- エラー処理例の cause に Error でない元の値もそのまま保持する

### [1.0.0] - 2026-10-15

- PATTERNS.md 1.5.1 の §3「エラーハンドリング」を移設（Issue #550）。コードと説明文は変更していない（見出しは番号付き h2 に再編）
