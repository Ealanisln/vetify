# 🛠️ Common Issues

> **Solutions to frequently encountered problems in the Vetify platform.**

## Authentication Issues

### Login Problems

**Problem**: Users cannot log in to the application.

**Possible Causes**:
- Incorrect OAuth configuration
- Expired or invalid tokens
- Database connection issues
- Environment variables not set

**Solutions**:

1. **Check OAuth Configuration**
   ```bash
   # Verify environment variables
   echo $KINDE_CLIENT_ID
   echo $KINDE_CLIENT_SECRET
   echo $KINDE_ISSUER_URL
   ```

2. **Verify Database Connection**
   ```bash
   # Test database connection
   pnpm prisma db push
   ```

3. **Check Application Logs**
   ```bash
   # View application logs
   pnpm dev
   # Check browser console for errors
   ```

### Session Expiration

**Problem**: Users are logged out unexpectedly.

**Solutions**:
- Increase session timeout in Kinde configuration
- Implement refresh token logic
- Check for token validation errors

## Database Issues

### Connection Errors

**Problem**: Cannot connect to PostgreSQL database.

**Solutions**:

1. **Verify Connection String**
   ```bash
   # Check DATABASE_URL format
   echo $DATABASE_URL
   # Should be: postgresql://user:password@host:port/database
   ```

2. **Test Connection**
   ```bash
   # Test with psql
   psql $DATABASE_URL
   ```

3. **Check Neon Dashboard**
   - Verify database is active
   - Check connection limits
   - Review recent activity

### Migration Failures

**Problem**: Database migrations fail to apply.

**Solutions**:

1. **Reset Database (Development Only)**
   ```bash
   # Reset database
   pnpm prisma migrate reset
   ```

2. **Check Migration Status**
   ```bash
   # View migration history
   pnpm prisma migrate status
   ```

3. **Fix Migration Conflicts**
   ```bash
   # Resolve conflicts manually
   pnpm prisma migrate resolve --applied migration_name
   ```

## API Issues

### 500 Internal Server Error

**Problem**: API endpoints return 500 errors.

**Solutions**:

1. **Check Server Logs**
   ```bash
   # View detailed error logs
   pnpm dev
   # Check terminal output for stack traces
   ```

2. **Verify Environment Variables**
   ```bash
   # Check all required variables
   cat .env.local
   ```

3. **Test API Endpoints**
   ```bash
   # Test with curl
   curl -X GET http://localhost:3000/api/health
   ```

### CORS Errors

**Problem**: Cross-origin requests are blocked.

**Solutions**:

1. **Update CORS Configuration**
   ```typescript
   // next.config.js
   const nextConfig = {
     async headers() {
       return [
         {
           source: '/api/:path*',
           headers: [
             { key: 'Access-Control-Allow-Origin', value: '*' },
             { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
           ],
         },
       ];
     },
   };
   ```

2. **Check Origin Configuration**
   - Verify allowed origins in environment variables
   - Update CORS settings for production domains

## Frontend Issues

### Build Failures

**Problem**: Application fails to build.

**Solutions**:

1. **Clear Cache**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   pnpm build
   ```

2. **Check Dependencies**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules
   pnpm install
   ```

3. **TypeScript Errors**
   ```bash
   # Check TypeScript compilation
   pnpm tsc --noEmit
   ```

### Component Rendering Issues

**Problem**: Components don't render correctly.

**Solutions**:

1. **Check Console Errors**
   - Open browser developer tools
   - Look for JavaScript errors
   - Check React component warnings

2. **Verify Props**
   ```typescript
   // Add prop validation
   interface ComponentProps {
     required: string;
     optional?: number;
   }
   ```

3. **Check State Management**
   - Verify context providers are wrapping components
   - Check for state initialization issues

## Payment Issues

### Stripe Integration Problems

**Problem**: Payments are not processing correctly.

**Solutions**:

1. **Verify Stripe Configuration**
   ```bash
   # Check Stripe keys
   echo $STRIPE_SECRET_KEY
   echo $STRIPE_PUBLISHABLE_KEY
   ```

