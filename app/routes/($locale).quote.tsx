import {useLoaderData} from 'react-router';
import type {Route} from './+types/quote';
import {getBuyerVariables, b2bCacheOptions} from '~/lib/b2b';
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
    buyerContext: await getBuyerVariables(context),
  };
}

export default function QuotePage() {
  const {cart} = useLoaderData<typeof loader>();
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
            <QuoteForm cartLines={lines} />
          </div>
        </div>
      </div>
    </div>
  );
}
