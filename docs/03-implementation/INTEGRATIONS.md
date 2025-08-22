# INTEGRATIONS.md - 統合・連携ガイド

## 1. 外部サービス統合

### 統合サービス一覧
| サービス名 | 用途 | 統合方式 | 認証方式 | 環境 |
|---|---|---|---|---|
| Stripe | 決済処理 | REST API | API Key | 本番/テスト |
| SendGrid | メール送信 | REST API | API Key | 本番/テスト |
| AWS S3 | ファイルストレージ | SDK | IAM Role | 本番/テスト |
| Slack | 通知 | Webhook | OAuth2 | 本番 |
| Google Analytics | 分析 | JavaScript SDK | Tracking ID | 本番 |

## 2. 決済システム統合

### Stripe統合
```typescript
// Stripe設定
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// 決済処理の実装
class PaymentService {
  async createPaymentIntent(amount: number, currency: string): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          integration_check: 'accept_a_payment',
        },
      });
      
      return paymentIntent;
    } catch (error) {
      logger.error('Stripe payment intent creation failed', error);
      throw new PaymentError('Failed to create payment intent');
    }
  }
  
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
  }
}
```

### Webhook設定
```typescript
// Webhook エンドポイント
app.post('/webhooks/stripe', 
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      await paymentService.handleWebhook(event);
      res.json({ received: true });
    } catch (err) {
      logger.error('Webhook signature verification failed', err);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);
```

## 3. メール送信統合

### SendGrid統合
```typescript
// SendGrid設定
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// メールサービス実装
class EmailService {
  private readonly FROM_EMAIL = 'noreply@example.com';
  
  async sendWelcomeEmail(user: User): Promise<void> {
    const msg = {
      to: user.email,
      from: this.FROM_EMAIL,
      templateId: 'd-f43daeeaef504760851f727007e0b5d0',
      dynamic_template_data: {
        user_name: user.name,
        verification_url: this.generateVerificationUrl(user.id),
      },
    };
    
    try {
      await sgMail.send(msg);
      logger.info('Welcome email sent', { userId: user.id });
    } catch (error) {
      logger.error('Failed to send welcome email', error);
      throw new EmailError('Failed to send email');
    }
  }
  
  async sendBulkEmail(recipients: string[], subject: string, content: string): Promise<void> {
    const messages = recipients.map(email => ({
      to: email,
      from: this.FROM_EMAIL,
      subject,
      html: content,
    }));
    
    // バッチ送信（最大1000件）
    const chunks = this.chunkArray(messages, 1000);
    
    for (const chunk of chunks) {
      await sgMail.send(chunk);
      await this.delay(1000); // レート制限対策
    }
  }
}
```

## 4. ストレージ統合

### AWS S3統合
```typescript
// S3設定
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ファイルストレージサービス
class StorageService {
  private readonly BUCKET_NAME = process.env.S3_BUCKET_NAME;
  
  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
      },
    });
    
    await s3Client.send(command);
    return `https://${this.BUCKET_NAME}.s3.amazonaws.com/${key}`;
  }
  
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: key,
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  }
}
```

## 5. 通知システム統合

### Slack統合
```typescript
// Slack Webhook設定
import { IncomingWebhook } from '@slack/webhook';

const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

// 通知サービス
class NotificationService {
  async sendSlackNotification(message: SlackMessage): Promise<void> {
    try {
      await webhook.send({
        text: message.text,
        blocks: message.blocks,
        attachments: message.attachments,
      });
    } catch (error) {
      logger.error('Failed to send Slack notification', error);
      // Slackへの通知失敗はサイレントに処理
    }
  }
  
  async notifyError(error: Error, context: any): Promise<void> {
    await this.sendSlackNotification({
      text: '⚠️ エラーが発生しました',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*エラー:* ${error.message}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*環境:* ${process.env.NODE_ENV}`,
            },
            {
              type: 'mrkdwn',
              text: `*時刻:* ${new Date().toISOString()}`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `\`\`\`${JSON.stringify(context, null, 2)}\`\`\``,
            },
          ],
        },
      ],
    });
  }
}
```

## 6. 認証プロバイダー統合

### OAuth2.0統合
```typescript
// Google OAuth設定
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// 認証サービス
class AuthService {
  async authenticateWithGoogle(code: string): Promise<User> {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);
    
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    // ユーザー情報の取得または作成
    let user = await this.userRepository.findByEmail(payload.email);
    
