/**
 * Quick Order: parse CSV / paste text of SKU + quantity pairs and resolve
 * them against the Storefront API.
 */

export type QuickOrderLine = {
  sku: string;
  quantity: number;
};

export type ResolvedLine = {
  sku: string;
  quantity: number;
  variantId: string;
  productHandle: string;
  title: string;
  price: {amount: string; currencyCode: string};
};

export type UnresolvedLine = {
  sku: string;
  reason: 'not_found' | 'invalid_quantity';
};

/**
 * Parse user input like:
 *   SKU-123,5
 *   SKU-456, 10
 *   SKU-789
 *
 * Supports comma, tab or whitespace as delimiter.  Lines without an
 * explicit quantity default to 1.
 */
export function parseQuickOrderInput(input: string): QuickOrderLine[] {
  const lines: QuickOrderLine[] = [];
  const seen = new Set<string>();

  input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      // split on comma, semicolon, tab or multiple spaces
      const parts = line.split(/[,;\t]|\s{2,}/);
      const sku = parts[0]?.trim();
      if (!sku || seen.has(sku.toUpperCase())) return;

      const rawQty = parts[1]?.trim();
      const quantity = rawQty ? Number(rawQty) : 1;
      if (!Number.isFinite(quantity) || quantity < 1) return;

      seen.add(sku.toUpperCase());
      lines.push({sku, quantity});
    });

  return lines;
}

/**
 * Build a Shopify search query that matches any of the given SKUs.
 * Storefront API supports OR syntax: `sku:A OR sku:B`.
 * We batch in groups of 5 to stay within query length limits.
 */
export function buildSkuQuery(skus: string[]): string {
  return skus.map((sku) => `sku:${sku}`).join(' OR ');
}

/**
 * Split a list into batches of a fixed size.
 */
export function batch<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

/**
 * Given parsed lines and resolved products, split into "resolved" and
 * "unresolved" buckets.
 */
export function resolveLines(
  lines: QuickOrderLine[],
  variants: Array<{
    sku: string;
    id: string;
    product: {handle: string; title: string};
    price: {amount: string; currencyCode: string};
  }>,
): {resolved: ResolvedLine[]; unresolved: UnresolvedLine[]} {
  const bySku = new Map(
    variants.map((v) => [v.sku.toUpperCase(), v]),
  );

  const resolved: ResolvedLine[] = [];
  const unresolved: UnresolvedLine[] = [];

  lines.forEach((line) => {
    const variant = bySku.get(line.sku.toUpperCase());
    if (!variant) {
      unresolved.push({sku: line.sku, reason: 'not_found'});
      return;
    }

    resolved.push({
      sku: line.sku,
      quantity: line.quantity,
      variantId: variant.id,
      productHandle: variant.product.handle,
      title: variant.product.title,
      price: variant.price,
    });
  });

  return {resolved, unresolved};
}
