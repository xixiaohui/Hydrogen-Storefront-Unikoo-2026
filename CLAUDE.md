@AGENTS.md

# B2B / industrial storefront rules

This project is being rebuilt into a CRL-style large industrial B2B storefront.
The full plan lives in `guides/b2b/crl-hydroen/`. Follow these rules on every
change:

1. **Shopify is the only source of truth.** Categories, brands, navigation,
   resources and locations come from Navigation / Collection / Metaobject.
   Never hardcode taxonomies in TypeScript.
2. **Contextualize every product, collection and price query.** Use
   `getBuyerVariables(context)` from `app/lib/b2b.ts` and pass `$buyer` into
   `@inContext`. A query without buyer context silently returns the retail
   catalog.
3. **Never share cache for buyer-context responses.** Wrap those queries with
   `b2bCacheOptions(storefront, buyerVariables)` (`CacheNone()`). Skipping this
   leaks one company's prices to another customer.
4. **Routes are duplicated for locales.** Every new route under `app/routes/`
   needs an identical `($locale).` copy, otherwise localized paths break.
5. **Do not build a parallel account or pricing system.** Customer Account API
   for identity, Shopify Checkout for payment.
6. **Design tokens only.** Colors, spacing and typography come from
   `app/styles/tokens.css`; component classes from `app/styles/components.css`.
   Do not inline hex values.
7. **After touching GraphQL**: run `npm run codegen`, then `npm run typecheck`
   and `npm run lint` before declaring a phase done.
