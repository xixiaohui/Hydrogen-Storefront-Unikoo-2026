# Hydrogen template: Skeleton

Hydrogen is Shopify’s stack for headless commerce. Hydrogen is designed to dovetail with [React Router](https://reactrouter.com/), the modern multi-strategy router for React. This template contains a **minimal setup** of components, queries and tooling to get started with Hydrogen.

[Check out Hydrogen docs](https://shopify.dev/custom-storefronts/hydrogen)
[Get familiar with React Router](https://reactrouter.com/start/framework/routing)

## What's included

- React Router
- Hydrogen
- Oxygen
- Vite
- Shopify CLI
- ESLint
- Prettier
- GraphQL generator
- TypeScript and JavaScript flavors
- Minimal setup of components and routes

## B2B Features

This storefront includes B2B functionality for stores on plans that support B2B capabilities:

1. **Company location selection** — B2B customers pick a company location, rendered in the shared `Aside` drawer (see `app/components/B2BLocationSelector.tsx`)
2. **Quantity rules** — minimum / maximum / increment are respected by the product form and by the cart quantity controls
3. **Volume pricing** — quantity price breaks are displayed on the product page
4. **Contextualized queries** — the product query is contextualized with `buyer` (company location + customer access token) for accurate B2B pricing

Requirements:

- A plan that supports B2B capabilities, with B2B enabled
- [New customer accounts](https://help.shopify.com/en/manual/customers/customer-accounts/new-customer-accounts) activated
- A customer with permission to order for a [B2B company](https://help.shopify.com/en/manual/b2b)

Key files:

| File | Description |
| --- | --- |
| `app/routes/b2blocations.tsx` | Loads company locations and stores the selected one in the session |
| `app/components/B2BLocationProvider.tsx` | React context for the company location state |
| `app/components/B2BLocationSelector.tsx` | Company location picker (`LocationAside`) |
| `app/components/QuantityRules.tsx` | Displays quantity rules (min / max / increment) |
| `app/components/PriceBreaks.tsx` | Displays volume-based pricing tiers |
| `app/graphql/customer-account/CustomerLocationsQuery.ts` | Customer Account API query for company locations |

> [!NOTE]
> Only the product display page is contextualized with buyer information. Every route in this project exists twice (`x.tsx` and `($locale).x.tsx`), so keep both copies in sync. Buyer-contextualized queries must never use a shared cache.

## Getting started

**Requirements:**

- Node.js version 22.x or 24.x

```bash
npm create @shopify/hydrogen@latest
```

## Building for production

```bash
npm run build
```

## Local development

```bash
npm run dev
```

## Setup for using Customer Account API (`/account` section)

Follow step 1 and 2 of <https://shopify.dev/docs/custom-storefronts/building-with-the-customer-account-api/hydrogen#step-1-set-up-a-public-domain-for-local-development>
