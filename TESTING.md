# AI駆動テスト戦略

## テスト方針
### 基本原則
1. **AIファースト**: AIツールを活用したテストコード生成
2. **高カバレッジ**: 80%以上のコードカバレッジを目標
3. **早期検出**: CI/CDパイプラインでの自動実行
4. **保守性**: 読みやすく、メンテナンスしやすいテストコード
5. **独立性**: 各テストは独立して実行可能

### テストピラミッド
```
        /\
       /  \  E2Eテスト (10%)
      /    \  - ユーザージャーニー
     /──────\  - クリティカルパス
    /        \
   /          \ 統合テスト (30%)
  /            \ - API統合
 /              \ - DB連携
/________________\ ユニットテスト (60%)
                   - ビジネスロジック
                   - ユーティリティ関数
```

## テストカテゴリ
### ユニットテスト
**対象**:
- 純粋関数
- クラスメソッド
- ビジネスロジック
- ユーティリティ関数

**ツール**:
- テストフレームワーク: Jest / Vitest / Mocha
- アサーション: Chai / Jest Matchers
- モック: Sinon / Jest Mock

**命名規則**:
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should return expected value when given valid input', () => {
      // テストコード
    });
    
    it('should throw error when given invalid input', () => {
      // テストコード
    });
  });
});
```

### 統合テスト
**対象**:
- API エンドポイント
- データベース操作
- 外部サービス連携
- 複数モジュール間の連携

**ツール**:
- APIテスト: Supertest / Axios
- DBテスト: Test Containers
- モックサーバー: MSW / Nock

**テスト例**:
```typescript
describe('User API Integration', () => {
  beforeEach(async () => {
    await database.clean();
    await database.seed();
  });

  afterEach(async () => {
    await database.clean();
  });

  it('POST /users should create a new user', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        name: 'Test User',
        email: 'test@example.com'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### E2Eテスト
**対象**:
- クリティカルなユーザーフロー
- ビジネス上重要な機能
- 複雑な画面遷移

**ツール**:
- Playwright
- Cypress
- Selenium

**シナリオ例**:
```typescript
test('User Registration Flow', async ({ page }) => {
  // 1. トップページにアクセス
  await page.goto('/');
  
  // 2. 登録ボタンをクリック
  await page.click('text=Sign Up');
  
  // 3. フォームに入力
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  
  // 4. 送信
  await page.click('button[type="submit"]');
  
  // 5. 成功メッセージを確認
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## AIを活用したテスト生成
### テストケース生成プロンプト
```markdown
以下の関数に対するユニットテストを生成してください：

\`\`\`typescript
function calculateDiscount(price: number, discountRate: number): number {
  if (price < 0 || discountRate < 0 || discountRate > 100) {
    throw new Error('Invalid input');
  }
  return price * (1 - discountRate / 100);
}
\`\`\`

要件：
1. 正常系のテストケース
2. 異常系のテストケース（境界値、エラーケース）
3. エッジケースのテスト
4. Jest/Vitestを使用
5. 日本語でテストケースの説明を記載
```

### AIレビューチェックリスト
- [ ] テストケースの網羅性
- [ ] エッジケースの考慮
- [ ] エラーハンドリングのテスト
- [ ] モックの適切な使用
- [ ] テストの独立性

## テストデータ管理
### Factory パターン
```typescript
class UserFactory {
  static create(overrides?: Partial<User>): User {
    return {
      id: faker.datatype.uuid(),
      name: faker.name.fullName(),
      email: faker.internet.email(),
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

// 使用例
const user = UserFactory.create({ name: 'テストユーザー' });
const users = UserFactory.createMany(10);
```

### Fixture管理
```typescript
// fixtures/users.json
{
  "validUser": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "山田太郎",
    "email": "yamada@example.com"
  },
  "invalidUser": {
    "name": "",
    "email": "invalid-email"
  }
}

// テストでの使用
import fixtures from './fixtures/users.json';

test('should validate user', () => {
  const result = validateUser(fixtures.validUser);
  expect(result).toBe(true);
});
```

## モック戦略
### 外部サービスのモック
```typescript
// __mocks__/emailService.ts
export const sendEmail = jest.fn().mockResolvedValue({
  messageId: 'mock-message-id',
  status: 'sent'
});

// テストでの使用
jest.mock('../services/emailService');

test('should send welcome email', async () => {
  await userService.register(userData);
  
  expect(sendEmail).toHaveBeenCalledWith({
    to: userData.email,
    subject: 'Welcome!',
    template: 'welcome'
  });
});
```

### データベースのモック
```typescript
// In-memory database for testing
import { createMockDatabase } from '@test/utils';

describe('User Repository', () => {
  let db: MockDatabase;
  
  beforeEach(() => {
    db = createMockDatabase();
  });
  
  afterEach(() => {
    db.reset();
  });
  
  test('should find user by email', async () => {
    const user = UserFactory.create();
    await db.users.insert(user);
    
    const found = await userRepository.findByEmail(user.email);
    expect(found).toEqual(user);
  });
});
```

## パフォーマンステスト
### 負荷テスト設定
```yaml
# k6-config.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // ランプアップ
    { duration: '5m', target: 100 }, // 維持
    { duration: '2m', target: 0 },   // ランプダウン
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95%が500ms以内
    http_req_failed: ['rate<0.1'],    // エラー率10%未満
  },
};

export default function() {
  const response = http.get('https://api.example.com/users');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### メモリリークテスト
```typescript
describe('Memory Leak Tests', () => {
  test('should not leak memory on repeated operations', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 1000回繰り返し実行
    for (let i = 0; i < 1000; i++) {
      await performOperation();
    }
    
    // ガベージコレクションを強制実行
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // メモリ増加が10MB以内であることを確認
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

## CI/CD統合
### GitHub Actions設定
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost/test
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### テストレポート設定
```typescript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
    }],
  ],
};
```

## テストのベストプラクティス
### DRY原則の適用
```typescript
// テストヘルパー関数
function setupTestUser(overrides = {}) {
  return {
    user: UserFactory.create(overrides),
    token: generateAuthToken(),
    cleanup: () => database.users.delete(),
  };
}

// 使用例
test('should update user profile', async () => {
  const { user, token, cleanup } = setupTestUser();
  
  try {
    const response = await updateProfile(user.id, newData, token);
    expect(response.status).toBe(200);
  } finally {
    await cleanup();
  }
});
```

### テストの可読性
```typescript
// Bad: 何をテストしているか不明確
test('test1', () => {
  const result = func(5, 10);
  expect(result).toBe(15);
});

// Good: 明確なテスト名と構造
describe('Calculator', () => {
  describe('add()', () => {
    it('should return sum of two positive numbers', () => {
      // Arrange
      const a = 5;
      const b = 10;
      
      // Act
      const result = calculator.add(a, b);
      
      // Assert
      expect(result).toBe(15);
    });
  });
});
```

### テストの独立性
```typescript
// Bad: 他のテストに依存
let sharedUser;

test('create user', () => {
  sharedUser = createUser();
});

test('update user', () => {
  updateUser(sharedUser); // 前のテストに依存
});

// Good: 各テストが独立
test('create user', () => {
  const user = createUser();
  expect(user).toBeDefined();
});

test('update user', () => {
  const user = createUser(); // 独自にセットアップ
  const updated = updateUser(user);
  expect(updated.name).toBe(newName);
});
```

## トラブルシューティング
### よくある問題と解決策
| 問題 | 原因 | 解決策 |
|------|------|--------|
| テストがランダムに失敗 | 非同期処理の競合状態 | `waitFor`や適切な`await`を使用 |
| テストが遅い | 不要なsetup/teardown | `beforeAll`/`afterAll`の活用 |
| モックが機能しない | インポート順序の問題 | `jest.mock`をファイル先頭に配置 |
| カバレッジが上がらない | テスト対象の選定ミス | 重要なビジネスロジックに集中 |

## メトリクスとKPI
### 測定項目
- **コードカバレッジ**: 80%以上
- **テスト実行時間**: 5分以内（CI/CD）
- **テスト成功率**: 95%以上
- **不安定なテストの数**: 0を目標
- **バグ検出率**: リリース前に90%以上