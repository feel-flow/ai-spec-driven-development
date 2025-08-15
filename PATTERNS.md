# 実装パターンガイド

## コーディング規約
### 全般
- **文字コード**: UTF-8
- **改行コード**: LF
- **インデント**: スペース2文字
- **行長制限**: 100文字
- **ファイル末尾**: 改行で終了

## 定数・設定とマジックナンバー禁止ガイド

コードの可読性・保守性・安全性のため、マジックナンバー（意味のない数値／文字列リテラルの直接埋め込み）やハードコードを禁止します。以下の原則・具体例・リンター設定を適用してください。

### 原則（必須）
- 直接値の埋め込み禁止：意味を持つ数値・文字列は必ず「名前付き定数」または「設定」へ抽出する
- 単位・範囲の明示：定数名・コメント・型で単位（ms, KB, °C 等）や有効範囲を示す
- 層の責務に沿う配置：
  - Domain層…ビジネスルール由来のしきい値・規則（例: 最大試行回数、割引率上限）
  - Application層…ユースケース固有の値（例: ページサイズ既定値）
  - Infrastructure層…接続情報・タイムアウト・URL等は環境変数／設定で注入
- 構成の検証：起動時に設定をスキーマ検証（欠落・型・範囲）し、起動失敗で早期に気付く
- 多言語化／文言：UI文言はハードコードせずリソース管理（i18n）へ
- 機能切替：条件分岐に直接値を置かず、フラグ／トグル／ポリシーとして表現

### 反パターンと改善例

#### TypeScript/JavaScript
Bad（反パターン）：
```ts
// 何の 5000 か不明、URL 直書き
await fetch("https://api.example.com/v1/users", { timeout: 5000 });
```

Good（改善）：
```ts
// config.ts
export const ApiConfig = Object.freeze({
  baseUrl: process.env.API_BASE_URL!,
  requestTimeoutMs: 5_000, // APIのタイムアウト(ms)
} as const);

// use
await fetch(`${ApiConfig.baseUrl}/v1/users`, { /* ライブラリに応じて */ });
```

設定のスキーマ検証例（Zod）：
```ts
import { z } from 'zod';

const EnvSchema = z.object({
  API_BASE_URL: z.string().url(),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().min(100).max(60_000),
});

export const ENV = EnvSchema.parse(process.env);
```

#### Python
Bad（反パターン）：
```py
TIMEOUT = 5000
API_URL = "https://api.example.com"
```

Good（改善：pydantic Settings）：
```py
from pydantic_settings import BaseSettings
from pydantic import AnyUrl, Field

class Settings(BaseSettings):
    api_base_url: AnyUrl
    request_timeout_ms: int = Field(ge=100, le=60000)

settings = Settings()  # .env や環境変数から読み込み
```

#### Go
Bad（反パターン）：
```go
resp, err := httpClient.Do(req.WithContext(ctx)) // 直前で 10*time.Second を直書き
```

Good（改善）：
```go
const (
    DefaultRequestTimeout = 10 * time.Second
)

type Config struct {
    APIBaseURL string
    RequestTimeout time.Duration
}
```

### リンター／静的解析の推奨設定

#### TypeScript/JavaScript（ESLint）
```json
{
  "rules": {
    "no-magic-numbers": [
      "warn",
      {
        "ignore": [0, 1, -1],
        "ignoreDefaultValues": true,
        "enforceConst": true,
        "detectObjects": true
      }
    ]
  }
}
```

#### Python（Ruff）
`PLR2004` ルール（比較でのマジック値）等を有効化：
```toml
# pyproject.toml
[tool.ruff]
select = ["E", "F", "PL"]
ignore = []
```

#### Go（golangci-lint）
`gomnd`（magic numbers）、`gocritic` を有効化：
```yaml
linters:
  enable:
    - gomnd
    - gocritic
linters-settings:
  gomnd:
    settings:
      mnd:
        ignored-numbers: [0,1,-1]
```

### ドメイン定数の扱い（設計指針）
- 事業上のルール由来の値（例：割引率最大 30%）は Domain 層で Value Object/定数として表現し、理由をコメントで残す
- UI や API プロトコル都合（例：既定ページサイズ）は Application 層に置く
- 接続情報やタイムアウト／リトライは Infrastructure 層の設定で管理し、DIで注入

### 文字列のハードコード回避
- URL・パス・トピック名・キュー名・ヘッダ名・エラーコードは定数化
- UI 文言は i18n リソースへ（キーは命名規約に従い一貫性を維持）

