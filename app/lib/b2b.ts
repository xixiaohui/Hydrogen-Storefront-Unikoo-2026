/**
 * Helpers to contextualize Storefront API queries for B2B customers.
 *
 * Without the `buyer` argument on `@inContext`, Shopify falls back to the
 * store's base pricing *and* base product publishing, so B2B customers see
 * the whole retail catalog at retail prices. Every query that reads products,
 * collections or prices must therefore be contextualized.
 *
 * Contextualized responses are customer specific, so they must never be served
 * from a shared cache entry.
 */

type Buyer = {
  companyLocationId?: string | null;
  customerAccessToken?: string | null;
};

type B2BContext = {
  customerAccount: {
    getBuyer: () => Promise<Buyer | null | undefined>;
  };
};

export type BuyerVariables = {
  buyer?: {
    companyLocationId?: string;
    customerAccessToken: string;
  };
};

type CacheFactory<A, B> = {
  CacheNone: () => A;
  CacheShort: () => B;
};

/**
 * Returns the `buyer` variable to spread into a Storefront query, or an empty
 * object when the visitor is not a logged in B2B customer.
 *
 * A B2B customer is contextualized as soon as we have a customer access token.
 * The company location is optional here so a B2B customer that has not picked a
 * location yet still gets catalog publishing and pricing.
 */
export async function getBuyerVariables(
  context: B2BContext,
): Promise<BuyerVariables> {
  const buyer = await context.customerAccount.getBuyer();

  if (!buyer?.customerAccessToken) return {};

  return {
    buyer: {
      customerAccessToken: buyer.customerAccessToken,
      ...(buyer.companyLocationId
        ? {companyLocationId: buyer.companyLocationId}
        : {}),
    },
  };
}

/**
 * Disables caching whenever a query is contextualized with buyer information.
 */
export function b2bCacheOptions<A, B>(
  storefront: CacheFactory<A, B>,
  buyerVariables: BuyerVariables,
): {cache: A | B} {
  return {
    cache:
      'buyer' in buyerVariables ? storefront.CacheNone() : storefront.CacheShort(),
  };
}
