import type {Metafield} from '@shopify/hydrogen/storefront-api-types';

/**
 * Specification table rendered from product metafields.
 *
 * Shopify Admin → Settings → Custom data → Metafields → Products:
 *   Namespace: `custom`  Key: `specifications`  Type: JSON
 *   Value shape: [{"label":"Material","value":"Stainless steel"}, ...]
 *
 * If the metafield is missing, render a placeholder so merchandisers know
 * what to configure.
 */
export function ProductSpecs({
  metafields,
}: {
  metafields: Array<Pick<Metafield, 'namespace' | 'key' | 'value'>>;
}) {
  const raw = metafields.find(
    (m) => m.namespace === 'custom' && m.key === 'specifications',
  )?.value;

  let rows: Array<{label: string; value: string}> = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) rows = parsed as Array<{label: string; value: string}>;
    } catch {
      // fallback: treat as plain text
      rows = [{label: 'Specification', value: raw}];
    }
  }

  return (
    <div className="product-specs">
      <h2 className="section-heading">
        <span>Specifications</span>
      </h2>

      {rows.length > 0 ? (
        <table className="data-table">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted">
          No specifications available. Add a product metafield with namespace
          <code>custom</code> and key <code>specifications</code> (JSON format).
        </p>
      )}
    </div>
  );
}
