import {redirect, useLoaderData, useSearchParams} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {ProductItem} from '~/components/ProductItem';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {FilterSidebar} from '~/components/collection/FilterSidebar';
import {SortSelect} from '~/components/collection/SortSelect';
import {
  getSortValues,
  parseProductFilters,
  type SortKey,
} from '~/lib/filters';
import {b2bCacheOptions, getBuyerVariables} from '~/lib/b2b';
import type {ProductItemFragment} from 'storefrontapi.generated';
import {collectionJsonLd, breadcrumbJsonLd, JsonLd} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, location}) => {
  const collection = data?.collection;
  if (!collection) return [{title: 'Collection'}];

  const title = `${collection.title} Collection`;
  const description = collection.description || `Shop ${collection.title} products`;

  return [
    {title: `Hydrogen | ${title}`},
    {name: 'description', content: description},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: location.pathname},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
  ];
};

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw redirect('/collections');
  }

  const searchParams = new URL(request.url).searchParams;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 24,
  });
  const filters = parseProductFilters(searchParams);
  const {sortKey, reverse} = getSortValues(searchParams.get('sort'));

  // @description Contextualize the query so B2B customers see their catalog
  const buyerVariables = await getBuyerVariables(context);

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        filters,
        sortKey,
        reverse,
        ...paginationVariables,
        ...buyerVariables,
      },
      ...b2bCacheOptions(storefront, buyerVariables),
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {collection};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will
 * be fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const sort = getSortValues(searchParams.get('sort')).key as SortKey;
  const products = collection.products;

  const jsonLd = collectionJsonLd({
    name: collection.title,
    url: `/collections/${collection.handle}`,
    description: collection.description ?? undefined,
  });

  const breadcrumbLd = breadcrumbJsonLd([
    {name: 'Home', url: '/'},
    {name: 'Collections', url: '/collections'},
    {name: collection.title, url: `/collections/${collection.handle}`},
  ]);

  return (
    <div className="collection-page">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbLd} />
      <div className="container-page">
        <Breadcrumbs
          crumbs={[
            {label: 'Collections', to: '/collections'},
            {label: collection.title},
          ]}
        />

        <header className="collection-header">
          <h1>{collection.title}</h1>
          {collection.description && (
            <p className="collection-description">{collection.description}</p>
          )}
        </header>

        <div className="collection-toolbar">
          <p className="collection-count">
            {products.nodes.length} product
            {products.nodes.length === 1 ? '' : 's'}
          </p>
          <SortSelect current={sort} />
        </div>

        <div className="collection-layout">
          <FilterSidebar filters={products.filters} />

          <div className="collection-results">
            <PaginatedResourceSection<ProductItemFragment>
              connection={products}
              resourcesClassName="products-grid"
            >
              {({node: product, index}) => (
                <ProductItem
                  key={product.id}
                  product={product}
                  loading={index < 8 ? 'eager' : undefined}
                />
              )}
            </PaginatedResourceSection>
          </div>
        </div>

        <Analytics.CollectionView
          data={{
            collection: {
              id: collection.id,
              handle: collection.handle,
            },
          }}
        />
      </div>
    </div>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    vendor
    featuredImage {
      id
      altText
      url
      width
      height
    }
    variants(first: 1) {
      nodes {
        sku
      }
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $buyer: BuyerInput
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        filters: $filters,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        filters {
          id
          label
          type
          values {
            id
            label
            count
          }
        }
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;
