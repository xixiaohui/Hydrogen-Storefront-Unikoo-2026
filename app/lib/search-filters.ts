/**
 * URL driven search faceting.
 *
 * Shopify Storefront API `search` does not expose a `filters` argument like
 * `collection.products`, but the `query` parameter supports Shopify search
 * syntax (`vendor:`, `product_type:`, `tag:`, `available:`).  We decompose
 * those from the URL so the UI can render toggles and the loader can rebuild
 * the compound query string.
 */

export interface SearchFilters {
  brand: string[];
  type: string[];
  tag: string[];
  available: boolean;
}

export function parseSearchFilters(params: URLSearchParams): SearchFilters {
  const split = (key: string) =>
    params
      .getAll(key)
      .flatMap((v) => v.split(','))
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    brand: split('brand'),
    type: split('type'),
    tag: split('tag'),
    available: params.get('available') === '1',
  };
}

export function buildSearchQuery(
  baseTerm: string,
  filters: SearchFilters,
): string {
  const parts: string[] = baseTerm ? [baseTerm] : [];
  filters.brand.forEach((b) => parts.push(`vendor:${b}`));
  filters.type.forEach((t) => parts.push(`product_type:${t}`));
  filters.tag.forEach((t) => parts.push(`tag:${t}`));
  if (filters.available) parts.push('available:1');
  return parts.join(' ').trim();
}

export function toggleSearchFilterUrl(
  url: URL,
  key: string,
  value: string,
): string {
  const params = new URLSearchParams(url.search);
  const current = params
    .getAll(key)
    .flatMap((v) => v.split(','))
    .filter(Boolean);
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];

  params.delete(key);
  next.forEach((v) => params.append(key, v));
  return `${url.pathname}?${params.toString()}`;
}

export function clearSearchFiltersUrl(url: URL): string {
  const params = new URLSearchParams(url.search);
  const q = params.get('q');
  const next = new URLSearchParams();
  if (q) next.set('q', q);
  return `${url.pathname}?${next.toString()}`;
}

export function countSearchFilters(filters: SearchFilters) {
  return (
    filters.brand.length + filters.type.length + filters.tag.length + (filters.available ? 1 : 0)
  );
}

/** Extract a raw SKU from queries like "SKU:ABC-123" or "sku:ABC123". */
export function parseSkuQuery(term: string): string | null {
  const m = term.trim().match(/^SKU:\s*([A-Z0-9\-_]+)$/i);
  return m ? m[1] : null;
}
