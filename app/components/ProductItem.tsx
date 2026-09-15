import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

export function ProductItem({
  product,
  loading,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const vendor = 'vendor' in product ? product.vendor : undefined;
  const sku =
    'variants' in product
      ? product.variants?.nodes?.[0]?.sku
      : undefined;

  return (
    <Link
      className="product-card"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="product-card-media">
        {image && (
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 300px, 50vw"
          />
        )}
      </div>

      <div className="product-card-body">
        {vendor && <p className="product-card-vendor">{vendor}</p>}
        <h4 className="product-card-title">{product.title}</h4>
        {sku && <p className="product-card-sku">SKU: {sku}</p>}
        <p className="product-card-price">
          <Money data={product.priceRange.minVariantPrice} />
        </p>
      </div>
    </Link>
  );
}
