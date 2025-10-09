# ベストプラクティス集

この文書は、プロジェクトで採用しているベストプラクティスと、避けるべきアンチパターンをまとめた文書です。AIが一貫性のある高品質なコードを生成できるよう、具体的な実装例とともに記載しています。

## コーディング規約

### TypeScript

#### 型安全性の確保
**推奨**:
```typescript
// 厳密な型定義
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// 型ガードの使用
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'email' in obj
  );
}

// ジェネリクスの活用
class Repository<T> {
  async findById(id: string): Promise<T | null> {
    // 実装
  }
}
```

**避けるべき**:
```typescript
// any型の使用
function processData(data: any): any {
  return data.someProperty;
}

// 型アサーションの乱用
const user = data as User;
```

#### エラーハンドリング
**推奨**:
```typescript
// Result パターンの使用
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function createUser(userData: CreateUserRequest): Promise<Result<User>> {
  try {
    const user = await userService.create(userData);
    return { success: true, data: user };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

// カスタムエラークラス
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**避けるべき**:
```typescript
// エラーの無視
try {
  await riskyOperation();
} catch (error) {
  // 何もしない
}

// 汎用的なエラーハンドリング
catch (error) {
  throw new Error('Something went wrong');
}
```

---

### データベース

#### クエリの最適化
**推奨**:
```sql
-- インデックスの活用
CREATE INDEX CONCURRENTLY idx_users_email_active 
ON users(email) WHERE active = true;

-- 適切なJOINの使用
SELECT u.id, u.name, p.title
FROM users u
INNER JOIN posts p ON u.id = p.user_id
WHERE u.active = true
  AND p.published_at > NOW() - INTERVAL '30 days';

-- パラメータ化クエリ
SELECT * FROM users WHERE email = $1 AND active = $2;
```

**避けるべき**:
```sql
-- N+1クエリ問題
SELECT * FROM users;
-- 各ユーザーに対して個別にクエリを実行

-- SELECT * の使用
SELECT * FROM users WHERE id = $1;

-- インデックスを無視するクエリ
SELECT * FROM users WHERE LOWER(email) = LOWER($1);
```

#### トランザクション管理
**推奨**:
```typescript
// トランザクションの適切な使用
async function transferMoney(
  fromUserId: string,
  toUserId: string,
  amount: number
): Promise<Result<void>> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 送金元の残高確認
    const fromBalance = await client.query(
      'SELECT balance FROM accounts WHERE user_id = $1 FOR UPDATE',
      [fromUserId]
    );
    
    if (fromBalance.rows[0].balance < amount) {
      throw new Error('Insufficient funds');
    }
    
    // 送金処理
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE user_id = $2',
      [amount, fromUserId]
    );
    
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE user_id = $2',
      [amount, toUserId]
    );
    
    await client.query('COMMIT');
    return { success: true, data: undefined };
    
  } catch (error) {
    await client.query('ROLLBACK');
    return { success: false, error: error as Error };
  } finally {
    client.release();
  }
}
```

**避けるべき**:
```typescript
// トランザクションの不適切な使用
async function badTransfer(fromUserId: string, toUserId: string, amount: number) {
  // トランザクションなしで複数の更新
  await pool.query('UPDATE accounts SET balance = balance - $1 WHERE user_id = $2', [amount, fromUserId]);
  await pool.query('UPDATE accounts SET balance = balance + $1 WHERE user_id = $2', [amount, toUserId]);
  // 途中でエラーが発生した場合の整合性が保てない
}
```

---

### API設計

#### RESTful API
**推奨**:
```typescript
// 適切なHTTPメソッドとステータスコード
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

**避けるべき**:
```typescript
// 不適切なHTTPメソッドの使用
app.get('/api/users/delete/:id', deleteUser); // DELETEメソッドを使うべき

// 一貫性のないレスポンス形式
app.get('/api/users', (req, res) => {
  res.json(users); // エラーハンドリングなし
});
```

#### バリデーション
**推奨**:
```typescript
// スキーマベースのバリデーション
import Joi from 'joi';

const createUserSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(150).optional(),
});

// ミドルウェアでのバリデーション
const validateCreateUser = (req: Request, res: Response, next: NextFunction) => {
  const { error } = createUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(d => d.message)
    });
  }
  next();
};
```

