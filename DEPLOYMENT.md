# デプロイメント戦略

## デプロイメント概要
### 基本方針
1. **自動化優先**: 手動作業を最小限に
2. **安全性重視**: ロールバック可能な設計
3. **監視強化**: リアルタイムでの状態把握
4. **段階的リリース**: リスクを最小化
5. **Infrastructure as Code**: 再現可能な環境構築

### 環境構成
| 環境 | 用途 | URL | 自動デプロイ |
|------|------|-----|------------|
| Development | 開発確認 | dev.example.com | feature/* ブランチ |
| Staging | 受入テスト | staging.example.com | develop ブランチ |
| Production | 本番環境 | example.com | main ブランチ (承認後) |

## CI/CDパイプライン
### パイプライン構成
```yaml
name: Deploy Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # 1. ビルド & テスト
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: dist/

  # 2. セキュリティスキャン
  security-scan:
    runs-on: ubuntu-latest
    needs: build-and-test
    steps:
      - name: Run security audit
        run: npm audit
        
      - name: SAST scan
        uses: github/super-linter@v4
        
      - name: Container scan (if applicable)
        uses: aquasecurity/trivy-action@master

  # 3. デプロイ
  deploy:
    runs-on: ubuntu-latest
    needs: [build-and-test, security-scan]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v3
        
      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          # デプロイスクリプト実行
          ./scripts/deploy.sh production
```

## デプロイメント戦略
### Blue-Green Deployment
```mermaid
graph LR
    LB[Load Balancer]
    B[Blue - Current]
    G[Green - New]
    
    LB --> B
    LB -.-> G
    
    style B fill:#4285f4
    style G fill:#34a853
```

**手順**:
1. Green環境に新バージョンをデプロイ
2. Green環境でヘルスチェック実施
3. ロードバランサーをGreenに切り替え
4. 問題があればBlueに即座に戻す
5. 問題なければBlue環境を更新

### カナリアリリース
```yaml
# Kubernetes での例
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: app-canary
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  progressDeadlineSeconds: 60
  service:
    port: 80
  analysis:
    interval: 1m
    threshold: 10
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
```

### ローリングアップデート
```bash
#!/bin/bash
# Rolling update script

INSTANCES=(server1 server2 server3 server4)
BATCH_SIZE=2

for (( i=0; i<${#INSTANCES[@]}; i+=BATCH_SIZE )); do
    batch=("${INSTANCES[@]:i:BATCH_SIZE}")
    
    echo "Updating batch: ${batch[*]}"
    
    for instance in "${batch[@]}"; do
        echo "Updating $instance..."
        ssh $instance "sudo systemctl stop app"
        rsync -avz ./dist/ $instance:/opt/app/
        ssh $instance "sudo systemctl start app"
        
        # ヘルスチェック
        sleep 10
        if ! curl -f http://$instance/health; then
            echo "Health check failed for $instance"
            exit 1
        fi
    done
    
    echo "Batch completed. Waiting before next batch..."
    sleep 30
done
```

## インフラストラクチャ設定
### Docker設定
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app

# セキュリティ: non-rootユーザーで実行
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "dist/server.js"]
```

### Kubernetes設定
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myregistry/myapp:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
---
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

### Terraform設定
```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name = "main-vpc"
  }
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "app-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb.id]
  subnets            = aws_subnet.public.*.id

  enable_deletion_protection = true

  tags = {
    Environment = "production"
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name                = "app-asg"
  vpc_zone_identifier = aws_subnet.private.*.id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  min_size            = 2
  max_size            = 10
  desired_capacity    = 3

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "app-instance"
    propagate_at_launch = true
  }
}
```

## 環境変数管理
### 設定例
```bash
# .env.example
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
API_KEY=your-api-key
```

### シークレット管理
```yaml
# AWS Secrets Manager
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database-url: <base64-encoded-value>
  jwt-secret: <base64-encoded-value>
  api-key: <base64-encoded-value>
```

## 監視とロギング
### 監視設定
```yaml
# Prometheus設定
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
```

### ログ設定
```javascript
// ログ設定
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { 
    service: 'app',
    environment: process.env.NODE_ENV 
  },
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### アラート設定
```yaml
# AlertManager設定
groups:
  - name: app-alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for 10 minutes"
      
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"
```

## バックアップとリカバリ
### バックアップ戦略
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# データベースバックアップ
pg_dump $DATABASE_URL > $BACKUP_DIR/database.sql

# アプリケーションファイルバックアップ
tar -czf $BACKUP_DIR/app_files.tar.gz /opt/app

# S3へアップロード
aws s3 sync $BACKUP_DIR s3://backup-bucket/$(date +%Y/%m/%d)/

# 古いバックアップの削除（30日以上）
find /backup -type d -mtime +30 -exec rm -rf {} \;
```

### リカバリ手順
1. **データベースリストア**
   ```bash
   psql $DATABASE_URL < backup/database.sql
   ```

2. **アプリケーションリストア**
   ```bash
   tar -xzf backup/app_files.tar.gz -C /
   ```

3. **設定ファイルリストア**
   ```bash
   kubectl apply -f backup/k8s-configs/
   ```

## ロールバック手順
### 自動ロールバック
```javascript
// health-check.js
const axios = require('axios');

async function checkHealth() {
  const checks = [
    { url: '/health', expected: 200 },
    { url: '/api/status', expected: 200 },
  ];
  
  for (const check of checks) {
    try {
      const response = await axios.get(`http://localhost:3000${check.url}`);
      if (response.status !== check.expected) {
        throw new Error(`Health check failed: ${check.url}`);
      }
    } catch (error) {
      console.error('Health check failed:', error.message);
      process.exit(1);
    }
  }
  
  console.log('All health checks passed');
  process.exit(0);
}

checkHealth();
```

### 手動ロールバック
```bash
#!/bin/bash
# rollback.sh

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: ./rollback.sh <version>"
  exit 1
fi

echo "Rolling back to version: $PREVIOUS_VERSION"

# Kubernetesの場合
kubectl rollout undo deployment/app-deployment

# Dockerの場合
docker-compose down
docker-compose pull app:$PREVIOUS_VERSION
docker-compose up -d

# ヘルスチェック
sleep 30
if curl -f http://localhost/health; then
  echo "Rollback successful"
else
  echo "Rollback failed!"
  exit 1
fi
```

## セキュリティ考慮事項
### デプロイ時のセキュリティ
1. **最小権限の原則**
   - デプロイユーザーには必要最小限の権限のみ付与
   - 本番環境へのアクセスは多要素認証必須

2. **シークレット管理**
   - 環境変数にシークレットを直接記載しない
   - HashiCorp Vault、AWS Secrets Manager等を使用

3. **イメージスキャン**
   - コンテナイメージの脆弱性スキャン実施
   - 脆弱性が見つかった場合はデプロイを中止

4. **通信の暗号化**
   - すべての通信をHTTPS/TLSで暗号化
   - 内部通信もmTLSを使用

### コンプライアンス
- [ ] GDPR準拠（EU圏の場合）
- [ ] SOC2準拠
- [ ] ISO 27001準拠
- [ ] PCI DSS準拠（決済処理の場合）

## デプロイメントチェックリスト
### 事前確認
- [ ] すべてのテストがパスしている
- [ ] コードレビューが完了している
- [ ] ドキュメントが更新されている
- [ ] 依存関係が最新である
- [ ] セキュリティスキャンが完了している

### デプロイ実施
- [ ] バックアップが取得されている
- [ ] メンテナンス告知が出されている（必要な場合）
- [ ] 監視ダッシュボードを開いている
- [ ] ロールバック手順が準備されている
- [ ] 関係者に通知している

### デプロイ後確認
- [ ] ヘルスチェックが正常
- [ ] 主要機能の動作確認完了
- [ ] パフォーマンスメトリクスが正常
- [ ] エラーレートが増加していない
- [ ] ユーザーからの問題報告がない

## トラブルシューティング
### よくある問題と対処法
| 問題 | 原因 | 対処法 |
|------|------|--------|
| デプロイが失敗する | 権限不足 | IAMロール/権限を確認 |
| アプリが起動しない | 環境変数の不足 | 必要な環境変数を確認 |
| ヘルスチェック失敗 | DB接続エラー | DB接続設定を確認 |
| パフォーマンス低下 | リソース不足 | スケーリング設定を調整 |

## 参考リンク
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS Best Practices](https://aws.amazon.com/architecture/well-architected/)
- [12 Factor App](https://12factor.net/)
- [SRE Book](https://sre.google/sre-book/table-of-contents/)