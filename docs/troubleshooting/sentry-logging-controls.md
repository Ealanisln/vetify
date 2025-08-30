# Sentry Logging Controls

This document explains how to control Sentry logging levels to reduce console noise during development.

## Problem

By default, Sentry can be very verbose in development mode, logging:
- HTTP request/response details
- Session tracking information
- Instrumentation breadcrumbs
- Debug information

This creates console noise that makes it hard to see important application logs.

## Solution

We've implemented configurable Sentry logging controls that allow you to set different verbosity levels.

## Quick Commands

### Set Minimal Logging (Recommended for Development)
```bash
pnpm run sentry:quiet
```
- Only logs errors
- Minimal console noise
- Good for normal development

### Set Normal Logging
```bash
pnpm run sentry:normal
```
- Logs warnings and errors
- Moderate console output
- Good for debugging issues

### Set Verbose Logging
```bash
pnpm run sentry:verbose
```
- Logs info, warnings, and errors
- More detailed output
- Use when investigating specific issues

### Enable Debug Mode
```bash
pnpm run sentry:debug
```
- Logs everything including debug info
- Maximum verbosity
- Use only for troubleshooting Sentry issues

### Check Current Status
```bash
pnpm run sentry:status
```
- Shows current logging configuration
- Useful to verify changes

## Environment Variables

The script automatically manages these environment variables in your `.env.local` file:

```bash
# Log level: error, warn, info, debug
SENTRY_LOG_LEVEL=error

# Debug mode: true, false
SENTRY_DEBUG=false
```

## How It Works

1. **Log Level Control**: `SENTRY_LOG_LEVEL` determines what gets logged
   - `error`: Only errors (quietest)
   - `warn`: Warnings + errors
   - `info`: Info + warnings + errors
   - `debug`: All levels

2. **Debug Mode**: `SENTRY_DEBUG` enables/disables Sentry's internal debug logging
   - `false`: Minimal internal logging
   - `true`: Full internal logging (very verbose)

3. **HTTP Instrumentation**: Automatically configured to reduce noise
   - Breadcrumbs disabled
   - Request/response logging disabled
   - Tracing still enabled for performance monitoring

## Restart Required

⚠️ **Important**: After changing logging levels, you must restart your development server for changes to take effect.

```bash
# Stop current dev server (Ctrl+C)
# Then restart
pnpm dev
```

## Troubleshooting

### Still Seeing Verbose Logs?

1. **Check current status**:
   ```bash
   pnpm run sentry:status
   ```

2. **Verify environment variables**:
   ```bash
   cat .env.local | grep SENTRY
   ```

3. **Restart development server**:
   ```bash
   pnpm dev
   ```

### Need to Debug Sentry Issues?

1. **Enable debug mode temporarily**:
   ```bash
   pnpm run sentry:debug
   ```

2. **Investigate the issue**

3. **Return to quiet mode**:
   ```bash
   pnpm run sentry:quiet
   ```

### Backup and Restore

The script automatically creates backups of your `.env.local` file:
- `.env.local.backup` - Previous configuration
- You can restore manually if needed

## Default Configuration

By default, Sentry is configured for minimal noise:
- `SENTRY_LOG_LEVEL=error`
- `SENTRY_DEBUG=false`
- HTTP breadcrumbs disabled
- Session tracking disabled

## Production

In production, Sentry automatically uses appropriate logging levels:
- Minimal console output
- Full error tracking
- Performance monitoring enabled
- Security features active

## Best Practices

1. **Development**: Use `sentry:quiet` for normal development
2. **Debugging**: Use `sentry:normal` or `sentry:verbose` when investigating issues
3. **Sentry Issues**: Use `sentry:debug` only when troubleshooting Sentry itself
4. **Production**: No changes needed - optimized automatically

## Files Modified

The following Sentry configuration files have been updated:
- `sentry.client.config.ts` - Client-side configuration
- `sentry.server.config.ts` - Server-side configuration  
- `sentry.edge.config.ts` - Edge runtime configuration

All configurations now respect the `SENTRY_LOG_LEVEL` and `SENTRY_DEBUG` environment variables.

