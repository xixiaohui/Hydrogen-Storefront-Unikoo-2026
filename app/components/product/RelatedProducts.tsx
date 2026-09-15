import {Suspense} from 'react';
import {Await, Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {ProductRecommendationsQuery} from 'storefrontapi.generated';

/**
 * Shopify product recommendations ("Customers also viewed").
 *
 * The query is deferred so it does not block the critical render path.
 */
export function RelatedProducts({
  recommendations,
}: {
  recommendations: Promise<ProductRecommendationsQuery | null>;
}) {
  return (
    <section className="related-products section">
      <div className="container-page">
        <div className="section-heading">
          <h2>Related Products</h2>
        </div>

        <Suspense fallback={<p className="text-muted">Loading recommendations…</p>}>
          <Await resolve={recommendations}>
            {(data) => {
              const nodes = data?.productRecommendations ?? [];
              if (!nodes.length) return null;

              return (
                <div className="products-grid">
                  {nodes.map((product) => {
                    const image = product.featuredImage;
                    const price = product.priceRange?.minVariantPrice;
                    return (
                      <Link
                        className="product-card"
                        key={product.id}
                        prefetch="intent"
                        to={`/products/${product.handle}`}
                      >
                        <div className="product-card-media">
                          {image && (
                            <Image
                              alt={image.altText || product.title}
                              aspectRatio="1/1"
                              data={image}
                              loading="lazy"
                              sizes="(min-width: 45em) 300px, 50vw"
                            />
                          )}
                        </div>
                        <div className="product-card-body">
                          {product.vendor && (
                            <p className="product-card-vendor">
                              {product.vendor}
                            </p>
                          )}
                          <h4 className="product-card-title">
                            {product.title}
                          </h4>
                          {price && (
                            <p className="product-card-price">
                              <Money data={price} />
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            }}
          </Await>
        </Suspense>
      </div>
    </section>
  );
}
