import {useLoaderData, useActionData, data} from 'react-router';
import type {Route} from './+types/quote';
import {getBuyerVariables} from '~/lib/b2b';
import {hasAdminApi, createDraftOrder, type DraftOrderLineItem} from '~/lib/admin-api';
import {notifyQuoteCreated} from '~/lib/notifications';
import {QuoteForm} from '~/components/quote/QuoteForm';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {Money} from '@shopify/hydrogen';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Hydrogen | Request a Quote'}];
};

export async function loader({context}: Route.LoaderArgs) {
  const {cart} = context;
  const currentCart = await cart.get();

  return {
    cart: currentCart,
  };
}

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const company = String(formData.get('company') || '');
  const contact = String(formData.get('contact') || '');
  const email = String(formData.get('email') || '');
  const phone = String(formData.get('phone') || '');
  const project = String(formData.get('project') || '');

  // Get current cart to build line items
  const {cart} = context;
  const currentCart = await cart.get();
  const lines = currentCart?.lines?.nodes ?? [];

  // Collect variant IDs and quantities for Draft Order
  const lineItems: DraftOrderLineItem[] = [];
  for (const line of lines) {
    if ('merchandise' in line && line.merchandise?.id) {
      lineItems.push({
        variantId: line.merchandise.id,
        quantity: line.quantity,
      });
    }
  }

  // Build a structured note for the draft order
  const note = [
    `Company: ${company}`,
    `Contact: ${contact}`,
    `Phone: ${phone}`,
    project ? `Project: ${project}` : '',
    `Submitted via Quote Request form`,
  ]
    .filter(Boolean)
    .join('\n');

  // Get B2B buyer context so the draft order is assigned to the company location
  const buyerVariables = await getBuyerVariables(context);
  const companyLocationId = buyerVariables.buyer?.companyLocationId;

  // Try creating a Draft Order via Admin API
  if (hasAdminApi(context.env) && lineItems.length > 0) {
    try {
      const draftOrder = await createDraftOrder(context.env, {
        lineItems,
        email,
        note,
        ...(companyLocationId ? {companyLocationId} : {}),
        metafields: [
          {
            namespace: 'custom',
            key: 'quote_source',
            value: 'website_quote_form',
          },
        ],
      });

      // Notify sales team (Slack/Teams) — non-blocking, failures logged
      void notifyQuoteCreated(context.env, {
        draftOrderName: draftOrder.name,
        invoiceUrl: draftOrder.invoiceUrl,
        company,
        contact,
        email,
        phone,
        project,
        itemCount: lineItems.length,
      }).catch((err: Error) => console.error('Notification error:', err));

      return data({
        mode: 'draft_order' as const,
        draftOrderName: draftOrder.name,
        invoiceUrl: draftOrder.invoiceUrl,
        message: `Quote ${draftOrder.name} has been created. Our sales team will review and send you contract pricing.`,
      });
    } catch (error: unknown) {
      // Log error but fall back to mailto mode
      console.error('Draft order creation failed:', error);
    }
  }

  // Fallback: return data for client-side mailto generation
  return data({
    mode: 'mailto' as const,
    company,
    contact,
    email,
    phone,
    project,
    lineItems: lineItems.map((item, i) => ({
      title: lines[i]
        ? 'merchandise' in lines[i] && lines[i].merchandise
          ? ('product' in lines[i].merchandise
              ? String((lines[i].merchandise.product as {title?: string})?.title ?? '')
              : '')
          : ''
        : '',
      sku:
        lines[i] && 'merchandise' in lines[i] && 'sku' in lines[i].merchandise && lines[i].merchandise.sku
          ? String(lines[i].merchandise.sku)
          : '',
      quantity: item.quantity,
    })),
  });
}

export default function QuotePage() {
  const {cart} = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const lines = cart?.lines?.nodes ?? [];
  const hasItems = lines.length > 0;

  return (
    <div className="quote-page">
      <div className="container-page">
        <Breadcrumbs
          crumbs={[{label: 'Home', to: '/'}, {label: 'Request a Quote'}]}
        />

        <div className="quote-page-header">
          <h1>Request a Quote</h1>
          <p className="quote-page-intro">
            Review your items below and submit a quote request. Our sales team
            will respond with contract pricing within one business day.
          </p>
        </div>

        {/* Success banner after Draft Order creation */}
        {actionData?.mode === 'draft_order' && (
          <div className="quote-success-banner card">
            <div className="card-body">
              <span className="badge badge-success">Quote submitted</span>
              <h3>{actionData.draftOrderName}</h3>
              <p className="text-muted">{actionData.message}</p>
              <a
                className="btn btn-primary"
                href={actionData.invoiceUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                View invoice
              </a>
            </div>
          </div>
        )}

        <div className="quote-layout">
          {/* Cart summary for the quote */}
          <div className="quote-items">
            <h2 className="section-heading">
              <span>Items ({lines.length})</span>
            </h2>

            {hasItems ? (
              <ul className="quote-items-list">
                {lines.map((line) => {
                  const merchandise =
                    'merchandise' in line ? line.merchandise : null;
                  if (!merchandise) return null;

                  const productTitle =
                    'product' in merchandise && merchandise.product
                      ? (merchandise.product as {title?: string}).title
                      : ('title' in merchandise ? String(merchandise.title) : '');
                  const sku =
                    'sku' in merchandise && merchandise.sku
                      ? String(merchandise.sku)
                      : null;

                  return (
                    <li className="quote-item" key={line.id}>
                      <div className="quote-item-info">
                        <p className="quote-item-title">
                          <strong>{productTitle}</strong>
                        </p>
                        {sku && (
                          <p className="quote-item-sku">SKU: {sku}</p>
                        )}
                        <p className="quote-item-qty">
                          Qty: {line.quantity}
                        </p>
                      </div>
                      <div className="quote-item-price">
                        {line.cost?.amountPerQuantity && (
                          <Money data={line.cost.amountPerQuantity} />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted">
                Your cart is empty.{' '}
                <a href="/collections">Browse products</a> to add items to
                your quote.
              </p>
            )}

            {cart?.cost?.subtotalAmount && (
              <div className="quote-subtotal">
                <span>Estimated subtotal</span>
                <Money data={cart.cost.subtotalAmount} />
              </div>
            )}
          </div>

          {/* Quote request form */}
          <div className="quote-form-col">
            <QuoteForm
              cartLines={lines}
              actionData={actionData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
