import type {Maybe} from '@shopify/hydrogen/customer-account-api-types';

/**
 * Industrial B2B product identity strip: brand, SKU, availability.
 */
export function ProductB2BInfo({
  vendor,
  sku,
  availableForSale,
}: {
  vendor?: Maybe<string> | undefined;
  sku?: Maybe<string> | undefined;
  availableForSale?: boolean;
}) {
  return (
    <div className="product-b2b-info">
      {vendor && (
        <span className="badge badge-brand product-b2b-brand">{vendor}</span>
      )}

      {sku && (
        <span className="product-b2b-sku">
          <span className="label">SKU</span>{' '}
          <strong>{sku}</strong>
        </span>
      )}

      <span
        className={`badge ${availableForSale ? 'badge-success' : 'badge-danger'}`}
      >
        {availableForSale ? 'In stock' : 'Out of stock'}
      </span>
    </div>
  );
}
