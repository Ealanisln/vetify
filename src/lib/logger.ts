/**
 * Lightweight structured logger.
 *
 * Emits single-line JSON so Vercel / log aggregators can index by `scope`,
 * `level`, and any contextual fields (e.g. a Stripe `eventId`). Falls back to
 * a readable string in development for easier local reading.
 *
 * This is intentionally dependency-free: Sentry already captures errors
 * elsewhere; this is for the operational breadcrumb trail, not alerting.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

// In production we drop debug noise; everywhere else we keep it.
const MIN_LEVEL: number =
  process.env.LOG_LEVEL && process.env.LOG_LEVEL in LEVEL_WEIGHT
    ? LEVEL_WEIGHT[process.env.LOG_LEVEL as LogLevel]
    : process.env.NODE_ENV === 'production'
      ? LEVEL_WEIGHT.info
      : LEVEL_WEIGHT.debug;

type LogContext = Record<string, unknown>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  /** Returns a new logger that merges `base` context into every line. */
  child(base: LogContext): Logger;
}

function emit(
  scope: string,
  level: LogLevel,
  baseContext: LogContext,
  message: string,
  context?: LogContext
): void {
  if (LEVEL_WEIGHT[level] < MIN_LEVEL) return;

  const payload = {
    level,
    scope,
    msg: message,
    ...baseContext,
    ...context,
  };

  const line =
    process.env.NODE_ENV === 'production'
      ? JSON.stringify(payload)
      : `[${scope}] ${level.toUpperCase()} ${message}` +
        (Object.keys({ ...baseContext, ...context }).length
          ? ` ${JSON.stringify({ ...baseContext, ...context })}`
          : '');

  // Route warn/error to stderr so they surface separately in most platforms.
  if (level === 'error' || level === 'warn') {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function createLogger(scope: string, baseContext: LogContext = {}): Logger {
  return {
    debug: (message, context) => emit(scope, 'debug', baseContext, message, context),
    info: (message, context) => emit(scope, 'info', baseContext, message, context),
    warn: (message, context) => emit(scope, 'warn', baseContext, message, context),
    error: (message, context) => emit(scope, 'error', baseContext, message, context),
    child: (base) => createLogger(scope, { ...baseContext, ...base }),
  };
}
