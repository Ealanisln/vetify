# 🔗 [Integration Name]

> **Brief description of the integration and its purpose in the Vetify ecosystem.**

## 📋 Overview

Provide a high-level overview of the integration, what it does, and how it benefits the Vetify system.

## 🔧 Prerequisites

List all requirements and dependencies needed before setting up the integration:

- **API Keys**: Required API credentials
- **Accounts**: External service accounts
- **Permissions**: Required permissions and scopes
- **Dependencies**: Software or library dependencies

## 🚀 Setup Guide

### Step 1: Environment Configuration

```bash
# Add required environment variables
NEXT_PUBLIC_INTEGRATION_API_KEY=your_api_key_here
INTEGRATION_SECRET_KEY=your_secret_key_here
INTEGRATION_WEBHOOK_URL=https://your-domain.com/api/webhooks/integration
```

### Step 2: Install Dependencies

```bash
# Install required packages
pnpm add integration-package
pnpm add -D @types/integration-package
```

### Step 3: Configuration

```typescript
// lib/integration.ts
import { IntegrationClient } from 'integration-package';

export const integrationClient = new IntegrationClient({
  apiKey: process.env.INTEGRATION_API_KEY!,
  secretKey: process.env.INTEGRATION_SECRET_KEY!,
  webhookUrl: process.env.INTEGRATION_WEBHOOK_URL!,
});
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `INTEGRATION_API_KEY` | API key for the service | Yes | `sk_live_...` |
| `INTEGRATION_SECRET_KEY` | Secret key for webhooks | Yes | `whsec_...` |
| `INTEGRATION_WEBHOOK_URL` | Webhook endpoint URL | Yes | `https://...` |

### Configuration Options

```typescript
interface IntegrationConfig {
  apiKey: string;
  secretKey: string;
  webhookUrl: string;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

const defaultConfig: IntegrationConfig = {
  timeout: 30000,
  retries: 3,
  debug: process.env.NODE_ENV === 'development',
};
```

## 📚 API Reference

### Authentication

```typescript
// Example authentication
const headers = {
  'Authorization': `Bearer ${process.env.INTEGRATION_API_KEY}`,
  'Content-Type': 'application/json',
};
```

### Core Methods

#### `sendMessage(data: MessageData): Promise<MessageResponse>`

Sends a message through the integration.

```typescript
interface MessageData {
  to: string;
  content: string;
  type: 'text' | 'media' | 'template';
  metadata?: Record<string, any>;
}

interface MessageResponse {
  id: string;
  status: 'sent' | 'delivered' | 'failed';
  timestamp: Date;
}
```

#### `getStatus(messageId: string): Promise<StatusResponse>`

Retrieves the status of a sent message.

```typescript
interface StatusResponse {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  error?: string;
}
```

### Webhook Handling

```typescript
// app/api/webhooks/integration/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@/lib/integration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-integration-signature');
    
    // Verify webhook signature
    const isValid = verifyWebhook(body, signature!);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const data = JSON.parse(body);
    
    // Handle webhook event
    await handleWebhookEvent(data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

## 💡 Examples

### Basic Usage

```typescript
// Example: Send a notification
import { integrationClient } from '@/lib/integration';

export async function sendNotification(userId: string, message: string) {
  try {
    const response = await integrationClient.sendMessage({
      to: userId,
      content: message,
      type: 'text',
    });
    
    console.log('Message sent:', response.id);
    return response;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}
```

### Advanced Usage

```typescript
// Example: Batch processing
export async function sendBatchNotifications(users: User[], message: string) {
  const promises = users.map(user => 
    integrationClient.sendMessage({
      to: user.id,
      content: message,
      type: 'text',
      metadata: {
        userId: user.id,
        clinicId: user.clinicId,
      },
    })
  );
  
  const results = await Promise.allSettled(promises);
  
  return {
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results,
  };
}
```

### Error Handling

```typescript
// Example: Robust error handling
export async function sendMessageWithRetry(data: MessageData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await integrationClient.sendMessage(data);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Authentication failed | Invalid API key | Verify API key in environment variables |
| Webhook not receiving | Invalid signature | Check webhook secret configuration |
| Rate limiting | Too many requests | Implement rate limiting and retry logic |
| Timeout errors | Network issues | Increase timeout configuration |

### Debug Mode

```typescript
// Enable debug mode for detailed logging
const debugClient = new IntegrationClient({
  ...config,
  debug: true,
});

// Debug logs will show:
// - Request/response details
// - Authentication headers
// - Webhook verification
// - Error stack traces
```

### Logging

```typescript
// Example logging configuration
import { createLogger } from '@/lib/logger';

const logger = createLogger('integration');

logger.info('Sending message', { userId, messageType });
logger.error('Integration error', { error: error.message, stack: error.stack });
```

## 🔒 Security Considerations

### API Key Management

- Store API keys in environment variables
- Never commit keys to version control
- Rotate keys regularly
- Use least privilege principle

### Webhook Security

```typescript
// Verify webhook signatures
export function verifyWebhook(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.INTEGRATION_SECRET_KEY!)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Rate Limiting

```typescript
// Implement rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});
```

## 📊 Monitoring

### Health Checks

```typescript
// Example health check endpoint
export async function GET() {
  try {
    const status = await integrationClient.getStatus();
    return NextResponse.json({ 
      status: 'healthy', 
      integration: status 
    });
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy', 
      error: error.message 
    }, { status: 503 });
  }
}
```

### Metrics

Track important metrics:

- Message delivery rates
- Response times
- Error rates
- API usage quotas

## 🔗 Related Documentation

- [Architecture Overview](../architecture/system-overview.md)
- [Security Architecture](../architecture/security.md)
- [Webhook Configuration](../integrations/webhooks.md)
- [Troubleshooting Guide](../troubleshooting/common-issues.md)

## 📝 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial integration |
| 1.1.0 | 2024-02-01 | Added webhook support |
| 1.2.0 | 2024-03-01 | Enhanced error handling |

---

**Need help?** Check our [Troubleshooting Guide](../troubleshooting/common-issues.md) or [contact support](../../README.md#-support). 