**避けるべき**:
```typescript
// 手動バリデーション
if (!req.body.name || req.body.name.length < 1) {
  return res.status(400).json({ error: 'Name is required' });
}

// 不十分なバリデーション
if (req.body.email) {
  // メール形式のチェックなし
}
```

---

### セキュリティ

#### 認証・認可
**推奨**:
```typescript
// JWT認証の実装
import jwt from 'jsonwebtoken';

class AuthService {
  generateToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: '24h',
        algorithm: 'HS256'
      }
    );
  }
  
  verifyToken(token: string): UserPayload {
    return jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256']
    }) as UserPayload;
  }
}

// 認可ミドルウェア
const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

**避けるべき**:
```typescript
// 脆弱な認証
const token = jwt.sign({ userId: user.id }, 'weak-secret');

// 認可の不備
app.get('/api/admin/users', (req, res) => {
  // 認可チェックなし
  res.json(users);
});
```

#### データ保護
**推奨**:
```typescript
// パスワードのハッシュ化
import bcrypt from 'bcrypt';

class PasswordService {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
  
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// 機密データの暗号化
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor(key: string) {
    this.key = Buffer.from(key, 'base64');
  }
  
  encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }
}
```

**避けるべき**:
```typescript
// 平文でのパスワード保存
const user = {
  email: 'user@example.com',
  password: 'plaintext-password' // 危険
};

// 弱い暗号化
const encrypted = Buffer.from(data).toString('base64');
```

---

### テスト

#### 単体テスト
**推奨**:
```typescript
// AAA パターン
describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserRepository>;
  
  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    userService = new UserService(mockRepository);
  });
  
  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };
      const expectedUser = { id: '1', ...userData };
      mockRepository.create.mockResolvedValue(expectedUser);
      
      // Act
      const result = await userService.createUser(userData);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedUser);
      expect(mockRepository.create).toHaveBeenCalledWith(userData);
    });
    
    it('should return error for invalid email', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30
      };
      
      // Act
      const result = await userService.createUser(userData);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
    });
  });
});
```

**避けるべき**:
```typescript
// テストの不備
it('should work', async () => {
  const result = await userService.createUser({});
  expect(result).toBeDefined();
});

// モックの不適切な使用
it('should create user', async () => {
  const result = await userService.createUser(userData);
  expect(result).toBeTruthy();
  // 実際のデータベースに接続している
});
```

#### 統合テスト
**推奨**:
```typescript
// 統合テストの実装
describe('User API Integration', () => {
  let app: Express;
  let testDb: Database;
  
  beforeAll(async () => {
    testDb = await setupTestDatabase();
    app = createApp(testDb);
  });
  
  afterAll(async () => {
    await cleanupTestDatabase(testDb);
  });
  
  beforeEach(async () => {
    await testDb.query('DELETE FROM users');
  });
  
  describe('POST /api/users', () => {
    it('should create a user and return 201', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };
      
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: userData.name,
        email: userData.email,
        age: userData.age
      });
      
      // データベースに保存されていることを確認
      const user = await testDb.query('SELECT * FROM users WHERE id = $1', [response.body.id]);
      expect(user.rows).toHaveLength(1);
    });
  });
});
```

---

### パフォーマンス

#### キャッシュ戦略
**推奨**:
```typescript
// Redis キャッシュの実装
import Redis from 'ioredis';

class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// キャッシュ付きサービス
class CachedUserService {
  constructor(
    private userRepository: UserRepository,
    private cache: CacheService
  ) {}
  
