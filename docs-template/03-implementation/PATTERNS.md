---
title: "PATTERNS"
version: "1.7.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "2026-10-16"
changeImpact: "medium"
---

# PATTERNS.md - 実装パターンガイド

> 本文の言語・設計・レビュー・テスト設定は候補例。プロジェクトの目的・リスク・既存構成に合わせて推奨理由を示し、合意済みのものだけを採用する。ASDD 2.0では `.asdd/config.json` の文書・機能選択を優先し、ACE・振り返り・複数AIレビューを無効時に追加しない。

## 1. コーディング規約

### 命名規則

| 要素             | パターン              | 例              |
| ---------------- | --------------------- | --------------- |
| クラス           | PascalCase            | UserService     |
| インターフェース | PascalCase + I prefix | IUserRepository |
| メソッド         | camelCase             | getUserById()   |
| 変数             | camelCase             | userName        |
| 定数             | UPPER_SNAKE_CASE      | MAX_RETRY_COUNT |
| ファイル         | kebab-case            | user-service.ts |

### コード構造

```typescript
// ファイル構造の標準パターン
// 1. imports
import { Injectable } from "@nestjs/common";

// 2. constants
const MAX_RETRY_COUNT = 3;

// 3. types/interfaces
interface UserData {
  id: string;
  name: string;
}

// 4. main class/function
@Injectable()
export class UserService {
  // implementation
}

// 5. exports
export { UserService, UserData };
```

## 2. デザインパターン

### Repository Pattern

```typescript
// リポジトリインターフェース
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

// 実装
class UserRepository implements IUserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.db.query("SELECT * FROM users WHERE id = ?", [id]);
    return data ? User.fromData(data) : null;
  }
}
```

### Factory Pattern

```typescript
// ファクトリーパターン
class NotificationFactory {
  static create(type: NotificationType): INotification {
    switch (type) {
      case NotificationType.EMAIL:
        return new EmailNotification();
      case NotificationType.SMS:
        return new SmsNotification();
      case NotificationType.PUSH:
        return new PushNotification();
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }
}
```

### Singleton Pattern

```typescript
// シングルトンパターン
class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
}
```

## 3. エラーハンドリング

`AppError` 階層・`ErrorCategory`・`HTTP_STATUS`・`normalizeExternalError()`（外部境界のエラー正規化）の正典は [ERRORS.md](./ERRORS.md) にある。本セクションは索引であり、定義は ERRORS.md 側で維持する。

- 失敗を握りつぶさず `AppError` に正規化し、元エラーは `cause` で保持する
- 環境別フォールバック（開発は Fail-Fast・本番のみ Graceful Degradation）は [FALLBACK.md](./FALLBACK.md) を参照

## 4. 非同期処理パターン

### Promise Chain

```typescript
// Promise チェーンパターン
function fetchUserWithPosts(userId: string): Promise<UserWithPosts> {
  return fetchUser(userId)
    .then((user) => fetchPosts(user.id).then((posts) => ({ ...user, posts })))
    .catch((error: unknown) => {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to fetch user with posts", normalizedError);
      throw new DataFetchError("Could not load user data", {
        cause: normalizedError,
      });
    });
}
```

### Async/Await

```typescript
// Async/Awaitパターン
async function fetchUserWithPosts(userId: string): Promise<UserWithPosts> {
  try {
    const user = await fetchUser(userId);
    const posts = await fetchPosts(user.id);
    return { ...user, posts };
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to fetch user with posts", normalizedError);
    throw new DataFetchError("Could not load user data", {
      cause: normalizedError,
    });
  }
}
```

### 並列処理

```typescript
// 並列処理パターン
async function fetchDashboardData(userId: string): Promise<Dashboard> {
  const [user, stats, notifications] = await Promise.all([
    fetchUser(userId),
    fetchUserStats(userId),
    fetchNotifications(userId),
  ]);

  return {
    user,
    stats,
    notifications,
  };
}
```

## 5. バリデーションパターン

### DTOバリデーション

```typescript
// DTOバリデーション using class-validator
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
```

### カスタムバリデーター

