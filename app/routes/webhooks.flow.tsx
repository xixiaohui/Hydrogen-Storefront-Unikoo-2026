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
 */
export async function action({
  request,
  context,
}: {
  request: Request;
  context: {env: Record<string, unknown>};
}) {
  const body = await request.text();

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

  // Verify webhook signature (optional but recommended)
  const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256');
  if (hmacHeader && context.env?.SHOPIFY_WEBHOOK_SECRET) {
    // In production, verify HMAC here. For now, log.
    console.warn('Webhook HMAC received:', hmacHeader);
  }

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