### AI への指示（プロンプト追加文）
> 出力するコードでは、マジックナンバー／ハードコードを使用しない。意味のある定数名に抽出し、設定値は環境変数または設定モジュールから注入する。単位・範囲をコメントまたは型で明示すること。
### 命名規則
| 種別 | 規則 | 良い例 | 悪い例 |
|------|------|--------|--------|
| 変数 | camelCase | `userName` | `user_name` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` | `maxRetryCount` |
| 関数 | camelCase | `getUserById` | `GetUserById` |
| クラス | PascalCase | `UserService` | `userService` |
| インターフェース | PascalCase + I prefix | `IUserRepository` | `UserRepository` |
| 型エイリアス | PascalCase | `UserId` | `userId` |
| Enum | PascalCase | `UserRole` | `USER_ROLE` |
| ファイル名（コンポーネント） | PascalCase | `UserCard.tsx` | `user-card.tsx` |
| ファイル名（その他） | kebab-case | `date-utils.ts` | `dateUtils.ts` |

### コメント規約
```typescript
/**
 * ユーザー情報を取得する
 * @param userId - ユーザーID
 * @returns ユーザー情報
 * @throws {UserNotFoundError} ユーザーが見つからない場合
 */
async function getUser(userId: string): Promise<User> {
  // 実装
}
```

## デザインパターン
### Singletonパターン
```typescript
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

  getConfig(): Config {
    return this.config;
  }
}
```

### Factoryパターン
```typescript
interface PaymentProcessor {
  process(amount: number): Promise<void>;
}

class PaymentProcessorFactory {
  static create(type: PaymentType): PaymentProcessor {
    switch (type) {
      case PaymentType.CREDIT_CARD:
        return new CreditCardProcessor();
      case PaymentType.PAYPAL:
        return new PayPalProcessor();
      default:
        throw new Error(`Unsupported payment type: ${type}`);
    }
  }
}
```

### Repositoryパターン
```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

class UserRepositoryImpl implements UserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.db.query('SELECT * FROM users WHERE id = ?', [id]);
    return data ? this.mapToUser(data) : null;
  }

  private mapToUser(data: any): User {
    // マッピングロジック
  }
}
```

### Strategyパターン
```typescript
interface ValidationStrategy {
  validate(value: string): boolean;
}

class EmailValidationStrategy implements ValidationStrategy {
  validate(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
}

class PhoneValidationStrategy implements ValidationStrategy {
  validate(value: string): boolean {
    const phoneRegex = /^\d{10,}$/;
    return phoneRegex.test(value);
  }
}

class Validator {
  constructor(private strategy: ValidationStrategy) {}

  validate(value: string): boolean {
    return this.strategy.validate(value);
  }
}
```

## エラーハンドリングパターン
### カスタムエラークラス
```typescript
class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends ApplicationError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
  }
}
```

### エラーハンドリング
```typescript
async function handleRequest(req: Request, res: Response) {
  try {
    const result = await processRequest(req);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof ApplicationError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    } else {
      // 予期しないエラー
      console.error('Unexpected error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      });
    }
  }
}
```

### Result型パターン
```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { success: false, error: 'Division by zero' };
  }
  return { success: true, data: a / b };
}

// 使用例
const result = divide(10, 2);
if (result.success) {
  console.log(`Result: ${result.data}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

## 非同期処理パターン
### Promise Chain
```typescript
function fetchUserData(userId: string): Promise<UserData> {
  return fetchUser(userId)
    .then(user => fetchUserPosts(user.id))
    .then(posts => fetchPostComments(posts))
    .then(comments => ({
      user,
      posts,
      comments,
    }))
    .catch(error => {
      console.error('Error fetching user data:', error);
      throw new Error('Failed to fetch user data');
    });
}
```

### Async/Await
```typescript
async function fetchUserData(userId: string): Promise<UserData> {
  try {
    const user = await fetchUser(userId);
    const posts = await fetchUserPosts(user.id);
    const comments = await fetchPostComments(posts);
    
    return { user, posts, comments };
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw new Error('Failed to fetch user data');
  }
}
```

### 並列処理
```typescript
async function fetchMultipleResources(): Promise<Resources> {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments(),
  ]);
  
  return { users, posts, comments };
}
```

### リトライパターン
```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError!;
}
```

## 状態管理パターン
### Storeパターン
```typescript
interface State {
  users: User[];
  loading: boolean;
  error: string | null;
}

