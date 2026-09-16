/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

interface Env {
  // Existing storefront env vars are augmented by @shopify/hydrogen
  // Admin API (server-side only, never exposed to client)
  SHOPIFY_ADMIN_API_TOKEN?: string;
}
