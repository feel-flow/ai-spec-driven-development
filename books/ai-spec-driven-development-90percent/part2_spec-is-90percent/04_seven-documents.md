# 第4章　7文書が「AI任せ」を成立させる最小構成

## この章で学ぶこと

- 7文書の全体像と各文書の役割
- 何が欠けるとAIが迷うのか
- 各文書の具体的な内容と書き方

---

## 7文書の全体像

### なぜ7つなのか

従来のソフトウェア開発ドキュメントは、60以上のテンプレートがあることも珍しくありません。

- 要件定義書
- 基本設計書
- 詳細設計書
- テスト計画書
- テスト仕様書
- 運用手順書
- ...

しかし、**AIにとって60ファイルは多すぎます**。

コンテキストウィンドウの制限もありますが、それ以上に**情報が散在すると矛盾が生まれやすい**という問題があります。

7文書は、**AIが効率的に参照できる最小構成**として設計されています。

### 7文書の関係図

```
                    ┌─────────────┐
                    │  MASTER.md  │  ← 索引・ナビゲーション
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  PROJECT.md   │  │ ARCHITECTURE  │  │   DOMAIN.md   │
│  (What/Why)   │  │     .md       │  │  (ビジネス)   │
│               │  │   (How)       │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  PATTERNS.md  │  │  TESTING.md   │  │ DEPLOYMENT.md │
│  (実装規約)   │  │  (品質基準)   │  │   (運用)      │
└───────────────┘  └───────────────┘  └───────────────┘
```

### 何が欠けるとAIが迷うか

| 欠けている文書 | AIが迷うこと | 結果 |
|---------------|-------------|------|
| MASTER.md | どこに何があるかわからない | 無関係なコードを参照する |
| PROJECT.md | なぜこの機能が必要かわからない | 要件と違う実装をする |
| ARCHITECTURE.md | どう実装すべきかわからない | 既存と整合しない設計をする |
| DOMAIN.md | ビジネスルールがわからない | ルール違反の実装をする |
| PATTERNS.md | どう書くべきかわからない | 一貫性のないコードを書く |
| TESTING.md | 何をテストすべきかわからない | テストが漏れる/過剰になる |
| DEPLOYMENT.md | どうリリースすべきかわからない | 運用できない実装をする |

---

## MASTER.md：プロジェクト索引

### 役割

MASTER.mdは**AIが最初に読む文書**です。

プロジェクトの地図として機能し、「何がどこにあるか」を示します。

### 含めるべき内容

```markdown
# MASTER.md

## プロジェクト概要
- プロジェクト名：[名前]
- 目的：[1〜2文で]
- 主要技術：[言語、フレームワーク、DB]

## 文書索引
| 文書 | 説明 | 更新日 |
|------|------|--------|
| [PROJECT.md](./PROJECT.md) | ビジョン・要件 | 2024-01-01 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | システム設計 | 2024-01-01 |
| [DOMAIN.md](./DOMAIN.md) | ビジネスロジック | 2024-01-01 |
| [PATTERNS.md](./PATTERNS.md) | 実装パターン | 2024-01-01 |
| [TESTING.md](./TESTING.md) | テスト戦略 | 2024-01-01 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 運用手順 | 2024-01-01 |

## ディレクトリ構造
```text
src/
├── api/          # APIエンドポイント
├── services/     # ビジネスロジック
├── repositories/ # データアクセス
├── domain/       # ドメインモデル
└── utils/        # ユーティリティ
```

## 重要な制約
- [最重要ルール1]
- [最重要ルール2]
```

### AIへの効果

MASTER.mdがあると、AIは：

- 「認証の実装はsrc/services/auth/にある」と理解できる
- 「DB設計はARCHITECTURE.mdを見ればいい」と判断できる
- 「コーディング規約はPATTERNS.mdに従う」と認識できる

---

## PROJECT.md：ビジョンと要件

### 役割

**What（何を作るか）**と**Why（なぜ作るか）**を定義します。

### 含めるべき内容

