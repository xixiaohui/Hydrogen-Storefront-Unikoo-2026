import {data} from 'react-router';
import {notifyQuoteCreated} from '~/lib/notifications';

/**
 * Receives Shopify Flow "Send HTTP request" action callbacks.
 *
 * Flow workflow in Shopify Admin:
 *   Trigger: "Draft Order created"
 *   Action:  "Send HTTP request" → POST https://your-domain.com/webhooks/flow
 *   Body:    { "draft_order": {{ draft_order }} }
 *
 * This endpoint re-broadcasts the event to Slack/Teams so the sales team
 * gets a structured notification with a direct link to the draft order.
 *
 * If SHOPIFY_WEBHOOK_SECRET is set, the request body is HMAC-SHA256 verified
 * against the X-Shopify-Hmac-Sha256 header before any work is done.
 */
export async function action({
  request,
  context,
}: {
  request: Request;
  context: {env: Record<string, unknown>};
}) {
  const body = await request.text();

  // Verify HMAC signature if a webhook secret is configured
  const secret = (context.env as Record<string, unknown>)
    ?.SHOPIFY_WEBHOOK_SECRET as string | undefined;
  const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256');

  if (secret) {
    if (!hmacHeader) {
      return data({error: 'Missing HMAC header'}, {status: 401});
    }
    const isValid = await verifyHmac(body, secret, hmacHeader);
    if (!isValid) {
      return data({error: 'Invalid HMAC signature'}, {status: 401});
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return data({error: 'Invalid JSON'}, {status: 400});
  }

  // Shopify Flow sends the draft order in various shapes depending on the
  // workflow configuration. Extract what we can.
  const draftOrder =
    (payload.draft_order as Record<string, unknown>) ??
    (payload.draftOrder as Record<string, unknown>) ??
    payload;

  const name = String(draftOrder?.name ?? draftOrder?.draft_order_name ?? '');
  const invoiceUrl = String(draftOrder?.invoice_url ?? '');
  const email = String(draftOrder?.email ?? '');
  const note = String(draftOrder?.note ?? '');
  const lineItemsCount = Array.isArray(draftOrder?.line_items)
    ? (draftOrder.line_items as unknown[]).length
    : 0;

  // Send notification to sales team
  const notified = await notifyQuoteCreated(context.env, {
    draftOrderName: name || 'Unknown draft order',
    invoiceUrl: invoiceUrl || 'https://admin.shopify.com',
    company: String(draftOrder?.company ?? '—'),
    contact: String(draftOrder?.contact_name ?? '—'),
    email,
    phone: String(draftOrder?.phone ?? ''),
    project: note,
    itemCount: lineItemsCount,
  });

  return data({
    received: true,
    draftOrderName: name,
    notified,
  });
}

/**
 * Verify an HMAC-SHA256 signature against a secret using Web Crypto.
 */
async function verifyHmac(
  body: string,
  secret: string,
  signature: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );

  const result = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const digest = Array.from(new Uint8Array(result))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison to prevent timing attacks
  const digestBuffer = encoder.encode(digest);
  const signatureBuffer = encoder.encode(signature);
  if (digestBuffer.length !== signatureBuffer.length) return false;

  let diff = 0;
  for (let i = 0; i < digestBuffer.length; i++) {
    diff |= digestBuffer[i] ^ signatureBuffer[i];
  }
  return diff === 0;
}
