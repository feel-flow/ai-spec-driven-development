# DEPLOYMENT.md - デプロイメント・運用ガイド

## 1. デプロイメント戦略

### 環境構成
| 環境 | 用途 | URL | インフラ |
|---|---|---|---|
| Development | 開発環境 | https://dev.example.com | AWS ECS (1 instance) |
| Staging | ステージング環境 | https://staging.example.com | AWS ECS (2 instances) |
| Production | 本番環境 | https://app.example.com | AWS ECS (4+ instances) |

### デプロイメント方式
- **Blue-Green Deployment**: 本番環境
- **Rolling Update**: ステージング環境
- **Direct Deployment**: 開発環境

## 2. CI/CDパイプライン

### GitHub Actions設定
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches:
      - main
      - develop
  release:
    types: [published]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: dist/

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-artifacts
          path: dist/
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: app-staging
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster staging-cluster \
            --service app-service \
            --force-new-deployment

  deploy-production:
    needs: test
    if: github.event_name == 'release'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          # Blue-Green deployment script
          ./scripts/deploy-production.sh ${{ github.event.release.tag_name }}
```

### Dockerfile
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build
COPY . .
RUN npm run build

# Runtime
FROM node:18-alpine

WORKDIR /app

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "dist/index.js"]
```

## 3. インフラストラクチャ as Code

### Terraform設定
```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  
  backend "s3" {
    bucket = "terraform-state-bucket"
    key    = "production/terraform.tfstate"
    region = "ap-northeast-1"
  }
}

# VPC
module "vpc" {
  source = "./modules/vpc"
  
  cidr_block = "10.0.0.0/16"
  availability_zones = ["ap-northeast-1a", "ap-northeast-1c"]
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Service
resource "aws_ecs_service" "app" {
  name            = "app-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.app_count
  launch_type     = "FARGATE"
  
  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }
  
  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = module.vpc.private_subnet_ids
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = aws_alb_target_group.app.id
    container_name   = "app"
    container_port   = 3000
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

## 4. デプロイメントスクリプト

### Blue-Greenデプロイメント
```bash
#!/bin/bash
# scripts/deploy-production.sh

set -e

VERSION=$1
CLUSTER="production-cluster"
SERVICE="app-service"
TASK_DEFINITION="app-production"

echo "Starting Blue-Green deployment for version ${VERSION}"

# 1. 新しいタスク定義を登録
aws ecs register-task-definition \
  --family ${TASK_DEFINITION} \
  --cli-input-json file://task-definition.json

