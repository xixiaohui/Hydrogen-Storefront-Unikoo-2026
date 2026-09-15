import type {Metafield} from '@shopify/hydrogen/storefront-api-types';

/**
 * Technical document downloads rendered from product metafields.
 *
 * Shopify Admin → Settings → Custom data → Metafields → Products:
 *   Namespace: `custom`  Key: `documents`  Type: JSON
 *   Value shape:
 *     [
 *       {"title":"Technical Datasheet","url":"https://cdn.shopify.com/.../datasheet.pdf"},
 *       {"title":"Installation Guide","url":"https://cdn.shopify.com/.../install.pdf"}
 *     ]
 */
export function ProductDocuments({
  metafields,
}: {
  metafields: Array<Pick<Metafield, 'namespace' | 'key' | 'value'>>;
}) {
  const raw = metafields.find(
    (m) => m.namespace === 'custom' && m.key === 'documents',
  )?.value;

  let docs: Array<{title: string; url: string}> = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) docs = parsed as Array<{title: string; url: string}>;
    } catch {
      /* ignore malformed JSON */
    }
  }

  if (!docs.length) return null;

  return (
    <div className="product-documents">
      <h2 className="section-heading">
        <span>Technical Documents</span>
      </h2>
      <ul className="document-list">
        {docs.map((doc) => (
          <li key={doc.url}>
            <a
              className="btn btn-secondary btn-sm"
              href={doc.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              ↓ {doc.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
