---
title: "PATTERNS"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

# PATTERNS.md - 実装パターンガイド

## 1. コーディング規約

### 命名規則

| 要素 | パターン | 例 |
|---|---|---|
| クラス | PascalCase | UserService |
| インターフェース | PascalCase + I prefix | IUserRepository |
| メソッド | camelCase | getUserById() |
| 変数 | camelCase | userName |
| 定数 | UPPER_SNAKE_CASE | MAX_RETRY_COUNT |
| ファイル | kebab-case | user-service.ts |

### コード構造

```typescript
// ファイル構造の標準パターン
// 1. imports
import { Injectable } from '@nestjs/common';

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
    const data = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
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

### カスタムエラークラス

```typescript
// エラー基底クラス
abstract class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// 具体的なエラークラス
class ValidationError extends AppError {
  constructor(message: string, details: any[]) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
  }
}
```

### エラーハンドリングパターン

```typescript
// Try-Catch with proper error handling
async function processUser(userId: string): Promise<Result<User>> {
  try {
    const user = await userRepository.findById(userId);
    if (!user) {
      return Result.fail(new NotFoundError('User not found'));
    }
    
    const processed = await processUserData(user);
    return Result.ok(processed);
    
  } catch (error) {
    logger.error('Failed to process user', { userId, error });
    
    if (error instanceof ValidationError) {
      return Result.fail(error);
    }
    
    return Result.fail(new InternalError('Processing failed'));
  }
}
```

### 環境別フォールバック戦略（Fail-Fast in Dev）

**原則**: 開発環境ではフォールバック値を返さずエラーをスローし、バグを即座に検出する。本番環境でのみフォールバックを許可する。

**背景**: AI（Claude Code, Copilot, Cursor等）は「安全側」に倒す傾向があり、try-catch + フォールバック値を自動挿入しがち。これにより開発中にバグが隠蔽され、本番で初めて問題が発覚するリスクが高い。

#### ユーティリティ関数

```typescript
/**
 * 本番環境でのみフォールバック値を返し、開発・テスト環境ではエラーをスローする。
 * AI生成コードのサイレントエラー防止に使用する。
 *
 * @throws {Error} development/test環境では元のエラーを再スローする。
 */
function fallbackInProdOnly<T>(fallbackValue: T, error: unknown, context?: Record<string, unknown>): T {
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  logger.error('Fallback activated', normalizedError, context);

  const env = process.env.NODE_ENV;
  // ホワイトリスト方式: dev/testのみスロー。未定義・staging等は安全にフォールバック
  if (env === 'development' || env === 'test') {
    throw normalizedError;
  }

  return fallbackValue;
}
```

> **NODE_ENV未設定時の挙動**: ホワイトリスト方式を採用しているため、`NODE_ENV` が未定義やその他の値の場合はフォールバックが動作する（本番環境の安全性を優先）。staging環境でもfail-fastを有効にしたい場合は、別途 `APP_ENV` 等の環境変数で制御するか、staging環境の `NODE_ENV` を `development` に設定する。

#### ❌ NG: AI生成コードによくあるパターン

```typescript
// AI が自動生成しがちなパターン — 開発でもバグが隠れる
async function getUser(id: string): Promise<User> {
  try {
    // ※ findById は User | null を返すが、null処理は省略（フォールバック問題に焦点）
    return await userRepository.findById(id) as User;
  } catch {
    return DEFAULT_USER; // バグがあっても気づけない
  }
}

async function getConfig(key: string): Promise<string> {
  try {
    return await configService.get(key);
  } catch {
    return ''; // 設定ミスが本番まで検出されない
  }
}
```

#### ✅ OK: 環境別フォールバック戦略

```typescript
// 方法1（推奨）: ユーティリティ関数を使用
async function getUser(id: string): Promise<User> {
  try {
    // ※ null処理は省略（フォールバック問題に焦点）
    return await userRepository.findById(id) as User;
  } catch (error) {
    return fallbackInProdOnly(DEFAULT_USER, error, { id });
  }
}

