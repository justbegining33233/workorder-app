/**
 * Structured logger that captures errors/warnings in Sentry and writes
 * structured JSON to stdout/stderr for production log aggregation.
 *
 * Usage:
 *   import logger from '@/lib/logger';
 *   logger.error('Payment failed', { workOrderId, amount });
 *   logger.warn('Slow query', { durationMs: 1200 });
 *   logger.info('Work order created', { id });
 */
import * as Sentry from '@sentry/nextjs';

type LogMeta = Record<string, unknown>;

function formatEntry(level: string, message: string, meta?: LogMeta) {
  return JSON.stringify({
    level,
    ts: new Date().toISOString(),
    msg: message,
    ...meta,
  });
}

const logger = {
  info(message: string, meta?: LogMeta) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatEntry('info', message, meta));
    }
    // Info-level breadcrumbs help debug Sentry error reports
    Sentry.addBreadcrumb({ category: 'app', message, level: 'info', data: meta });
  },

  warn(message: string, meta?: LogMeta) {
    console.warn(formatEntry('warn', message, meta));
    Sentry.addBreadcrumb({ category: 'app', message, level: 'warning', data: meta });
  },

  error(message: string, error?: unknown, meta?: LogMeta) {
    const extra = { ...meta };
    if (error instanceof Error) {
      extra.errorMessage = error.message;
      extra.stack = error.stack;
    } else if (error !== undefined) {
      extra.errorRaw = String(error);
    }
    console.error(formatEntry('error', message, extra));

    // Send to Sentry so it shows up in the Issues dashboard
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: { message, ...meta } });
    } else {
      Sentry.captureMessage(message, { level: 'error', extra });
    }
  },

  debug(message: string, meta?: LogMeta) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatEntry('debug', message, meta));
    }
  },
};

export default logger;