```markdown
# PROJECT.md

## ビジョン
[このプロジェクトが実現したい世界を1〜2文で]

## ターゲットユーザー
- ペルソナ1：[具体的な人物像]
- ペルソナ2：[具体的な人物像]

## 主要機能
### MVP（必須）
- [ ] 機能A：[説明]
- [ ] 機能B：[説明]

### Phase 2
- [ ] 機能C：[説明]

## 非機能要件
- パフォーマンス：[具体的な数値目標]
- セキュリティ：[必須要件]
- 可用性：[目標SLA]

## スコープ外
- [明示的に作らないもの]
```

### AIへの効果

PROJECT.mdがあると、AIは：

- 「この機能はMVPに含まれるのか」を判断できる
- 「パフォーマンス目標を満たす実装」を選択できる
- 「スコープ外の機能を勝手に追加しない」

---

## ARCHITECTURE.md：システム設計

### 役割

**How（どう作るか）**を定義します。技術的な制約と設計判断を記録します。

### 含めるべき内容

```markdown
# ARCHITECTURE.md

## システム構成図
[Mermaidやテキストでの図]

## 技術スタック
| レイヤー | 技術 | 選定理由 |
|---------|------|---------|
| Frontend | Next.js 14 | App Router、RSC対応 |
| Backend | Node.js + Hono | 軽量、型安全 |
| Database | PostgreSQL | リレーショナル、ACID |
| Cache | Redis | セッション、キャッシュ |

## コンポーネント設計
### APIレイヤー
- ルーティング：[方針]
- 認証：[方式]
- エラーハンドリング：[方式]

### サービスレイヤー
- 依存性注入：[方式]
- トランザクション：[方針]

### データアクセスレイヤー
- ORM：[使用ライブラリ]
- マイグレーション：[方式]

## 設計判断記録（ADR）
### ADR-001：認証方式の選定
- 決定：JWTを採用
- 理由：ステートレス、スケーラブル
- 代替案：セッション方式（却下理由：...）
```

### AIへの効果

ARCHITECTURE.mdがあると、AIは：

- 「Honoのルーティングに従った実装」をする
- 「PostgreSQLの特性を活かしたクエリ」を書く
- 「ADRで決定済みの方式」に従う

---

## DOMAIN.md：ビジネスロジック

### 役割

**ビジネスルールの唯一の置き場所**です。仕様の「正しさ」の定義がここにあります。

### 含めるべき内容

```markdown
# DOMAIN.md

## ドメインモデル
### User
- id: UUID
- email: string（一意、必須）
- status: "active" | "suspended" | "deleted"

### Order
- id: UUID
- userId: UUID（必須）
- items: OrderItem[]（1件以上必須）
- status: "pending" | "confirmed" | "shipped" | "completed"

## ビジネスルール
### 購入ルール
- ユーザーはactive状態でのみ購入可能
- 1回の注文は10商品まで
- 在庫がない商品は購入不可

### 価格計算ルール
- 税率：10%（税込表示）
- 割引適用順序：クーポン → ポイント
- 送料：5,000円以上で無料、未満は500円

## 状態遷移
### Order状態遷移
```text
pending → confirmed → shipped → completed
    ↓         ↓
 cancelled  cancelled
```

## 用語集
| 用語 | 定義 |
|------|------|
| アクティブユーザー | status="active"のユーザー |
| 有効在庫 | 予約済みを除いた在庫数 |
```

### AIへの効果

DOMAIN.mdがあると、AIは：

- 「active状態のチェックを入れる」ことを忘れない
- 「税込計算の順序を正しく実装」する
- 「用語を統一して使用」する

---

## PATTERNS.md：実装パターン

### 役割

**「どう書くべきか」のナレッジ蓄積先**です。レビューで指摘されたパターンをここに集約します。

### 含めるべき内容

```markdown
# PATTERNS.md

## コーディング規約
### 命名規則
- 変数：camelCase
- 定数：UPPER_SNAKE_CASE
- クラス：PascalCase
- ファイル：kebab-case.ts

### エラーハンドリング
```typescript
// ✅ Good
const result = await userService.findById(id);
if (!result.ok) {
  return err(new UserNotFoundError(id));
}
return ok(result.value);

