# Sentry Setup Guide for Vetify

## Fixed Issues

✅ **Transport Errors**: Fixed "Failed to fetch" errors by implementing conditional Sentry initialization
✅ **Missing Release**: Added fallback release configuration for development
✅ **DSN Configuration**: Standardized DSN variable names across all configurations  
✅ **Error Handling**: Added graceful handling when Sentry is not configured

## Quick Setup

### 1. Create Environment File

Create a `.env.local` file in your project root with the following content:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-actual-dsn@o000000.ingest.sentry.io/0000000
SENTRY_DSN=https://your-actual-dsn@o000000.ingest.sentry.io/0000000

# Optional: Custom release and environment
SENTRY_RELEASE=vetify-dev-local
SENTRY_ENVIRONMENT=development
```

### 2. Get Your Sentry DSN

1. Go to [sentry.io](https://sentry.io) and create an account or log in
2. Create a new project or select an existing one
3. Choose "Next.js" as your platform
4. Copy the DSN from the project settings
5. Replace the placeholder DSN in your `.env.local` file

### 3. Restart Development Server

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

### 4. Test the Integration

1. Visit `http://localhost:3000/sentry-example-page`
2. You should see "Sentry Status: Initialized ✅" at the top
3. Click any of the error test buttons
4. Check your Sentry dashboard for captured errors

## Configuration Details

### Files Modified

- `sentry.client.config.ts` - Client-side Sentry configuration
- `sentry.server.config.ts` - Server-side Sentry configuration  
- `sentry.edge.config.ts` - Edge runtime Sentry configuration
- `src/app/sentry-example-page/page.tsx` - Enhanced test page with status indicators

### Key Improvements

1. **Conditional Initialization**: Sentry only initializes when a valid DSN is provided
2. **Consistent Variable Names**: All configs use `NEXT_PUBLIC_SENTRY_DSN` as primary DSN source
3. **Fallback Release**: Uses `vetify-dev-local` when no git commit SHA is available
4. **Better Error Messages**: Clear console warnings when Sentry is not configured
5. **UI Status Indicator**: Visual feedback on the test page showing Sentry status

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Yes | Your Sentry project DSN (client-side) |
| `SENTRY_DSN` | No | Fallback DSN for server/edge configs |
| `SENTRY_RELEASE` | No | Custom release identifier |
| `SENTRY_ENVIRONMENT` | No | Custom environment name |

## Troubleshooting

### Still seeing "Failed to fetch" errors?

1. Verify your DSN is correct and valid
2. Check that `.env.local` exists and has the correct format
3. Restart your development server
4. Check the browser console for detailed error messages

### Sentry not capturing errors?

1. Visit the test page: `/sentry-example-page`
2. Check if the status shows "Initialized ✅"
3. Use the "Debug Sentry Configuration" button for detailed diagnostics
4. Verify your Sentry project is active and not rate-limited

### Development vs Production

- **Development**: High sampling rates (100%) for thorough testing
- **Production**: Lower sampling rates (10%) for performance
- **Debug Mode**: Enabled in development for detailed logging

## Security Notes

- The DSN is safe to expose in client-side code (it's designed for that)
- `NEXT_PUBLIC_` prefixed variables are bundled into the client
- Never commit your `.env.local` file to version control (already in `.gitignore`)
