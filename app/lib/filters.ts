import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';

/**
 * URL driven collection filtering and sorting.
 *
 * Shopify owns the taxonomy: the filter ids returned by the Storefront API
 * (`filter.v.option.color`, `filter.p.m.custom.finish`, `filter.v.price`, ...)
 * are used verbatim as URL parameters, so any filter configured in the admin
 * works without a code change.
 */

export const SORT_OPTIONS = [
  {label: 'Featured', key: 'featured', sortKey: 'MANUAL', reverse: false},
  {
    label: 'Best selling',
    key: 'best-selling',
    sortKey: 'BEST_SELLING',
    reverse: false,
  },
  {label: 'Newest', key: 'newest', sortKey: 'CREATED', reverse: true},
  {
    label: 'Price: low to high',
    key: 'price-low-high',
    sortKey: 'PRICE',
    reverse: false,
  },
  {
    label: 'Price: high to low',
    key: 'price-high-low',
    sortKey: 'PRICE',
    reverse: true,
  },
  {label: 'A–Z', key: 'title-a-z', sortKey: 'TITLE', reverse: false},
  {label: 'Z–A', key: 'title-z-a', sortKey: 'TITLE', reverse: true},
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]['key'];

export const FILTER_PREFIX = 'filter.';
export const PRICE_MIN = `${FILTER_PREFIX}v.price.gte`;
export const PRICE_MAX = `${FILTER_PREFIX}v.price.lte`;
const AVAILABILITY = `${FILTER_PREFIX}v.availability`;
const VARIANT_OPTION = `${FILTER_PREFIX}v.option.`;
const METAFIELD = `${FILTER_PREFIX}p.m.`;

export function getSortValues(sort?: string | null) {
  const option =
    SORT_OPTIONS.find(({key}) => key === sort) ?? SORT_OPTIONS[0];

  return {sortKey: option.sortKey, reverse: option.reverse, key: option.key};
}

/** Build the `filters` argument of a collection products query from the URL. */
export function parseProductFilters(
  searchParams: URLSearchParams,
): ProductFilter[] {
  const filters: ProductFilter[] = [];
  const price: {min?: number; max?: number} = {};

  searchParams.forEach((rawValue, key) => {
    if (!key.startsWith(FILTER_PREFIX)) return;

    const values = rawValue
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!values.length) return;

    if (key === PRICE_MIN || key === PRICE_MAX) {
      const parsed = Number(values[0]);
      if (Number.isFinite(parsed)) {
        if (key === PRICE_MIN) price.min = parsed;
        else price.max = parsed;
      }
      return;
    }

    if (key === AVAILABILITY) {
      filters.push({available: values[0] === '1' || values[0] === 'true'});
      return;
    }

    if (key.startsWith(VARIANT_OPTION)) {
      filters.push({
        variantOption: {
          name: key.slice(VARIANT_OPTION.length),
          value: values.join(','),
        },
      });
      return;
    }

    if (key.startsWith(METAFIELD)) {
      const [namespace, ...rest] = key.slice(METAFIELD.length).split('.');
      if (!namespace || !rest.length) return;
      filters.push({
        productMetafield: {
          namespace,
          key: rest.join('.'),
          value: values.join(','),
        },
      });
      return;
    }

    if (key === `${FILTER_PREFIX}p.vendor`) {
      filters.push({productVendor: values.join(',')});
      return;
    }

    if (key === `${FILTER_PREFIX}p.productType`) {
      filters.push({productType: values.join(',')});
      return;
    }

    if (key === `${FILTER_PREFIX}p.tag`) {
      filters.push({tag: values.join(',')});
    }
  });

  if (price.min !== undefined || price.max !== undefined) {
    filters.push({price});
  }

  return filters;
}

/**
 * Toggle a single filter value, keeping every other parameter intact.
 * Pagination is always reset so the buyer lands on the first page.
 */
export function toggleFilterUrl(
  url: URL,
  filterId: string,
  value: string,
): string {
  const params = new URLSearchParams(url.search);
  const current = params.get(filterId);
  const selected = current ? current.split(',').filter(Boolean) : [];
  const next = selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];

  if (next.length) params.set(filterId, next.join(','));
  else params.delete(filterId);

  return withResetPagination(params);
}

export function setFilterUrl(
  url: URL,
  filterId: string,
  value: string | null,
): string {
  const params = new URLSearchParams(url.search);

  if (value === null || value === '') params.delete(filterId);
  else params.set(filterId, value);

  return withResetPagination(params);
}

export function clearFiltersUrl(url: URL): string {
  const params = new URLSearchParams(url.search);
  const sort = params.get('sort');

  const next = new URLSearchParams();
  if (sort) next.set('sort', sort);

  const query = next.toString();
  return `${url.pathname}${query ? `?${query}` : ''}`;
}

export function sortUrl(url: URL, sortKey: string): string {
  const params = new URLSearchParams(url.search);
  params.set('sort', sortKey);
  return withResetPagination(params, url.pathname);
}

function withResetPagination(params: URLSearchParams, pathname = '') {
  params.delete('cursor');
  params.delete('direction');
  params.delete('page');

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ''}`;
}

/** Number of filter values currently applied (used for the "clear" badge). */
export function countAppliedFilters(searchParams: URLSearchParams) {
  let count = 0;

  searchParams.forEach((value, key) => {
    if (!key.startsWith(FILTER_PREFIX)) return;
    count += value.split(',').filter(Boolean).length;
  });

  return count;
}