# 2. 新しいターゲットグループを作成
NEW_TARGET_GROUP=$(aws elbv2 create-target-group \
  --name "app-tg-${VERSION}" \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --health-check-path /health \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# 3. 新しいサービスをGreenとしてデプロイ
aws ecs create-service \
  --cluster ${CLUSTER} \
  --service-name "app-green-${VERSION}" \
  --task-definition ${TASK_DEFINITION} \
  --desired-count 4 \
  --target-group-arn ${NEW_TARGET_GROUP}

# 4. ヘルスチェック待機
echo "Waiting for health checks..."
sleep 60

# 5. トラフィックを切り替え
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:xxx \
  --default-actions Type=forward,TargetGroupArn=${NEW_TARGET_GROUP}

# 6. 旧バージョンを削除
echo "Cleaning up old version..."
aws ecs update-service \
  --cluster ${CLUSTER} \
  --service app-blue \
  --desired-count 0

echo "Deployment completed successfully"
```

## 5. 環境設定管理

### 環境変数管理
```typescript
// config/index.ts
interface Config {
  app: {
    port: number;
    env: string;
    name: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  redis: {
    host: string;
    port: number;
  };
  aws: {
    region: string;
    s3Bucket: string;
  };
}

const config: Config = {
  app: {
    port: parseInt(process.env.PORT || '3000'),
    env: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'MyApp'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'myapp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  aws: {
    region: process.env.AWS_REGION || 'ap-northeast-1',
    s3Bucket: process.env.S3_BUCKET || ''
  }
};

// 環境別検証
function validateConfig(): void {
  if (config.app.env === 'production') {
    if (!config.database.password) {
      throw new Error('Database password is required in production');
    }
    if (!config.aws.s3Bucket) {
      throw new Error('S3 bucket is required in production');
    }
  }
}

export { config, validateConfig };
```

### Secrets管理
```yaml
# AWS Secrets Manager
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database-password: <base64-encoded>
  jwt-secret: <base64-encoded>
  api-keys: <base64-encoded>
```

## 6. ロールバック戦略

### 自動ロールバック
```typescript
// rollback.ts
class RollbackManager {
  async checkDeploymentHealth(deploymentId: string): Promise<boolean> {
    const metrics = await this.getMetrics(deploymentId);
    
    // エラー率チェック
    if (metrics.errorRate > 0.05) { // 5%以上
      logger.error('High error rate detected', { errorRate: metrics.errorRate });
      return false;
    }
    
    // レスポンスタイムチェック
    if (metrics.p99ResponseTime > 1000) { // 1秒以上
      logger.error('High response time detected', { p99: metrics.p99ResponseTime });
      return false;
    }
    
    // メモリ使用率チェック
    if (metrics.memoryUsage > 0.9) { // 90%以上
      logger.error('High memory usage detected', { usage: metrics.memoryUsage });
      return false;
    }
    
    return true;
  }
  
  async performRollback(deploymentId: string): Promise<void> {
    logger.info('Starting rollback', { deploymentId });
    
    // 1. 前バージョンのタスク定義を取得
    const previousVersion = await this.getPreviousVersion();
    
    // 2. サービスを前バージョンに更新
    await this.ecs.updateService({
      cluster: 'production-cluster',
      service: 'app-service',
      taskDefinition: previousVersion
    });
    
    // 3. 通知
    await this.notificationService.send({
      channel: 'deployments',
      message: `Rollback initiated for deployment ${deploymentId}`
    });
  }
}
```

## 7. モニタリング設定

### CloudWatch Alarms
```typescript
// monitoring/alarms.ts
const alarms = [
  {
    name: 'HighCPUUtilization',
    metric: 'CPUUtilization',
    threshold: 80,
    evaluationPeriods: 2,
    action: 'scale-up'
  },
  {
    name: 'HighErrorRate',
    metric: 'HTTPCode_Target_5XX_Count',
    threshold: 10,
    evaluationPeriods: 1,
    action: 'alert'
  },
  {
    name: 'LowHealthyHosts',
    metric: 'HealthyHostCount',
    threshold: 1,
    comparisonOperator: 'LessThanThreshold',
    action: 'critical-alert'
  }
];
```

## 8. デプロイメントチェックリスト

### Pre-Deployment
- [ ] すべてのテストが成功している
- [ ] コードレビューが完了している
- [ ] セキュリティスキャンが完了している
- [ ] データベースマイグレーションの準備ができている
- [ ] ロールバック計画が準備されている
- [ ] 関係者への通知が完了している

### During Deployment
- [ ] デプロイメントログを監視
- [ ] エラー率を監視
- [ ] レスポンスタイムを監視
- [ ] リソース使用率を監視

### Post-Deployment
- [ ] スモークテストの実行
- [ ] 主要機能の動作確認
- [ ] パフォーマンスメトリクスの確認
- [ ] エラーログの確認
- [ ] ユーザーフィードバックの監視
- [ ] デプロイメント記録の更新

## 9. 災害復旧

### バックアップ戦略
```yaml
# backup-policy.yml
backup_policy:
  database:
    frequency: daily
    retention: 30_days
    point_in_time_recovery: enabled
    
  application_data:
    frequency: hourly
    retention: 7_days
    
  configurations:
    frequency: on_change
    retention: 90_days
```

### 復旧手順
```bash
#!/bin/bash
# disaster-recovery.sh

# 1. 最新のバックアップを特定
LATEST_BACKUP=$(aws rds describe-db-snapshots \
  --query 'DBSnapshots[0].DBSnapshotIdentifier' \
  --output text)

# 2. バックアップから復元
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "restored-db" \
  --db-snapshot-identifier ${LATEST_BACKUP}

# 3. アプリケーションを再デプロイ
./scripts/deploy-production.sh disaster-recovery

# 4. DNSを切り替え
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://dns-failover.json
```

## 10. 運用手順書

### 定期メンテナンス
| タスク | 頻度 | 手順 | 担当 |
|---|---|---|---|
| セキュリティパッチ | 月次 | patch-update.sh | DevOps |
| 証明書更新 | 3ヶ月 | cert-renewal.sh | DevOps |
| ログローテーション | 週次 | 自動 | - |
| バックアップ検証 | 月次 | backup-verify.sh | DevOps |

### トラブルシューティング
```bash
# 一般的な問題の対処

# 1. サービスが起動しない
aws ecs describe-tasks --cluster production --tasks <task-arn>
aws logs get-log-events --log-group-name /ecs/app

# 2. メモリリーク
aws ecs update-service --cluster production --service app --force-new-deployment

# 3. データベース接続エラー
aws rds describe-db-instances --db-instance-identifier production-db
telnet <db-host> 5432
```