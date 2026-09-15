import {data, redirect} from 'react-router';
import type {Route} from './+types/quick-order';
import {getBuyerVariables, b2bCacheOptions} from '~/lib/b2b';
import {
  parseQuickOrderInput,
  buildSkuQuery,
  batch,
  resolveLines,
} from '~/lib/quick-order';
import {QuickOrderForm} from '~/components/quick-order/QuickOrderForm';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Hydrogen | Quick Order'}];
};

export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const input = String(formData.get('input') || '');

  if (!input.trim()) {
    return data({error: 'Please enter at least one SKU and quantity.'}, 400);
  }

  const lines = parseQuickOrderInput(input);
  if (!lines.length) {
    return data(
      {error: 'No valid lines found. Use format: SKU,quantity (one per line).'},
      400,
    );
  }

  const buyerVariables = await getBuyerVariables(context);
  const {storefront} = context;

  // Batch SKUs (Shopify search query length limits)
  const skuBatches = batch(
    lines.map((l) => l.sku),
    5,
  );

  const allVariants: Array<{
    sku: string;
    id: string;
    product: {handle: string; title: string};
    price: {amount: string; currencyCode: string};
  }> = [];

  for (const skuBatch of skuBatches) {
    const query = buildSkuQuery(skuBatch);
    const {products} = await storefront.query(QUICK_ORDER_QUERY, {
      variables: {query, ...buyerVariables},
      ...b2bCacheOptions(storefront, buyerVariables),
    });

    products?.nodes?.forEach((product) => {
      product.variants?.nodes?.forEach((variant) => {
        if (variant.sku) {
          allVariants.push({
            sku: variant.sku,
            id: variant.id,
            product: {handle: product.handle, title: product.title},
            price: variant.price,
          });
        }
      });
    });
  }

  const {resolved, unresolved} = resolveLines(lines, allVariants);

  if (unresolved.length) {
    return data({
      input,
      resolved,
      unresolved,
      message: `${resolved.length} lines ready, ${unresolved.length} not found.`,
    });
  }

  // All resolved: redirect to cart with items (cart form handles the rest)
  return data({
    input,
    resolved,
    unresolved: [],
    message: `${resolved.length} lines resolved.`,
  });
}

export function loader() {
  return data({input: '', resolved: [], unresolved: []});
}

export default function QuickOrderPage() {
  return (
    <div className="quick-order-page">
      <div className="container-page">
        <h1>Quick Order</h1>
        <p className="quick-order-intro">
          Paste a list of SKUs and quantities below. One per line, format:
          <code>SKU,quantity</code>
        </p>
        <QuickOrderForm />
      </div>
    </div>
  );
}

const QUICK_ORDER_QUERY = `#graphql
  query QuickOrder(
    $query: String!
    $country: CountryCode
    $language: LanguageCode
    $buyer: BuyerInput
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    products(first: 250, query: $query) {
      nodes {
        handle
        title
        variants(first: 250) {
          nodes {
            id
            sku
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
` as const;