  async findById(id: string): Promise<User | null> {
    const cacheKey = `user:${id}`;
    
    // キャッシュから取得を試行
    let user = await this.cache.get<User>(cacheKey);
    if (user) {
      return user;
    }
    
    // データベースから取得
    user = await this.userRepository.findById(id);
    if (user) {
      await this.cache.set(cacheKey, user, 3600); // 1時間キャッシュ
    }
    
    return user;
  }
}
```

**避けるべき**:
```typescript
// キャッシュの不適切な使用
async function getUser(id: string) {
  // キャッシュの有効期限なし
  const cached = await redis.get(`user:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  await redis.set(`user:${id}`, JSON.stringify(user));
  return user;
}
```

#### 非同期処理
**推奨**:
```typescript
// Promise.all の適切な使用
async function processUsers(userIds: string[]): Promise<User[]> {
  const users = await Promise.all(
    userIds.map(id => userRepository.findById(id))
  );
  
  return users.filter(user => user !== null) as User[];
}

// 並行処理の制御
async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  concurrency: number = 5
): Promise<void> {
  const semaphore = new Semaphore(concurrency);
  
  await Promise.all(
    items.map(item => 
      semaphore.acquire().then(async (release) => {
        try {
          await processor(item);
        } finally {
          release();
        }
      })
    )
  );
}
```

**避けるべき**:
```typescript
// 順次処理（非効率）
async function processUsersSequentially(userIds: string[]): Promise<User[]> {
  const users: User[] = [];
  for (const id of userIds) {
    const user = await userRepository.findById(id);
    if (user) {
      users.push(user);
    }
  }
  return users;
}

// 無制限の並行処理
async function processAllUsers(userIds: string[]): Promise<User[]> {
  const users = await Promise.all(
    userIds.map(id => userRepository.findById(id))
  );
  return users.filter(user => user !== null) as User[];
}
```

---

### ログ・監視

#### ログ設計
**推奨**:
```typescript
// 構造化ログの実装
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// アプリケーションログ
class UserService {
  async createUser(userData: CreateUserRequest): Promise<Result<User>> {
    logger.info('Creating user', { 
      email: userData.email,
      requestId: req.id 
    });
    
    try {
      const user = await this.userRepository.create(userData);
      
      logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
        requestId: req.id
      });
      
      return { success: true, data: user };
    } catch (error) {
      logger.error('Failed to create user', {
        error: error.message,
        stack: error.stack,
        userData: { email: userData.email },
        requestId: req.id
      });
      
      return { success: false, error };
    }
  }
}
```

**避けるべき**:
```typescript
// 不適切なログ
console.log('User created'); // 構造化されていない
console.error(error); // スタックトレースなし
logger.info('Processing data', { password: userData.password }); // 機密情報のログ
```

---

## アーキテクチャパターン

### レイヤーアーキテクチャ
**推奨**:
```
src/
├── controllers/     # プレゼンテーション層
├── services/        # アプリケーション層
├── repositories/    # インフラストラクチャ層
├── entities/        # ドメイン層
└── types/          # 型定義
```

**各層の責務**:
- **Controllers**: HTTPリクエストの処理、バリデーション、レスポンス
- **Services**: ビジネスロジック、トランザクション管理
- **Repositories**: データアクセス、永続化
- **Entities**: ドメインオブジェクト、ビジネスルール

### 依存性注入
**推奨**:
```typescript
// インターフェースの定義
interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

// サービスの実装
class UserService {
  constructor(private userRepository: UserRepository) {}
  
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}

// 依存性の注入
const userRepository = new PostgresUserRepository(db);
const userService = new UserService(userRepository);
```

---

## Gitワークフロー最適化

### Claude Code SessionStart Hook

**推奨**:
PRマージ後のブランチ切り替え忘れを防ぐため、SessionStart hookを設定します。

```json
// .claude/settings.json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": ".claude/hooks/check-branch-status.sh",
        "description": "Check git branch status and warn if needed"
      }
    ]
  }
}
```

**利点**:
- PRマージ済みブランチでの作業を防止
- 常に最新のdevelopブランチから作業開始
- マージ忘れやブランチ混乱を削減

詳細は [DEPLOYMENT.md](../05-operations/DEPLOYMENT.md) の「開発環境の最適化」セクションを参照してください。

### ブランチ命名規則

**推奨**:
```bash
# 機能開発
feature/#123-add-user-authentication

# バグ修正
fix/#124-correct-login-validation

# その他のタスク
chore/#125-update-dependencies
```

**避けるべき**:
```bash
# Issue番号なし
feature/add-user-auth

# 曖昧な命名
fix/bug
update/stuff
```

---

## 更新履歴

| 日付 | 更新者 | 更新内容 |
|------|--------|----------|
| 2024-01-15 | 田中 | コーディング規約を追加 |
| 2024-01-20 | 佐藤 | データベース関連のベストプラクティスを追加 |
| 2024-01-25 | 山田 | セキュリティ関連のベストプラクティスを追加 |
| 2024-02-01 | 田中 | テスト関連のベストプラクティスを追加 |
| 2024-02-05 | 佐藤 | パフォーマンス関連のベストプラクティスを追加 |
| 2024-02-10 | 山田 | アーキテクチャパターンを追加 |
| 2025-01-XX | システム | Gitワークフロー最適化（SessionStart Hook）を追加 |