class Store<T> {
  private state: T;
  private listeners: ((state: T) => void)[] = [];

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return this.state;
  }

  setState(updater: (state: T) => T): void {
    this.state = updater(this.state);
    this.notify();
  }

  subscribe(listener: (state: T) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

### Reducerパターン
```typescript
type Action =
  | { type: 'ADD_USER'; payload: User }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

function userReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_USER':
      return {
        ...state,
        users: [...state.users, action.payload],
      };
    case 'REMOVE_USER':
      return {
        ...state,
        users: state.users.filter(u => u.id !== action.payload),
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
}
```

## APIクライアントパターン
### REST APIクライアント
```typescript
class ApiClient {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      method,
      headers: this.headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }
}
```

## フォームバリデーションパターン
### バリデーションスキーマ
```typescript
interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

class ValidationSchema {
  private rules: Map<string, ValidationRule[]> = new Map();

  field(name: string): FieldValidator {
    return new FieldValidator(name, this);
  }

  addRule(field: string, rule: ValidationRule): void {
    const rules = this.rules.get(field) || [];
    rules.push(rule);
    this.rules.set(field, rules);
  }

  validate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string[]> = {};

    for (const [field, rules] of this.rules.entries()) {
      const value = data[field];
      const fieldErrors: string[] = [];

      for (const rule of rules) {
        if (!rule.validate(value)) {
          fieldErrors.push(rule.message);
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

class FieldValidator {
  constructor(
    private fieldName: string,
    private schema: ValidationSchema
  ) {}

  required(message = 'This field is required'): this {
    this.schema.addRule(this.fieldName, {
      validate: (value) => value != null && value !== '',
      message,
    });
    return this;
  }

  email(message = 'Invalid email format'): this {
    this.schema.addRule(this.fieldName, {
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message,
    });
    return this;
  }

  min(length: number, message?: string): this {
    this.schema.addRule(this.fieldName, {
      validate: (value) => value.length >= length,
      message: message || `Minimum length is ${length}`,
    });
    return this;
  }
}
```

## キャッシングパターン
### メモリキャッシュ
```typescript
class MemoryCache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();

  set(key: string, value: T, ttl: number): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 期限切れエントリの定期的なクリーンアップ
  startCleanup(interval: number = 60000): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiry) {
          this.cache.delete(key);
        }
      }
    }, interval);
  }
}
```

## セキュリティパターン
### 入力検証
```typescript
class InputValidator {
  static sanitizeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isStrongPassword(password: string): boolean {
    // 最低8文字、大文字小文字数字を含む
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }
}
```

### 認証トークン管理
```typescript
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  static setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}
```

## パフォーマンス最適化パターン
### デバウンス
```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// 使用例
const debouncedSearch = debounce((query: string) => {
  console.log('Searching for:', query);
}, 300);
```

### スロットル
```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 使用例
const throttledScroll = throttle(() => {
  console.log('Scroll event');
}, 100);
```

### 遅延ローディング
```typescript
class LazyLoader<T> {
  private value?: T;
  private loader: () => Promise<T>;

  constructor(loader: () => Promise<T>) {
    this.loader = loader;
  }

  async get(): Promise<T> {
    if (this.value === undefined) {
      this.value = await this.loader();
    }
    return this.value;
  }

  reset(): void {
    this.value = undefined;
  }
}
```

## 型安全パターン
### 型ガード
```typescript
interface User {
  type: 'user';
  name: string;
  email: string;
}

interface Admin {
  type: 'admin';
  name: string;
  permissions: string[];
}

type Person = User | Admin;

function isAdmin(person: Person): person is Admin {
  return person.type === 'admin';
}

function handlePerson(person: Person) {
  if (isAdmin(person)) {
    console.log('Admin permissions:', person.permissions);
  } else {
    console.log('User email:', person.email);
  }
}
```

### Branded Types
```typescript
type UserId = string & { readonly brand: unique symbol };
type PostId = string & { readonly brand: unique symbol };

function createUserId(id: string): UserId {
  return id as UserId;
}

function createPostId(id: string): PostId {
  return id as PostId;
}

// 型安全な関数
function getUserById(userId: UserId): Promise<User> {
  // 実装
}

// コンパイルエラー: PostIdをUserIdとして使用できない
// getUserById(createPostId('123'));
```