```typescript
// カスタムバリデーター
class Validator {
  static isValidEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  static isValidPassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain number");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

## 6. テストパターン

### Unit Test

```typescript
// ユニットテストパターン
describe("UserService", () => {
  let service: UserService;
  let repository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    repository = createMock<IUserRepository>();
    service = new UserService(repository);
  });

  describe("findById", () => {
    it("should return user when found", async () => {
      const mockUser = { id: "1", name: "John" };
      repository.findById.mockResolvedValue(mockUser);

      const result = await service.findById("1");

      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith("1");
    });

    it("should throw NotFoundError when user not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById("1")).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Integration Test

```typescript
// 統合テストパターン
describe("User API", () => {
  let app: Application;
  let db: Database;

  beforeAll(async () => {
    app = await createTestApp();
    db = await createTestDatabase();
  });

  afterAll(async () => {
    await db.close();
    await app.close();
  });

  describe("POST /users", () => {
    it("should create user successfully", async () => {
      const response = await request(app)
        .post("/users")
        .send({
          email: "test@example.com",
          password: "SecurePass123",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe("test@example.com");
    });
  });
});
```

## 7. セキュリティパターン

### 入力サニタイゼーション

```typescript
// 入力のサニタイゼーション
class Sanitizer {
  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  static sanitizeSql(input: string): string {
    // Use parameterized queries instead
    return input.replace(/['";\\]/g, "");
  }
}
```

### 認証・認可

```typescript
// 認証ミドルウェア
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// 認可デコレーター
function RequireRole(role: Role) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]) {
      const user = getCurrentUser();
      if (!user.hasRole(role)) {
        throw new ForbiddenError("Insufficient permissions");
      }
      return originalMethod.apply(this, args);
    };
  };
}
```

## 8. パフォーマンス最適化

### キャッシングパターン

```typescript
// キャッシングデコレーター
function Cacheable(ttl: number = 3600) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;
    const cache = new Map<string, { value: unknown; timestamp: number }>();

    descriptor.value = async function (...args: unknown[]) {
      const key = JSON.stringify(args);

      if (cache.has(key)) {
        const cached = cache.get(key);
        if (Date.now() - cached.timestamp < ttl * 1000) {
          return cached.value;
        }
      }

      const result = await originalMethod.apply(this, args);
      cache.set(key, { value: result, timestamp: Date.now() });
      return result;
    };
  };
}
```

### バッチ処理

```typescript
// バッチ処理パターン
class BatchProcessor<T> {
  private queue: T[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private batchSize: number,
    private batchDelay: number,
    private processFn: (items: T[]) => Promise<void>,
  ) {}

  add(item: T): void {
    this.queue.push(item);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchDelay);
    }
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    await this.processFn(batch);
  }
}
```

## 9. ログパターン

### 構造化ログ

```typescript
// Logger の呼び出し規約（テンプレート全体の正典。他文書のコード例もこの署名に従う）:
//   error(message, error, meta?) — 第 2 引数は Error 型。catch 変数（unknown）は
//     `error instanceof Error ? error : new Error(String(error))` で正規化してから渡す
//   warn / info(message, meta?) — meta は構造化コンテキスト。Error 実体は入れない
//     （JSON.stringify で message / stack が落ちる）。必要なら name / code だけ載せる
// 2 引数版 error(message, error) のみだと構造化コンテキストを渡す口が無く、
// FALLBACK.md「フォールバック発動時は必ず構造化ログ」を満たせない。
interface Logger {
  error(message: string, error: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
}

// メトリクスクライアントの最小契約（実装は MONITORING.md の監視基盤に接続する）。
// エラー処理経路から呼ぶため、実装は例外を投げない — 送信失敗は内部で記録して黙って戻る
interface Metrics {
  increment(name: string, tags?: Record<string, string>): void;
}

// cause 鎖の展開深さの上限（意味のある値の定数化（採用時））。無限の cause ループを防ぐ
const ERROR_CAUSE_MAX_DEPTH = 5;

// ログに載せる上流レスポンス本文の上限（意味のある値の定数化（採用時））。巨大な本文で行を潰さない
const ERROR_LOG_BODY_MAX_CHARS = 2000;

// HTTP 由来のエラー（AxiosError / fetch のレスポンス / { status, body }）から
// 診断に要るフィールドだけを抜く。cause に保持した上流のステータス・本文は
// ここで出さないとどこにも現れない
function pickHttpDiagnostics(value: object): Record<string, unknown> {
  const v = value as {
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    body?: unknown;
    // axios は response.data、SendGrid の ResponseError は response.body に本文を持つ
    response?: { status?: unknown; data?: unknown; body?: unknown };
  };
  const body = v.body ?? v.response?.data ?? v.response?.body;
  const diagnostics: Record<string, unknown> = {};
  const status = v.statusCode ?? v.status ?? v.response?.status;
  if (status !== undefined) diagnostics.status = status;
  if (v.code !== undefined) diagnostics.code = v.code;
  if (body !== undefined) {
    // ログ経路で投げない: 本文が循環参照（stream の response.data 等）や BigInt を
    // 含むと JSON.stringify が TypeError を投げ、記録しようとしていた元エラーを覆い隠す
    let text: string;
    try {
      text =
        typeof body === "string"
          ? body
          : (JSON.stringify(body) ?? String(body));
    } catch {
      text = "[unserializable body]";
    }
    diagnostics.body = text.slice(0, ERROR_LOG_BODY_MAX_CHARS);
  }
  return diagnostics;
}

// ログに載せる非 HTTP 形状 cause の上位キー数の上限（意味のある値の定数化（採用時））
const ERROR_LOG_SHAPE_MAX_KEYS = 20;

// HTTP 形状でないオブジェクトの「形」だけを残す。値は一切出さない — 任意オブジェクトを
// JSON 化すると、境界で赤入れされていない cause（{ requestBody: { email, apiSecret } } 等）
// の個人情報・秘密がそのままログに載る（SKILL.md「個人情報をログに含めない」）。
// 型名と上位キー名があれば「何が来たか」は追える。Object.keys / constructor 参照は
// Proxy 等で投げうるので、ログ経路として投げない。catch 内では value に再度触らない
// （Object.prototype.toString も Symbol.toStringTag の getter を呼ぶため投げうる）
function describeShape(value: object): Record<string, unknown> {
  try {
    const keys = Object.keys(value);
    return {
      type: value.constructor?.name ?? Object.prototype.toString.call(value),
      keys: keys.slice(0, ERROR_LOG_SHAPE_MAX_KEYS),
      keyCount: keys.length,
    };
  } catch {
    return { type: "unknown" };
  }
}

// Error を構造化する。cause を保持する規約（§3 / ERRORS.md）と対で、cause をログに出す実装が要る —
// name / message / stack しか出さないと、ラップ時に保持した上流の失敗理由が
// どこにも現れない
function serializeError(error: unknown, depth = 0): Record<string, unknown> {
  if (!(error instanceof Error)) {
    // Error でない cause（{ status, body } 等）は String() に潰さず構造化する。
    // HTTP 形状でない値（GA4 のレスポンス等）は pickHttpDiagnostics が空になるので、
    // 型名と上位キー名（値は含めない）で「形状の情報」自体を残す
    if (typeof error === "object" && error !== null) {
      const diagnostics = pickHttpDiagnostics(error);
      return Object.keys(diagnostics).length > 0
        ? diagnostics
        : { shape: describeShape(error) };
    }
    return { value: String(error) };
  }
  const serialized: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    // AxiosError 等の status / response.data。AppError 自身には走らせない
    // （自分の statusCode を上流ステータスと誤読させない）
    ...(error instanceof AppError ? {} : pickHttpDiagnostics(error)),
  };
  if (error instanceof AppError) {
    serialized.code = error.code;
    serialized.statusCode = error.statusCode;
    serialized.category = error.category;
  }
  if (error instanceof UpstreamRejectedError) {
    serialized.upstreamStatus = error.upstreamStatus;
  }
  if (error.cause !== undefined && depth < ERROR_CAUSE_MAX_DEPTH) {
    serialized.cause = serializeError(error.cause, depth + 1);
  }
  return serialized;
}

// 構造化ログパターン（Logger の実装例）
class JsonLogger implements Logger {
  private context: Record<string, unknown> = {};

  setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context };
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write("warn", message, meta);
  }

  private write(
    level: "info" | "warn",
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    console.log(
      JSON.stringify({
        level,
        message,
        timestamp: new Date().toISOString(),
        ...this.context,
        ...meta,
      }),
    );
  }

  error(message: string, error: Error, meta?: Record<string, unknown>): void {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: serializeError(error),
        timestamp: new Date().toISOString(),
        ...this.context,
        ...meta,
      }),
    );
  }
}
```

## 10. 意味のある値の定数化（採用時）

### 定数の定義

```typescript
// ❌ 悪い例
if (retryCount > 3) {
  throw new Error("Max retries exceeded");
}

// ✅ 良い例
const MAX_RETRY_COUNT = 3;
if (retryCount > MAX_RETRY_COUNT) {
  throw new Error("Max retries exceeded");
}
```

### 設定の外部化

```typescript
// config/constants.ts
export const API_CONFIG = {
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RATE_LIMIT: 100,
} as const;

// 使用例
import { API_CONFIG } from "./config/constants";

async function fetchWithRetry(url: string) {
  let retries = 0;
  while (retries < API_CONFIG.MAX_RETRIES) {
    // implementation
  }
}
```

## 11. 配置判断（Decision Tree）

新機能・新モジュール追加時の「どこに書くか」の判断は [DECISION_TREE.md](./DECISION_TREE.md) に委ねる。

本セクションは索引であり、実体は DECISION_TREE.md 側で維持する。

### 使い所

- 新規ファイル作成前の配置判断
- レビュー時の配置妥当性確認
- AI（Claude Code / Cursor / Copilot）が新規コード生成する際の参照元

### 概要

Decision Tree は 7 分岐（Q0〜Q6）で構成される：

| 分岐 | 判定観点                              |
| ---- | ------------------------------------- |
| Q0   | コード変更 or ドキュメント            |
| Q1   | 外部システム通信（境界モジュール）    |
| Q2   | リクエスト入口（HTTP エンドポイント） |
| Q3   | オーケストレーション（ユースケース）  |
| Q4   | 永続化・状態保持                      |
| Q5   | ドメインモデル                        |
| Q6   | 横断的関心事                          |

詳細な分岐内容とチェックリストは [DECISION_TREE.md](./DECISION_TREE.md) を参照。

新規ファイルの雛形（SKELETON テンプレ）は `docs/03-implementation/templates/README.md`（初期セット外。必要になった時点で `${CLAUDE_PLUGIN_ROOT}/docs-template/` の同一相対パスからコピーする）に集約する。言語非依存の運用ルールと、TypeScript 等のコピー元パスを必ず確認すること。

## 12. 依存方向 lint（Layer 3）

Layer 1（[DECISION_TREE.md](./DECISION_TREE.md)）で決めた配置を、言語別 lint ツールで自動検証する。

- 目的: 境界違反の import を CI / pre-commit で機械的に検知する
- 注意: Layer 3 は **言語依存**（Python/TypeScript/Go/Rust など）
- 運用: `ignore_imports` などを使って既知負債を可視化し、削除ではなく追跡する

詳細は `docs/03-implementation/DEPENDENCY_LINT.md`（初期セット外。必要になった時点で `${CLAUDE_PLUGIN_ROOT}/docs-template/` の同一相対パスからコピーする）を参照。

## 13. アンチパターン

このプロジェクトで**やってはいけない**実装を列挙する。レビュー・AI コード生成時の除外基準として使う。

### 共通アンチパターン

| アンチパターン                 | 理由                     | 代わりにやること                                           |
| ------------------------------ | ------------------------ | ---------------------------------------------------------- |
| マジックナンバー・ハードコード | 変更漏れ・意図不明の原因 | 名前付き定数へ抽出（→ 10. 意味のある値の定数化（採用時）） |
| エラーの握りつぶし（空 catch） | 障害の検知が遅れる       | ログ記録 + 呼び出し元へ伝播（→ 3. エラーハンドリング）     |
| 境界を越えた直接 import        | レイヤー違反・循環依存   | 依存方向 lint に従う（→ 12. 依存方向 lint）                |
| ビジネスルールのコード内散在   | 仕様と実装の乖離         | DOMAIN.md に集約し、コードから参照                         |

### プロジェクト固有のアンチパターン

<!-- 運用の中で発見した「このプロジェクトでは禁止」の実装を追記する。例: 特定ライブラリの直接利用禁止、非推奨 API の使用禁止など。まだない場合は削除せず「該当なし（運用開始後に追記）」と明記する -->

- 該当なし（運用開始後に追記）

## 14. 実証済みパターン（ACE 昇格）

ACE Playbook で `Helpful >= 5` に達した知見を、`/ace-refine` が蒸留して昇格させる節。実装着手前に本節を読めば、このプロジェクトで繰り返し実証されたルールを最優先で適用できる。

- **形式**: 見出し 1 行 + ルール本文 1〜3 行（命令形）+ `出典:` の ACE ID リンク
- **昇格は移動ではない**: 元の Playbook エントリは `Status: active` のまま残す（蒸留オーバーレイ）。詳細な適用条件は出典リンク先を参照
- **昇格手順の SSOT**: `/ace-refine` スキル本体

> 注: 以下の 4 件は、このリポジトリ自身（ai-spec-driven-development）で昇格させた例である。導入先では削除するか、自プロジェクトの昇格パターンに置き換える。出典リンクが `blob/HEAD` の絶対 URL なのは、このファイルが `/init-docs` の初期セットに含まれ、初期セット外の `08-knowledge/` へ相対リンクを張れないためである。

<!-- /ace-refine が以下の形式で追記する。まだない場合は削除せず「該当なし（昇格発生後に追記）」と明記する

### [パターンを一言で表す見出し]

[ルール本文 1〜3 行。実装前に読んで即適用できる命令形で書く]

出典: [ACE-XXX](../08-knowledge/PLAYBOOK.md#ace-xxx)
-->

### クロスモデルレビューを省略しない

PR を作る前のセルフレビューでは、別系列モデルの CLI（Codex 等）が使えるなら、ホスト自身のセルフレビューにそのクロスモデルレビューを加え、省略しない。モデルの系列ごとに検出できる問題のカテゴリが違うため、同系列だけでは見落としが残る。

出典: [ACE-001](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/08-knowledge/PLAYBOOK.md#ace-001)

### 同系列レビュアーの全員承認を正しさの証拠にしない

同系列のレビュアーが「既存コードと整合的」を理由に全員承認した箇所は、別系列のクロスモデルレビューへ回す。既存の helper を写すときは写し元の欠陥まで継承していないかを疑い、片方だけ直さずに共有 helper へ抽出して両方を直す。

出典: [ACE-445-1](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/08-knowledge/PLAYBOOK.md#ace-445-1)

### 番号・順序の横断変更は着手前に対象を全件列挙する

番号・順序を横断的に変えるときは、着手前に意味的に等価な複数の grep パターン（直接参照・順序の散文・状態の説明・メタデータ・段階数）で対象ファイルを全部列挙する。「旧表現の grep ヒットなし」を受け入れ条件に書く。

出典: [ACE-018](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/08-knowledge/PLAYBOOK.md#ace-018)

### 「違反ゼロ」を期待するガードは検出器自体をテストする

`expect(violations).toEqual([])` の形の規約ガードを書くときは、合成入力で検出器そのものを固定するテスト（拾うべき形・拾ってはいけない形・境界値）を同じ PR に置く。実ファイルで違反ゼロを確かめるだけでは、検出器が壊れても緑のまま通る。

出典: [ACE-489-1](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/08-knowledge/PLAYBOOK.md#ace-489-1)

## Changelog

### [1.7.0] - 2026-10-16

- §14「実証済みパターン（ACE 昇格）」へ `/ace-refine` で ACE-001 / ACE-445-1 / ACE-018 / ACE-489-1 を昇格した（Issue #561）

### [1.6.0] - 2026-10-15

- §3「エラーハンドリング」の本文を [ERRORS.md](./ERRORS.md) へ移設し、§3 を索引にした（Issue #550）

### [1.5.1] - 2026-09-08

- 方法論側のエラー境界・診断ログの修正を正本へ統合（AI仕様駆動開発2.0: #1372、直接配布: ai-spec-driven-development#525）。numeric codeのHTTP形状確認、1xx〜3xx分類、SendGrid本文、非HTTP causeの値の非出力を保持。

### [1.5.0] - 2026-09-08

- ASDD 2.0: project-specific recommendations and explicitly agreed optional features (Issues #1372 / #1374).

### [1.4.0] - 2026-09-06

#### 変更

- AppError 階層に `cause` と分類 `category`（never-fallback / transient / permanent）を追加し、`UpstreamError` / `UpstreamRejectedError`、`HTTP_STATUS`、外部境界のエラー正規化 `normalizeExternalError()` を追加（Issue #1320。[公開側Issue #486](https://github.com/feel-flow/ai-spec-driven-development/issues/486) の移植）
- Logger の呼び出し規約を `interface Logger` として明文化（error は `(message, error, meta?)`、warn / info は `(message, meta?)`）。`JsonLogger` が `cause` 鎖を出力するよう `serializeError()` を追加。`Metrics` の最小契約を追加

### [1.3.1] - 2026-09-06

#### 変更

- 初期セット外（`templates/README.md`・`DEPENDENCY_LINT.md`）への Markdown リンクを、コピー元付きの案内テキスト（inline code）に変更

### [1.3.0] - 2026-07-31

#### 追加

- 「実証済みパターン（ACE 昇格）」セクションを追加（`/ace-refine` の昇格先。Issue #223）

### [1.2.0] - 2026-07-15

#### 追加

- 「アンチパターン」セクションを追加（標準の必須セクション適合。プラグイン配布側#83 の上流還元）

### [1.1.0] - 2026-04-27

#### 追加

- Layer 3（依存方向 lint）ガイドへの委譲リンクを追加

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成
