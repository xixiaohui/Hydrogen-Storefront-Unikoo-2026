import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout, LineItemChildrenMap} from '~/components/CartMain';
import {CartForm, Image, type OptimisticCartLine} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {Money} from '@shopify/hydrogen';
import {useAside} from './Aside';
import type {
  CartApiQueryFragment,
  CartLineFragment,
} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

/**
 * Industrial cart line item: larger image, SKU display, quantity controls,
 * B2B quantity rule respect, save-for-later placeholder.
 */
export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const sku = 'sku' in merchandise ? String(merchandise.sku) : undefined;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];
  const childrenLabelId = `cart-line-children-${id}`;

  return (
    <li key={id} className="cart-line-item">
      <div className="cart-line-inner">
        {/* Image */}
        <div className="cart-line-image">
          {image && (
            <Image
              alt={title}
              aspectRatio="1/1"
              data={image}
              height={120}
              loading="lazy"
              width={120}
            />
          )}
        </div>

        {/* Details */}
        <div className="cart-line-details">
          <Link
            className="cart-line-title"
            prefetch="intent"
            to={lineItemUrl}
            onClick={() => {
              if (layout === 'aside') close();
            }}
          >
            <strong>{product.title}</strong>
          </Link>

          {sku && <p className="cart-line-sku">SKU: {sku}</p>}

          <ul className="cart-line-options">
            {selectedOptions.map((option) => (
              <li key={option.name}>
                {option.name}: <strong>{option.value}</strong>
              </li>
            ))}
          </ul>

          <div className="cart-line-price">
            <Money data={line.cost.totalAmount} />
          </div>
        </div>

        {/* Actions */}
        <div className="cart-line-actions">
          <CartLineQuantity line={line} />
          <CartLineRemoveButton lineIds={[id]} disabled={!!line.isOptimistic} />
        </div>
      </div>

      {/* Children (bundles, warranties) */}
      {lineItemChildren ? (
        <div className="cart-line-children-wrapper">
          <p id={childrenLabelId} className="sr-only">
            Line items with {product.title}
          </p>
          <ul aria-labelledby={childrenLabelId} className="cart-line-children">
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                line={childLine}
                layout={layout}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

function CartLineQuantity({line}: {line: CartLine}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;

  const {increment, minimum, maximum} = line.merchandise.quantityRule || {
    increment: 1,
    minimum: 1,
    maximum: null,
  };
  const nextIncrement = increment - (quantity % increment);
  const prevIncrement =
    quantity % increment === 0 ? increment : quantity % increment;
  const prevQuantity = Number(Math.max(0, quantity - prevIncrement).toFixed(0));
  const nextQuantity = Number((quantity + nextIncrement).toFixed(0));

  return (
    <div className="cart-line-quantity">
      <span className="label">Quantity</span>
      <div className="cart-line-quantity-controls">
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            aria-label="Decrease quantity"
            disabled={prevQuantity < minimum || !!isOptimistic}
            name="decrease-quantity"
            type="button"
            value={prevQuantity}
          >
            −
          </button>
        </CartLineUpdateButton>
        <span className="cart-line-quantity-value">{quantity}</span>
        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            aria-label="Increase quantity"
            disabled={Boolean(
              (maximum && nextQuantity > maximum) || !!isOptimistic,
            )}
            name="increase-quantity"
            type="button"
            value={nextQuantity}
          >
            +
          </button>
        </CartLineUpdateButton>
      </div>
    </div>
  );
}

function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button
        className="btn btn-ghost btn-sm"
        disabled={disabled}
        type="submit"
      >
        Remove
      </button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
