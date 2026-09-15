import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

/**
 * Industrial price display: large current price + struck compare-at price.
 */
export function ProductPrice({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
}) {
  return (
    <div aria-label="Price" className="product-price-block" role="group">
      {price ? (
        <span className="product-price-current">
          <Money data={price} />
        </span>
      ) : (
        <span className="product-price-current">—</span>
      )}

      {compareAtPrice ? (
        <s className="product-price-compare">
          <Money data={compareAtPrice} />
        </s>
      ) : null}
    </div>
  );
}