2. **Test Webhook Endpoints**
   ```bash
   # Use Stripe CLI to test webhooks
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Check Payment Intent Status**
   ```typescript
   // Verify payment status
   const paymentIntent = await stripe.paymentIntents.retrieve(pi_xxx);
   console.log(paymentIntent.status);
   ```

### Subscription Issues

**Problem**: Subscriptions are not working properly.

**Solutions**:

1. **Check Customer Creation**
   ```typescript
   // Verify customer exists
   const customer = await stripe.customers.retrieve(cus_xxx);
   ```

2. **Verify Subscription Status**
   ```typescript
   // Check subscription details
   const subscription = await stripe.subscriptions.retrieve(sub_xxx);
   console.log(subscription.status);
   ```

## WhatsApp Integration Issues

### Message Delivery Problems

**Problem**: WhatsApp messages are not being sent.

**Solutions**:

1. **Check WhatsApp API Status**
   ```bash
   # Verify API credentials
   echo $WHATSAPP_API_TOKEN
   echo $WHATSAPP_PHONE_NUMBER_ID
   ```

2. **Test Message Sending**
   ```typescript
   // Test with simple message
   const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${accessToken}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       messaging_product: 'whatsapp',
       to: phoneNumber,
       type: 'text',
       text: { body: 'Test message' },
     }),
   });
   ```

3. **Check Webhook Configuration**
   - Verify webhook URL is accessible
   - Check webhook signature validation
   - Monitor webhook delivery logs

## Performance Issues

### Slow Page Loads

**Problem**: Pages take too long to load.

**Solutions**:

1. **Optimize Images**
   ```typescript
   // Use Next.js Image component
   import Image from 'next/image';
   
   <Image
     src="/image.jpg"
     alt="Description"
     width={500}
     height={300}
     priority={true}
   />
   ```

2. **Implement Code Splitting**
   ```typescript
   // Lazy load components
   const LazyComponent = dynamic(() => import('./Component'), {
     loading: () => <p>Loading...</p>,
   });
   ```

3. **Optimize Database Queries**
   ```typescript
   // Use Prisma select to limit fields
   const users = await prisma.user.findMany({
     select: {
       id: true,
       name: true,
       email: true,
     },
   });
   ```

### Memory Leaks

**Problem**: Application memory usage increases over time.

**Solutions**:

1. **Check for Event Listeners**
   ```typescript
   // Clean up event listeners
   useEffect(() => {
     const handleResize = () => {};
     window.addEventListener('resize', handleResize);
     
     return () => {
       window.removeEventListener('resize', handleResize);
     };
   }, []);
   ```

2. **Monitor Bundle Size**
   ```bash
   # Analyze bundle size
   pnpm build
   # Check .next/analyze for bundle analysis
   ```

## Deployment Issues

### Vercel Deployment Failures

**Problem**: Application fails to deploy on Vercel.

**Solutions**:

1. **Check Build Logs**
   - Review Vercel deployment logs
   - Look for build errors
   - Check environment variables

2. **Verify Environment Variables**
   ```bash
   # Set environment variables in Vercel
   vercel env add DATABASE_URL
   vercel env add KINDE_CLIENT_ID
   ```

3. **Check Function Size Limits**
   - Ensure API routes are under size limits
   - Optimize bundle size
   - Use edge functions for large operations

### Database Migration in Production

**Problem**: Database migrations fail in production.

**Solutions**:

1. **Backup Database**
   ```bash
   # Create backup before migration
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Test Migrations**
   ```bash
   # Test on staging first
   pnpm prisma migrate deploy --preview-feature
   ```

3. **Rollback Plan**
   ```bash
   # Have rollback strategy ready
   pnpm prisma migrate reset
   ```

## Monitoring and Debugging

### Error Tracking

**Problem**: Need to track and debug errors in production.

**Solutions**:

1. **Implement Error Boundaries**
   ```typescript
   class ErrorBoundary extends React.Component {
     componentDidCatch(error, errorInfo) {
       console.error('Error caught by boundary:', error, errorInfo);
       // Send to error tracking service
     }
   }
   ```

2. **Add Logging**
   ```typescript
   // Use structured logging
   console.log('User action', {
     userId: user.id,
     action: 'create_pet',
     timestamp: new Date().toISOString(),
   });
   ```

3. **Monitor Performance**
   ```typescript
   // Track performance metrics
   const startTime = performance.now();
   // ... operation
   const endTime = performance.now();
   console.log(`Operation took ${endTime - startTime}ms`);
   ```

## Getting Help

### Before Asking for Help

1. **Check Documentation**
   - Review relevant documentation sections
   - Search for similar issues
   - Check GitHub issues

2. **Gather Information**
   - Error messages and stack traces
   - Environment details
   - Steps to reproduce
   - Expected vs actual behavior

3. **Try Common Solutions**
   - Clear cache and restart
   - Check environment variables
   - Verify dependencies
   - Test in different browsers

### Contact Support

- **GitHub Issues**: Create detailed issue reports
- **Documentation**: Check troubleshooting guides
- **Community**: Ask in developer forums
- **Email**: support@vetify.app

---

**Still having issues?** Check our [Debug Guides](debug-guides.md) or [contact support](../../README.md#-support). 