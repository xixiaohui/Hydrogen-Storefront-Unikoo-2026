import {Suspense} from 'react';
import {Await, Link} from 'react-router';
import type {RecommendedProductsQuery} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';

/**
 * Featured / best-selling products.  Deferred so the critical render path
 * stays fast; the section renders when data arrives.
 */
export function FeaturedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  return (
    <section className="featured-products section">
      <div className="container-page">
        <div className="section-heading">
          <h2>Featured products</h2>
          <Link className="link-brand" to="/collections/all">
            View all products
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="products-grid">
              {['skel-0', 'skel-1', 'skel-2', 'skel-3'].map((key) => (
                <div className="product-card product-card-skeleton" key={key} />
              ))}
            </div>
          }
        >
          <Await resolve={products}>
            {(data) => {
              const nodes = data?.products?.nodes ?? [];
              if (!nodes.length) return null;

              return (
                <div className="products-grid">
                  {nodes.map((product) => (
                    <ProductItem
                      key={product.id}
                      product={product}
                      loading="lazy"
                    />
                  ))}
                </div>
              );
            }}
          </Await>
        </Suspense>
      </div>
    </section>
  );
}