    if (!user) {
      user = await this.userRepository.create({
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        provider: 'google',
        providerId: payload.sub,
      });
    }
    
    return user;
  }
}
```

## 7. 分析ツール統合

### Google Analytics統合
```typescript
// GA4設定
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY,
  },
});

// 分析サービス
class AnalyticsService {
  private readonly GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
  
  async getActiveUsers(days: number = 7): Promise<number> {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${this.GA_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      metrics: [
        {
          name: 'activeUsers',
        },
      ],
    });
    
    return parseInt(response.rows[0].metricValues[0].value);
  }
  
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    // クライアント側のgtag実装
    // またはMeasurement Protocol APIを使用
  }
}
```

## 8. キューシステム統合

### Redis/Bull統合
```typescript
// Bull Queue設定
import Bull from 'bull';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
});

// キューサービス
class QueueService {
  private emailQueue: Bull.Queue;
  
  constructor() {
    this.emailQueue = new Bull('email', {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    });
    
    this.setupProcessors();
  }
  
  private setupProcessors(): void {
    this.emailQueue.process(async (job) => {
      const { type, data } = job.data;
      
      switch (type) {
        case 'welcome':
          await this.emailService.sendWelcomeEmail(data.user);
          break;
        case 'passwordReset':
          await this.emailService.sendPasswordResetEmail(data.user, data.token);
          break;
      }
    });
  }
  
  async queueEmail(type: string, data: any): Promise<void> {
    await this.emailQueue.add(
      { type, data },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
  }
}
```

## 9. モニタリング統合

### Datadog統合
```typescript
// Datadog設定
import { StatsD } from 'node-dogstatsd';

const dogstatsd = new StatsD({
  host: process.env.DATADOG_HOST,
  port: 8125,
  prefix: 'app.',
});

// メトリクスサービス
class MetricsService {
  recordApiCall(endpoint: string, duration: number, status: number): void {
    dogstatsd.histogram('api.response_time', duration, [`endpoint:${endpoint}`]);
    dogstatsd.increment('api.requests', 1, [
      `endpoint:${endpoint}`,
      `status:${status}`,
    ]);
  }
  
  recordError(error: Error, context: string): void {
    dogstatsd.increment('errors', 1, [
      `type:${error.constructor.name}`,
      `context:${context}`,
    ]);
  }
  
  recordBusinessMetric(metric: string, value: number, tags?: string[]): void {
    dogstatsd.gauge(`business.${metric}`, value, tags);
  }
}
```

## 10. 統合テスト

### 統合テスト戦略
```typescript
// モックサービス
class MockPaymentService implements IPaymentService {
  async createPaymentIntent(amount: number): Promise<PaymentIntent> {
    return {
      id: 'pi_test_123',
      amount,
      status: 'succeeded',
    };
  }
}

// 統合テスト
describe('Payment Integration', () => {
  let app: Application;
  
  beforeAll(async () => {
    // テスト環境でモックサービスを注入
    container.register('PaymentService', {
      useClass: process.env.NODE_ENV === 'test' 
        ? MockPaymentService 
        : PaymentService,
    });
    
    app = await createApp();
  });
  
  it('should process payment successfully', async () => {
    const response = await request(app)
      .post('/payments')
      .send({
        amount: 1000,
        currency: 'usd',
      })
      .expect(200);
    
    expect(response.body).toHaveProperty('paymentIntentId');
  });
});
```

## 11. エラーハンドリングと再試行

### 再試行ロジック
```typescript
// 指数バックオフによる再試行
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// 使用例
const result = await retryWithBackoff(
  () => stripe.paymentIntents.create(params),
  3,
  1000
);
```