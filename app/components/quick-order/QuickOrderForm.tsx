import {useActionData, Form} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import type {ResolvedLine, UnresolvedLine} from '~/lib/quick-order';

type ActionData = {
  error?: string;
  input?: string;
  resolved?: ResolvedLine[];
  unresolved?: UnresolvedLine[];
  message?: string;
};

/**
 * Quick Order form: paste SKU + quantity list, resolve against catalog,
 * then bulk-add to cart.
 */
export function QuickOrderForm() {
  const actionData = useActionData() as ActionData | undefined;

  return (
    <div className="quick-order-form">
      <Form method="post" className="quick-order-input-form">
        <div className="field">
          <label className="label" htmlFor="input">
            SKU list
          </label>
          <textarea
            className="input quick-order-textarea"
            defaultValue={actionData?.input ?? ''}
            id="input"
            name="input"
            placeholder={'SKU-123,5\nSKU-456,10\nSKU-789,1'}
            rows={8}
          />
        </div>

        {actionData?.error && (
          <p className="quick-order-error">{actionData.error}</p>
        )}

        <button className="btn btn-primary" type="submit">
          Resolve SKUs
        </button>
      </Form>

      {actionData?.resolved && actionData.resolved.length > 0 && (
        <div className="quick-order-results">
          <div className="quick-order-results-header">
            <h2 className="section-heading">
              <span>Resolved lines ({actionData.resolved.length})</span>
            </h2>
            {actionData.message && (
              <p className="quick-order-message">{actionData.message}</p>
            )}
          </div>

          <table className="data-table quick-order-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {actionData.resolved.map((line) => (
                <tr key={line.sku}>
                  <td>
                    <code>{line.sku}</code>
                  </td>
                  <td>
                    <a href={`/products/${line.productHandle}`}>
                      {line.title}
                    </a>
                  </td>
                  <td>{line.quantity}</td>
                  <td>
                    {line.price.currencyCode} {line.price.amount}
                  </td>
                  <td>
                    {line.price.currencyCode}{' '}
                    {(
                      Number(line.price.amount) * line.quantity
                    ).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <CartForm
            route="/cart"
            inputs={{
              lines: (actionData.resolved ?? []).map((line) => ({
                merchandiseId: line.variantId,
                quantity: line.quantity,
              })),
            }}
            action={CartForm.ACTIONS.LinesAdd}
          >
            {(fetcher) => (
              <button
                className="btn btn-primary btn-lg"
                disabled={fetcher.state !== 'idle'}
                type="submit"
              >
                {fetcher.state === 'submitting'
                  ? 'Adding to cart…'
                  : `Add all to cart (${actionData.resolved?.length ?? 0} items)`}
              </button>
            )}
          </CartForm>
        </div>
      )}

      {actionData?.unresolved && actionData.unresolved.length > 0 && (
        <div className="quick-order-unresolved">
          <h2 className="section-heading">
            <span>Not found ({actionData.unresolved.length})</span>
          </h2>
          <ul className="quick-order-unresolved-list">
            {actionData.unresolved.map((line) => (
              <li key={line.sku}>
                <code>{line.sku}</code>
                <span className="text-muted">
                  {line.reason === 'not_found'
                    ? 'No matching product'
                    : 'Invalid quantity'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
