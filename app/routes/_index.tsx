import {useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
  CollectionFragment,
} from 'storefrontapi.generated';
import {b2bCacheOptions, getBuyerVariables} from '~/lib/b2b';
import {logger} from '~/lib/logger';
import {Hero} from '~/components/home/Hero';
import {CategoryNav} from '~/components/home/CategoryNav';
import {FeaturedProducts} from '~/components/home/FeaturedProducts';
import {ValueProps} from '~/components/home/ValueProps';
import {organizationJsonLd, JsonLd} from '~/lib/seo';

export const meta: Route.MetaFunction = ({location}) => {
  const url = location.pathname === '/' ? '/' : location.pathname;

  return [
    {title: 'Hydrogen | Home'},
    {name: 'description', content: 'B2B industrial supply and procurement'},
    // Open Graph
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: 'Industrial Supply Co.'},
    {property: 'og:description', content: 'B2B industrial supply and procurement'},
    {property: 'og:url', content: url},
    {property: 'og:site_name', content: 'Industrial Supply Co.'},
    // Twitter Card
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: 'Industrial Supply Co.'},
    {name: 'twitter:description', content: 'B2B industrial supply and procurement'},
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context}: Route.LoaderArgs) {
  const buyerVariables = await getBuyerVariables(context);

  // Fetch hero collection and nav collections in parallel
  const [heroResult, navResult] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY, {
      variables: {...buyerVariables},
      ...b2bCacheOptions(context.storefront, buyerVariables),
    }),
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: {...buyerVariables},
      ...b2bCacheOptions(context.storefront, buyerVariables),
    }),
  ]);

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    featuredCollection: heroResult.collections.nodes[0],
    collections: navResult.collections.nodes,
  };
}

function loadDeferredData({context}: Route.LoaderArgs) {
  const recommendedProducts = getBuyerVariables(context)
    .then((buyerVariables) =>
      context.storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
        variables: {...buyerVariables},
        ...b2bCacheOptions(context.storefront, buyerVariables),
      }),
    )
    .catch((error: Error) => {
      logger.warn('Recommended products query failed', undefined, error);
      return null;
    });

  return {recommendedProducts};
}

export default function Homepage() {
  const {featuredCollection, collections, recommendedProducts} =
    useLoaderData<typeof loader>();

  const jsonLd = organizationJsonLd({
    name: 'Industrial Supply Co.',
    url: 'https://industrial-supply.com',
    logo: 'https://industrial-supply.com/logo.png',
    contactPoint: {
      telephone: '+1-800-555-0123',
      email: 'sales@industrial-supply.com',
    },
  });

  return (
    <div className="home">
      <JsonLd data={jsonLd} />
      <Hero collection={featuredCollection} />
      <CategoryNav collections={collections as any} />
      <FeaturedProducts products={recommendedProducts} />
      <ValueProps />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GraphQL                                                            */
/* ------------------------------------------------------------------ */

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection(
    $country: CountryCode
    $language: LanguageCode
    $buyer: BuyerInput
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const COLLECTIONS_QUERY = `#graphql
  fragment CollectionNav on Collection {
    id
    title
    handle
    description
    image {
      id
      url
      altText
      width
      height
    }
  }
  query CollectionsNav(
    $country: CountryCode
    $language: LanguageCode
    $buyer: BuyerInput
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    collections(first: 8, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...CollectionNav
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    vendor
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts (
    $country: CountryCode
    $language: LanguageCode
    $buyer: BuyerInput
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