// ❌ Bad
try {
  const user = await userService.findById(id);
} catch (e) {
  throw new Error('User not found');
}
```

## 頻出パターン
### リポジトリパターン
```typescript
interface UserRepository {
  findById(id: string): Promise<Result<User, NotFoundError>>;
  save(user: User): Promise<Result<User, SaveError>>;
}
```

### サービスパターン
```typescript
class UserService {
  constructor(private readonly repo: UserRepository) {}

  async getUser(id: string): Promise<Result<UserDTO, GetUserError>> {
    // ビジネスロジック
  }
}
```

## アンチパターン
### 避けるべき実装
- any型の使用（代わりにunknownを使用）
- マジックナンバー（代わりに定数化）
- 複数責務の関数（単一責任に分割）
```

### AIへの効果

PATTERNS.mdがあると、AIは：

- 「Result型を使ったエラーハンドリング」を実装する
- 「リポジトリパターン」に従った設計をする
- 「アンチパターンを避けた」コードを書く

---

## TESTING.md：テスト戦略

### 役割

**「何が正しいか」の検証方法**を定義します。テストの書き方と品質基準をここに集約します。

### 含めるべき内容

```markdown
# TESTING.md

## テストピラミッド
- Unit: 70%（ドメインロジック中心）
- Integration: 20%（API/DB連携）
- E2E: 10%（クリティカルパス）

## テストの書き方
### ユニットテスト
```typescript
describe('UserService', () => {
  describe('getUser', () => {
    it('存在するユーザーを取得できる', async () => {
      // Arrange
      const repo = createMockRepo({ findById: ok(mockUser) });
      const service = new UserService(repo);

      // Act
      const result = await service.getUser('user-1');

      // Assert
      expect(result.ok).toBe(true);
      expect(result.value.id).toBe('user-1');
    });
  });
});
```

### モックの方針
- 外部API：必ずモック
- DB：Integrationテストでは実DB使用
- 時間：固定値を注入

## カバレッジ目標
| 対象 | 目標 |
|------|------|
| ドメインロジック | 90%以上 |
| サービス層 | 80%以上 |
| API層 | 70%以上 |
| ユーティリティ | 80%以上 |
```

### AIへの効果

TESTING.mdがあると、AIは：

- 「Arrange-Act-Assertパターン」でテストを書く
- 「適切なモック戦略」を選択する
- 「カバレッジ目標を意識した」テストを追加する

---

## DEPLOYMENT.md：運用手順

### 役割

**「どうリリースするか」「どう運用するか」**を定義します。

### 含めるべき内容

```markdown
# DEPLOYMENT.md

## 環境
| 環境 | URL | 用途 |
|------|-----|------|
| development | localhost:3000 | ローカル開発 |
| staging | staging.example.com | 検証環境 |
| production | example.com | 本番環境 |

## デプロイフロー
1. PR作成 → CIでテスト実行
2. レビュー承認 → mainにマージ
3. 自動デプロイ → staging環境
4. 手動承認 → production環境

## 監視項目
| メトリクス | 警告閾値 | 重大閾値 |
|-----------|---------|---------|
| レスポンスタイム | 500ms | 1000ms |
| エラーレート | 1% | 5% |
| CPU使用率 | 70% | 90% |

## 障害対応
### Runbook
- [APIレスポンス遅延](./runbooks/api-slow.md)
- [DB接続エラー](./runbooks/db-connection.md)
- [認証失敗急増](./runbooks/auth-failure.md)
```

### AIへの効果

DEPLOYMENT.mdがあると、AIは：

- 「環境変数の扱い方」を正しく実装する
- 「監視しやすい設計」を意識する
- 「運用しやすいログ出力」を入れる

---

## 章末チェックリスト

- [ ] 7文書のうち、自分のプロジェクトに存在する文書を確認する
- [ ] 最も欠けている（または曖昧な）文書を特定する
- [ ] まずMASTER.mdを作成（または整備）する
- [ ] 次に欠けている文書を1つ選び、最小限の内容で作成する

---

## 次章への橋渡し

この章では、7文書それぞれの役割と内容を学びました。

次章では、この7文書を**どのように運用するか**——Frontmatter、バージョン管理、検証チェックなど、日々の運用ルールを解説します。