// 方法2: インラインで環境分岐（カスタムログが必要な場合）
async function getConfig(key: string): Promise<string> {
  try {
    return await configService.get(key);
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to fetch config', normalizedError, { key });

    const env = process.env.NODE_ENV;
    if (env === 'development' || env === 'test') {
      throw normalizedError;
    }

    return ''; // 本番時のみ: デフォルト値で継続
  }
}
```

#### 適用判断ガイド

| シナリオ | 開発時 | 本番時 |
|---------|--------|--------|
| DB/API通信エラー | スロー（即座に検出） | フォールバック + ログ |
| 設定値の取得失敗 | スロー（設定ミス検出） | デフォルト値 + アラート |
| データ変換エラー | スロー（型不整合検出） | 安全なデフォルト + ログ |
| 認証/認可エラー | スロー | スロー（環境問わず） |
| バリデーションエラー | スロー | スロー（環境問わず） |
| データ整合性エラー | スロー | スロー（環境問わず） |
| セキュリティ関連エラー | スロー | スロー（環境問わず） |

> **原則**: データ整合性・セキュリティ・認証認可・バリデーションなど、フォールバックが安全性やデータの正確性を損なうエラーは環境に関係なく常にスローする。フォールバックが許容されるのはUX保護が目的の場合のみ。

#### Result patternとの使い分け

本ファイル Section 3 の Result pattern（`Result.ok` / `Result.fail`）とフォールバック戦略は併用できる。

- **Result pattern**: ビジネスロジック層で使用。呼び出し元がエラーの種類に応じて処理を分岐する場合に適する
- **`fallbackInProdOnly`**: UI境界層・APIレスポンス整形など、最終消費者にフォールバック値を返す場面で使用

#### セルフレビュー時の確認ポイント

- [ ] try-catch ブロックでエラーを握りつぶしていないか
- [ ] フォールバック値（空配列、デフォルトオブジェクト等）を返す箇所に環境分岐があるか
- [ ] AI生成コードのcatch句が `fallbackInProdOnly()` または `NODE_ENV` 分岐を使用しているか
- [ ] 認証/認可/バリデーションエラーにフォールバックが入っていないか

## 4. 非同期処理パターン

### Promise Chain

```typescript
// Promise チェーンパターン
function fetchUserWithPosts(userId: string): Promise<UserWithPosts> {
  return fetchUser(userId)
    .then(user => fetchPosts(user.id)
      .then(posts => ({ ...user, posts }))
    )
    .catch(error => {
      logger.error('Failed to fetch user with posts', error);
      throw new DataFetchError('Could not load user data');
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
    logger.error('Failed to fetch user with posts', error);
    throw new DataFetchError('Could not load user data');
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
    fetchNotifications(userId)
  ]);
  
  return {
    user,
    stats,
    notifications
  };
}
```

## 5. バリデーションパターン

### DTOバリデーション

```typescript
// DTOバリデーション using class-validator
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

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
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

## 6. テストパターン

### Unit Test

```typescript
// ユニットテストパターン
describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<IUserRepository>;
  
  beforeEach(() => {
    repository = createMock<IUserRepository>();
    service = new UserService(repository);
  });
  
  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '1', name: 'John' };
      repository.findById.mockResolvedValue(mockUser);
      
      const result = await service.findById('1');
      
      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith('1');
    });
    
    it('should throw NotFoundError when user not found', async () => {
      repository.findById.mockResolvedValue(null);
      
      await expect(service.findById('1'))
        .rejects.toThrow(NotFoundError);
    });
  });
});
```

### Integration Test

```typescript
// 統合テストパターン
describe('User API', () => {
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
  
  describe('POST /users', () => {
    it('should create user successfully', async () => {
      const response = await request(app)
        .post('/users')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123'
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test@example.com');
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
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  static sanitizeSql(input: string): string {
    // Use parameterized queries instead
    return input.replace(/['";\\]/g, '');
  }
}
```

### 認証・認可

```typescript
// 認証ミドルウェア
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// 認可デコレーター
function RequireRole(role: Role) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const user = getCurrentUser();
      if (!user.hasRole(role)) {
        throw new ForbiddenError('Insufficient permissions');
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
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = new Map();
    
    descriptor.value = async function(...args: any[]) {
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
    private processFn: (items: T[]) => Promise<void>
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
// 構造化ログパターン
class Logger {
  private context: Record<string, any> = {};
  
  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }
  
  info(message: string, meta?: Record<string, any>): void {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...meta
    }));
  }
  
  error(message: string, error: Error, meta?: Record<string, any>): void {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString(),
      ...this.context,
      ...meta
    }));
  }
}
```

## 10. マジックナンバー禁止

### 定数の定義

```typescript
// ❌ 悪い例
if (retryCount > 3) {
  throw new Error('Max retries exceeded');
}

// ✅ 良い例
const MAX_RETRY_COUNT = 3;
if (retryCount > MAX_RETRY_COUNT) {
  throw new Error('Max retries exceeded');
}
```

### 設定の外部化

```typescript
// config/constants.ts
export const API_CONFIG = {
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RATE_LIMIT: 100
} as const;

// 使用例
import { API_CONFIG } from './config/constants';

async function fetchWithRetry(url: string) {
  let retries = 0;
  while (retries < API_CONFIG.MAX_RETRIES) {
    // implementation
  }
}
```

## Changelog

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成
