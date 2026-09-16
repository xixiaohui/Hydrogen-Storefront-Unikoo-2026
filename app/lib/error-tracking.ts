/**
 * Lightweight error tracking with optional Sentry integration.
 *
 * - When SENTRY_DSN is configured, errors are reported to Sentry via the
 *   HTTP store endpoint (no SDK dependency needed, works in Oxygen workers).
 * - When no DSN is configured, errors are only logged via the structured
 *   logger (see lib/logger.ts).
 *
 * The DSN format is:
 *   https://<public_key>@<host>/<project_id>
 */

import {logger} from '~/lib/logger';

type SentryDsn = {
  publicKey: string;
  host: string;
  projectId: string;
};

function parseDsn(dsn: string): SentryDsn | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\/+/, '').split('/')[0];
    if (!publicKey || !projectId) return null;
    return {publicKey, host: url.host, projectId};
  } catch {
    return null;
  }
}

export function hasErrorTracking(env: Record<string, unknown>): boolean {
  const dsn = (env as Record<string, unknown>)?.SENTRY_DSN as
    | string
    | undefined;
  return Boolean(dsn);
}

/**
 * Report an error to the error tracking backend (Sentry if configured).
 * Safe to call from route actions/loaders, ErrorBoundary, and server.ts.
 * Never throws — failures fall back to the structured logger.
 */
export async function captureError(
  env: Record<string, unknown>,
  error: unknown,
  context?: {message?: string; extra?: Record<string, unknown>},
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));

  logger.error(context?.message ?? 'Unhandled error', context?.extra, err);

  const dsn = (env as Record<string, unknown>)?.SENTRY_DSN as
    | string
    | undefined;
  if (!dsn) return;

  const parsed = parseDsn(dsn);
  if (!parsed) return;

  const eventId = crypto.randomUUID();

  const payload = {
    event_id: eventId,
    timestamp: Math.floor(Date.now() / 1000),
    level: 'error',
    platform: 'javascript',
    message: context?.message ?? err.message,
    exception: {
      values: [
        {
          type: err.name,
          value: err.message,
          stacktrace: err.stack
            ? {frames: [{function: 'unknown', filename: 'hydrogen', lineno: 0}]}
            : undefined,
        },
      ],
    },
    ...(context?.extra ? {extra: context.extra} : {}),
  };

  const storeUrl = `https://${parsed.host}/api/${parsed.projectId}/store/`;

  try {
    await fetch(storeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': [
          'Sentry sentry_version=7',
          `sentry_key=${parsed.publicKey}`,
          'sentry_client=hydrogen-error-tracking/1.0',
        ].join(', '),
      },
      body: JSON.stringify(payload),
    });
  } catch (fetchError) {
    // Reporting failed — log locally and move on
    logger.warn('Failed to report error to Sentry', undefined, fetchError);
  }
}
