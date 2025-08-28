# Upstash Redis Setup for Rate Limiting

This document explains how to set up Upstash Redis for the Vetify platform's rate limiting and security features.

## Overview

Upstash Redis is used for:
- API rate limiting across all endpoints
- Security event tracking
- Session management
- Audit logging data storage

## Setup Instructions

### 1. Create Upstash Account

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up or log in with your account
3. Create a new Redis database

### 2. Configure Database Settings

- **Name**: `vetify-production-redis` (or appropriate name)
- **Region**: Choose the region closest to your Vercel deployment
- **Type**: Choose the appropriate plan based on your usage

### 3. Get Connection Details

After creating the database, you'll get:
- **REST URL**: `https://xxx.upstash.io`
- **REST Token**: `AxxxEDAQ...`

### 4. Environment Variables

Add these environment variables to your `.env.local` (development) and Vercel environment (production):

```bash
# Upstash Redis Configuration for Rate Limiting
UPSTASH_REDIS_REST_URL=https://your-db-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token-here
```

### 5. Vercel Deployment

Add the environment variables to your Vercel project:

```bash
# Using Vercel CLI
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN

# Or through Vercel Dashboard
# Go to Project Settings > Environment Variables
```

## Rate Limiting Configuration

The system implements different rate limits for different endpoint types:

### Rate Limit Tiers

| Endpoint Type | Requests | Time Window | Use Case |
|---------------|----------|-------------|----------|
| **Auth** | 5 | 15 minutes | Login attempts |
| **Sensitive** | 10 | 1 minute | Payment, medical data |
| **Public** | 20 | 1 minute | Public endpoints |
| **Admin** | 50 | 1 minute | Admin operations |
| **API** | 100 | 1 minute | General API calls |
| **Webhook** | 200 | 1 minute | External webhooks |

### Endpoint Classification

- **Auth endpoints**: `/api/auth/*`
- **Admin endpoints**: `/api/admin/*`
- **Webhook endpoints**: `/api/webhooks/*`
- **Public endpoints**: `/api/public/*`
- **Sensitive endpoints**: Medical records, payments, customer data
- **General API**: All other `/api/*` endpoints

## Security Features Enabled

### 1. Rate Limiting
- Automatic rate limiting on all API endpoints
- Different limits based on endpoint sensitivity
- User-based limiting for authenticated requests
- IP-based limiting for anonymous requests

### 2. Audit Logging
- All API access logged with timestamps
- Security events tracked (rate limit exceeded, failed auth, etc.)
- User actions audited for compliance
- Admin actions specially logged

### 3. Security Headers
- Comprehensive Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- XSS Protection
- Content Type Options
- Frame Options

## Monitoring and Alerts

### Rate Limit Monitoring

The system provides rate limit information in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

### Audit Logs

All security events are logged with the following information:
- Event type and timestamp
- User ID and tenant ID (if applicable)
- IP address and user agent
- Endpoint and HTTP method
- Risk level assessment
- Additional context

## Troubleshooting

### Rate Limiting Not Working

1. **Check Environment Variables**:
   ```bash
   # Verify variables are set
   echo $UPSTASH_REDIS_REST_URL
   echo $UPSTASH_REDIS_REST_TOKEN
   ```

2. **Check Redis Connection**:
   - Verify the URL and token are correct
   - Check if the Upstash database is active
   - Test connection from Upstash console

3. **Check Logs**:
   - Look for rate limiting errors in Vercel logs
   - Check for Redis connection errors

### High Rate Limit Usage

If you're hitting rate limits frequently:

1. **Review Rate Limits**: Adjust limits in `src/lib/security/rate-limiter.ts`
2. **Optimize Frontend**: Reduce unnecessary API calls
3. **Implement Caching**: Cache responses where appropriate
4. **Use Pagination**: Implement proper pagination for large datasets

### Cost Optimization

1. **Monitor Usage**: Check Upstash dashboard for usage metrics
2. **Cleanup Old Data**: Implement TTL for rate limit keys
3. **Optimize Queries**: Reduce unnecessary Redis operations

## Best Practices

### 1. Security
- Never expose Redis credentials in client-side code
- Use different Redis databases for development and production
- Regularly rotate Redis tokens
- Monitor for suspicious activity

### 2. Performance
- Use appropriate TTL values for keys
- Implement connection pooling if needed
- Monitor Redis memory usage
- Use Redis pipelines for bulk operations

### 3. Compliance
- Retain audit logs as required by regulations
- Implement data retention policies
- Ensure GDPR compliance for EU users
- Regular security audits

## Production Checklist

- [ ] Upstash Redis database created
- [ ] Environment variables configured in Vercel
- [ ] Rate limiting tested across all endpoint types
- [ ] Audit logging verified in production
- [ ] Security headers validated
- [ ] Monitoring and alerting configured
- [ ] Performance benchmarks established
- [ ] Documentation updated

## Related Documentation

- [Security Overview](./security-overview.md)
- [Audit Logging](./audit-logging.md)
- [Environment Setup](../getting-started/environment-setup.md)
- [Production Deployment](../deployment/vercel.md)
