/**
 * Structured JSON logger.
 *
 * Emits one JSON line per log entry with level, timestamp, message and
 * optional context.  Oxygen collects stdout/stderr, so these lines show up
 * in Shopify Admin → Logs and can be shipped to any log aggregator.
 */
/* eslint-disable no-console -- this module is the single console wrapper */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

function emit(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown,
) {
  const entry: Record<string, unknown> = {
    level,
    timestamp: new Date().toISOString(),
    message,
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  if (error) {
    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else {
      entry.error = error;
    }
  }

  const line = JSON.stringify(entry);

  switch (level) {
    case 'debug':
      console.debug(line);
      break;
    case 'info':
      console.info(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'error':
      console.error(line);
      break;
  }
}

export const logger = {
  debug(message: string, context?: LogContext) {
    emit('debug', message, context);
  },
  info(message: string, context?: LogContext) {
    emit('info', message, context);
  },
  warn(message: string, context?: LogContext, error?: unknown) {
    emit('warn', message, context, error);
  },
  error(message: string, context?: LogContext, error?: unknown) {
    emit('error', message, context, error);
  },
};
/* eslint-enable no-console */
