import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/products.$handle';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductForm} from '~/components/ProductForm';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import type {BuyerVariables} from '~/lib/b2b';
import {b2bCacheOptions, getBuyerVariables} from '~/lib/b2b';
import {QuantityRules, hasQuantityRules} from '~/components/QuantityRules';
import {PriceBreaks} from '~/components/PriceBreaks';
import {Breadcrumbs} from '~/components/Breadcrumbs';
import {ProductGallery} from '~/components/product/ProductGallery';
import {ProductB2BInfo} from '~/components/product/ProductB2BInfo';
import {ProductSpecs} from '~/components/product/ProductSpecs';
import {ProductDocuments} from '~/components/product/ProductDocuments';
import {RelatedProducts} from '~/components/product/RelatedProducts';

export const meta: Route.MetaFunction = ({data}) => {
  return [
    {title: `Hydrogen | ${data?.product.title ?? ''}`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const buyerVariables = await getBuyerVariables(args.context);
  const deferredData = loadDeferredData({...args, buyerVariables});
  const criticalData = await loadCriticalData({...args, buyerVariables});
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({
  context,
  params,
  request,
  buyerVariables,
}: Route.LoaderArgs & {buyerVariables: BuyerVariables}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {
        handle,
        selectedOptions: getSelectedProductOptions(request),
        ...buyerVariables,
      },
      ...b2bCacheOptions(storefront, buyerVariables),
    }),
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: product});

  return {product};
}

function loadDeferredData({
  context,
  params,
  buyerVariables,
}: Route.LoaderArgs & {buyerVariables: BuyerVariables}) {
  const {storefront} = context;
  const productId = params.handle
    ? `gid://shopify/Product/${params.handle}`
    : undefined;

  const recommendations = productId
    ? storefront
        .query(PRODUCT_RECOMMENDATIONS_QUERY, {
          variables: {productId, ...buyerVariables},
          ...b2bCacheOptions(storefront, buyerVariables),
        })
        .catch((err: Error) => {
          console.error('Recommendations error:', err);
          return null;
        })
    : Promise.resolve(null);

  return {recommendations};
}

export default function Product() {
  const {product, recommendations} = useLoaderData<typeof loader>();

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml, vendor, tags} = product;
  const metafields = (product.metafields ?? []).filter(Boolean) as Array<{
    namespace: string;
    key: string;
    value: string;
  }>;
  const sku = selectedVariant?.sku;
  const media = (product.media?.nodes ?? [])
    .filter((n) => Boolean(n.image))
    .map((n) => ({image: n.image!})) as any;

  return (
    <div className="product-page">
      <div className="container-page">
        <Breadcrumbs
          crumbs={[
            {label: 'Products', to: '/collections/all'},
            {label: title},
          ]}
        />

        <div className="product-layout">
          <div className="product-gallery-col">
            <ProductGallery media={media} />
          </div>

          <div className="product-detail-col">
            <ProductB2BInfo
              vendor={vendor}
              sku={sku}
              availableForSale={selectedVariant?.availableForSale ?? false}
            />

            <h1 className="product-title">{title}</h1>

            <ProductPrice
              price={selectedVariant?.price}
              compareAtPrice={selectedVariant?.compareAtPrice}
            />

            <ProductForm
              productOptions={productOptions}
              selectedVariant={selectedVariant}
              quantity={
                selectedVariant?.quantityRule?.minimum ||
                selectedVariant?.quantityRule?.increment ||
                1
              }
            />

            {hasQuantityRules(selectedVariant?.quantityRule) && (
              <QuantityRules
                maximum={selectedVariant?.quantityRule?.maximum}
                minimum={selectedVariant?.quantityRule?.minimum}
                increment={selectedVariant?.quantityRule?.increment}
              />
            )}

            {selectedVariant?.quantityPriceBreaks?.nodes &&
              selectedVariant.quantityPriceBreaks.nodes.length > 0 && (
                <PriceBreaks
                  priceBreaks={selectedVariant.quantityPriceBreaks.nodes}
                />
              )}

            {descriptionHtml && (
              <div className="product-description">
                <h2 className="section-heading">
                  <span>Description</span>
                </h2>
                <div
                  dangerouslySetInnerHTML={{__html: descriptionHtml}}
                />
              </div>
            )}

            <ProductDocuments metafields={metafields} />

            {tags && tags.length > 0 && (
              <div className="product-tags">
                <span className="label">Tags</span>
                <div className="product-tags-list">
                  {tags.map((tag) => (
                    <span className="badge" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <ProductSpecs metafields={metafields} />
      </div>

      <RelatedProducts recommendations={recommendations} />

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GraphQL                                                            */
/* ------------------------------------------------------------------ */

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    quantityRule {
      maximum
      minimum
      increment
    }
    quantityPriceBreaks(first: 5) {
      nodes {
        minimumQuantity
        price {
          amount
          currencyCode
        }
      }
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
` as const;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    tags
    encodedVariantExistence
    encodedVariantAvailability
    media(first: 10) {
      nodes {
        ... on MediaImage {
          image {
            id
            url
            altText
            width
            height
          }
        }
      }
    }
    metafields(identifiers: [
      {namespace: "custom", key: "specifications"},
      {namespace: "custom", key: "documents"}
    ]) {
      namespace
      key
      value
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
` as const;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $buyer: BuyerInput
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
` as const;

const PRODUCT_RECOMMENDATIONS_FRAGMENT = `#graphql
  fragment ProductRecommendation on Product {
    id
    title
    vendor
    handle
    featuredImage {
      id
      url
      altText
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
` as const;

const PRODUCT_RECOMMENDATIONS_QUERY = `#graphql
  query ProductRecommendations(
    $country: CountryCode
    $language: LanguageCode
    $buyer: BuyerInput
    $productId: ID!
  ) @inContext(country: $country, language: $language, buyer: $buyer) {
    productRecommendations(productId: $productId) {
      ...ProductRecommendation
    }
  }
  ${PRODUCT_RECOMMENDATIONS_FRAGMENT}
` as const;
