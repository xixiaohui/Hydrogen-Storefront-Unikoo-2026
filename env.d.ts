/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

interface Env {
  // Storefront (set by Hydrogen sales channel)
  SESSION_SECRET: string;
  PUBLIC_STORE_DOMAIN: string;
  PUBLIC_STOREFRONT_API_TOKEN: string;
  PUBLIC_STOREFRONT_ID: string;
  PUBLIC_CHECKOUT_DOMAIN: string;

  // Admin API (server-side only, never exposed to client)
  SHOPIFY_ADMIN_API_TOKEN?: string;

  // Notifications (optional)
  SLACK_WEBHOOK_URL?: string;
  TEAMS_WEBHOOK_URL?: string;
  SHOPIFY_WEBHOOK_SECRET?: string;

  // Error tracking (optional)
  SENTRY_DSN?: string;
}
