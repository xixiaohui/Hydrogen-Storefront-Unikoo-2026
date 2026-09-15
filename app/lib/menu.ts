import type {HeaderQuery} from 'storefrontapi.generated';

export type MenuItem = NonNullable<HeaderQuery['menu']>['items'][number];
export type ChildMenuItem = NonNullable<MenuItem['items']>[number];

/**
 * Shopify returns absolute URLs for menu items, including the primary domain
 * and the public store domain. Strip the origin so navigation stays internal
 * (and works across locales) instead of triggering a full page load.
 */
export function resolveMenuUrl(
  url: string | null | undefined,
  {
    primaryDomainUrl,
    publicStoreDomain,
  }: {primaryDomainUrl?: string; publicStoreDomain: string},
) {
  if (!url) return '/';

  const isInternal =
    url.includes('myshopify.com') ||
    (primaryDomainUrl ? url.includes(primaryDomainUrl) : false) ||
    url.includes(publicStoreDomain);

  if (!isInternal) return url;

  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function isExternalUrl(url: string) {
  return !url.startsWith('/');
}
