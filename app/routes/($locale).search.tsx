import {redirect, useLoaderData, useLocation, Link} from 'react-router';
import type {Route} from './+types/search';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {SearchForm} from '~/components/SearchForm';
import {SearchResults} from '~/components/SearchResults';
import {
  type PredictiveSearchReturn,
  getEmptyPredictiveSearchResult,
} from '~/lib/search';
import type {
  RegularSearchQuery,
  PredictiveSearchQuery,
} from 'storefrontapi.generated';
import type {SearchFilters} from '~/lib/search-filters';
import {b2bCacheOptions, getBuyerVariables} from '~/lib/b2b';
import {
  parseSearchFilters,
  buildSearchQuery,
  parseSkuQuery,
  countSearchFilters,
  toggleSearchFilterUrl,
  clearSearchFiltersUrl,
} from '~/lib/search-filters';

export const meta: Route.MetaFunction = () => {
  return [{title: `Hydrogen | Search`}];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const isPredictive = url.searchParams.has('predictive');

  if (isPredictive) {
    return predictiveSearch({request, context});
  }

  return regularSearch({request, context});
}

export default function SearchPage() {
  const data = useLoaderData<typeof loader>();

  if (data.type === 'predictive') return null;

  const {term, result, error, filters, availableFilters, suggestions} =
    data as Awaited<ReturnType<typeof regularSearch>>;
  const applied = countSearchFilters(filters);

  return (
    <div className="search-page">
      <div className="container-page">
        <h1>Search</h1>

        <SearchForm className="search-form">
          {({inputRef}) => (
            <div className="search-input-group">
              <input
                aria-label="Search by keyword or SKU"
                className="input search-input"
                defaultValue={term}
                name="q"
                placeholder="Search by keyword or SKU…"
                ref={inputRef}
                type="search"
              />
              <button className="btn btn-primary" type="submit">
                Search
              </button>
            </div>
          )}
        </SearchForm>

        {error && <p className="search-error">{error}</p>}

        {!term || !result?.total ? (
          <SearchResults.Empty />
        ) : (
          <>
            {suggestions && suggestions.length > 0 && (
              <div className="search-did-you-mean">
                <span>Did you mean:</span>{' '}
                {suggestions.map((suggestion: string, i: number) => (
                  <span key={`suggestion-${suggestion}`}>
                    {i > 0 && ', '}
                    <Link
                      className="link-brand"
                      to={`/search?q=${encodeURIComponent(suggestion)}`}
                    >
                      {suggestion}
                    </Link>
                  </span>
                ))}
              </div>
            )}

            <div className="search-toolbar">
              <p className="search-count">
                {result.total} result{result.total === 1 ? '' : 's'} for{' '}
                <q>{term}</q>
              </p>
            </div>

            {result.items.products?.nodes?.length > 20 && (
              <SearchFacets
                filters={filters}
                availableFilters={availableFilters}
                applied={applied}
              />
            )}

            <SearchResults result={result} term={term}>
              {({articles, pages, products}) => (
                <div className="search-results-layout">
                  {products?.nodes?.length > 0 && (
                    <section className="search-results-section">
                      <h2 className="section-heading">
                        <span>Products</span>
                      </h2>
                      <div className="products-grid">
                        {products.nodes.map((product) => (
                          <SearchProductCard
                            key={product.id}
                            product={product}
                            term={term}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {pages?.nodes?.length > 0 && (
                    <section className="search-results-section">
                      <h2 className="section-heading">
                        <span>Pages</span>
                      </h2>
                      <ul className="search-results-list">
                        {pages.nodes.map((page) => (
                          <li key={page.id}>
                            <Link
                              prefetch="intent"
                              to={`/pages/${page.handle}?q=${encodeURIComponent(term)}`}
                            >
                              {page.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {articles?.nodes?.length > 0 && (
                    <section className="search-results-section">
                      <h2 className="section-heading">
                        <span>Articles</span>
                      </h2>
                      <ul className="search-results-list">
                        {articles.nodes.map((article) => (
                          <li key={article.id}>
                            <Link
                              prefetch="intent"
                              to={`/blogs/${article.blog.handle}/${article.handle}?q=${encodeURIComponent(term)}`}
                            >
                              {article.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </SearchResults>
          </>
        )}

        <Analytics.SearchView
          data={{searchTerm: term, searchResults: result}}
        />
      </div>
    </div>
  );
}

function SearchProductCard({
  product,
  term,
}: {
  product: NonNullable<
    RegularSearchQuery['products']
  >['nodes'][number];
  term: string;
}) {
  const variant = product.selectedOrFirstAvailableVariant;
  const image = variant?.image;
  const price = variant?.price;
  const compareAt = variant?.compareAtPrice;

  return (
    <Link
      className="product-card"
      prefetch="intent"
      to={`/products/${product.handle}?q=${encodeURIComponent(term)}`}
    >
      <div className="product-card-media">
        {image && (
          <img
            alt={image.altText || product.title}
            height={image.height ?? 300}
            loading="lazy"
            src={image.url}
            width={image.width ?? 300}
          />
        )}
      </div>
      <div className="product-card-body">
        {product.vendor && (
          <p className="product-card-vendor">{product.vendor}</p>
        )}
        <h4 className="product-card-title">{product.title}</h4>
        <p className="product-card-price">
          {price && (
            <>
              <MoneyInline data={price} />
              {compareAt && (
                <s className="product-card-compare">
                  <MoneyInline data={compareAt} />
                </s>
              )}
            </>
          )}
        </p>
      </div>
    </Link>
  );
}

function MoneyInline({data}: {data: {amount: string; currencyCode: string}}) {
  return (
    <span>
      {data.currencyCode} {data.amount}
    </span>
  );
}

function SearchFacets({
  filters,
  availableFilters,
  applied,
}: {
  filters: ReturnType<typeof parseSearchFilters>;
  availableFilters: {
    brands: string[];
    types: string[];
  };
  applied: number;
}) {
  const location = useLocation();
  const url = new URL(
    `${location.pathname}${location.search}`,
    'https://storefront.local',
  );

  return (
    <div className="search-facets">
      <div className="search-facets-header">
        <span className="search-facets-title">Refine results</span>
        {applied > 0 && (
          <Link className="search-facets-clear" to={clearSearchFiltersUrl(url)}>
            Clear all ({applied})
          </Link>
        )}
      </div>

      <div className="search-facets-row">
        {availableFilters.brands.length > 0 && (
          <FacetDropdown
            label="Brand"
            options={availableFilters.brands}
            param="brand"
            selected={filters.brand}
            url={url}
          />
        )}

        {availableFilters.types.length > 0 && (
          <FacetDropdown
            label="Category"
            options={availableFilters.types}
            param="type"
            selected={filters.type}
            url={url}
          />
        )}

        <FacetToggle
          label="In stock only"
          param="available"
          selected={filters.available}
          url={url}
        />
      </div>
    </div>
  );
}

function FacetDropdown({
  label,
  options,
  param,
  selected,
  url,
}: {
  label: string;
  options: string[];
  param: string;
  selected: string[];
  url: URL;
}) {
  return (
    <div className="facet-dropdown">
      <label className="label">{label}</label>
      <select
        className="select"
        onChange={(e) => {
          const value = e.target.value;
          window.location.href = toggleSearchFilterUrl(url, param, value);
        }}
        value={selected[0] ?? ''}
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function FacetToggle({
  label,
  param,
  selected,
  url,
}: {
  label: string;
  param: string;
  selected: boolean;
  url: URL;
}) {
  const next = toggleSearchFilterUrl(url, param, '1');
  const clear = clearSearchFiltersUrl(url);
  return (
    <Link
      className={`facet-toggle${selected ? ' is-selected' : ''}`}
      to={selected ? clear : next}
    >
      {label}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Loader helpers                                                     */
/* ------------------------------------------------------------------ */

const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment SearchProduct on Product {
    __typename
    handle
    id
    publishedAt
    title
    trackingParameters
    vendor
    productType
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
      selectedOptions {
        name
        value
      }
    }
  }
` as const;

const SEARCH_PAGE_FRAGMENT = `#graphql
  fragment SearchPage on Page {
    __typename
    handle
    id
    title
    trackingParameters
  }
` as const;

const SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment SearchArticle on Article {
    __typename
    handle
    id
    title
    trackingParameters
    blog {
      handle
    }
  }
` as const;

const PAGE_INFO_FRAGMENT = `#graphql
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
` as const;

const SKU_SEARCH_QUERY = `#graphql
  query SkuSearch(
    $query: String!
    $country: CountryCode
    $language: LanguageCode
    $buyer: BuyerInput
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    products(first: 2, query: $query) {
      nodes {
        handle
      }
    }
  }
` as const;

const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $term: String!
    $startCursor: String
    $buyer: BuyerInput
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    articles: search(
      query: $term,
      types: [ARTICLE],
      first: $first,
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
    }
    pages: search(
      query: $term,
      types: [PAGE],
      first: $first,
    ) {
      nodes {
        ...on Page {
          ...SearchPage
        }
      }
    }
    products: search(
      after: $endCursor,
      before: $startCursor,
      first: $first,
      last: $last,
      query: $term,
      sortKey: RELEVANCE,
      types: [PRODUCT],
      unavailableProducts: HIDE,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${SEARCH_PAGE_FRAGMENT}
  ${SEARCH_ARTICLE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
` as const;

async function regularSearch({
  request,
  context,
}: Pick<Route.LoaderArgs, 'request' | 'context'>) {
  const {storefront} = context;
  const url = new URL(request.url);
  const baseTerm = String(url.searchParams.get('q') || '');
  const filters = parseSearchFilters(url.searchParams);

  // @description Contextualize the query so B2B customers see their catalog
  const buyerVariables = await getBuyerVariables(context);

  /* SKU exact hit ---------------------------------------------------- */
  const sku = parseSkuQuery(baseTerm);
  if (sku) {
    const {products} = await storefront.query(SKU_SEARCH_QUERY, {
      variables: {query: `sku:${sku}`, ...buyerVariables},
      ...b2bCacheOptions(storefront, buyerVariables),
    });
    if (products?.nodes?.length === 1) {
      throw redirect(`/products/${products.nodes[0].handle}`);
    }
  }

  /* Regular search --------------------------------------------------- */
  const variables = getPaginationVariables(request, {pageBy: 24});
  const term = buildSearchQuery(baseTerm, filters);

  const {
    errors,
    ...items
  }: {errors?: Array<{message: string}>} & RegularSearchQuery =
    await storefront.query(SEARCH_QUERY, {
      variables: {...variables, term, ...buyerVariables},
      ...b2bCacheOptions(storefront, buyerVariables),
    });

  if (!items) {
    throw new Error('No search data returned from Shopify API');
  }

  const total = Object.values(items).reduce(
    (acc: number, {nodes}: {nodes: Array<unknown>}) => acc + nodes.length,
    0,
  );

  const error = errors
    ? errors.map(({message}: {message: string}) => message).join(', ')
    : undefined;

  /* Derive available facets from the first page of products ---------- */
  const productNodes = (items.products?.nodes ?? []) as Array<{
    vendor?: string | null;
    productType?: string | null;
  }>;
  const brands = [
    ...new Set(productNodes.map((p) => p.vendor).filter(Boolean)),
  ] as string[];
  const types = [
    ...new Set(productNodes.map((p) => p.productType).filter(Boolean)),
  ] as string[];

  return {
    type: 'regular' as const,
    term: baseTerm,
    error,
    result: {total, items},
    filters,
    availableFilters: {brands, types},
    suggestions: [] as string[],
  } as const;
}

/* Predictive search -------------------------------------------------- */

const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    vendor
    trackingParameters
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
    }
  }
` as const;

const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
    $buyer: BuyerInput
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $term,
      types: $types,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
` as const;

async function predictiveSearch({
  request,
  context,
}: Pick<Route.ActionArgs, 'request' | 'context'>) {
  const {storefront} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();
  const limit = Number(url.searchParams.get('limit') || 10);
  const type = 'predictive';

  if (!term) return {type, term, result: getEmptyPredictiveSearchResult()};

  // @description Contextualize the query so B2B customers see their catalog
  const buyerVariables = await getBuyerVariables(context);

  const {
    predictiveSearch: items,
    errors,
  }: PredictiveSearchQuery & {errors?: Array<{message: string}>} =
    await storefront.query(PREDICTIVE_SEARCH_QUERY, {
      variables: {
        limit,
        limitScope: 'EACH',
        term,
        ...buyerVariables,
      },
      ...b2bCacheOptions(storefront, buyerVariables),
    });

  if (errors) {
    throw new Error(
      `Shopify API errors: ${errors.map(({message}: {message: string}) => message).join(', ')}`,
    );
  }

  if (!items) {
    throw new Error('No predictive search data returned from Shopify API');
  }

  const total = Object.values(items).reduce(
    (acc: number, item: Array<unknown>) => acc + item.length,
    0,
  );

  return {type, term, result: {items, total}};
}
