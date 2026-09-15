import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
import type {FeaturedCollectionFragment} from 'storefrontapi.generated';

/**
 * Industrial hero banner: large collection image with overlay, brand copy,
 * and primary CTA.  Uses the most recently updated collection as the visual.
 */
export function Hero({collection}: {collection?: FeaturedCollectionFragment}) {
  const image = collection?.image;

  return (
    <section className="hero">
      <div className="hero-media">
        {image && (
          <Image
            alt={image.altText || collection?.title || 'Hero'}
            className="hero-image"
            data={image}
            sizes="100vw"
          />
        )}
        <div className="hero-overlay" />
      </div>

      <div className="container-page hero-content">
        <p className="hero-eyebrow">Industrial Supply &amp; B2B Procurement</p>
        <h1 className="hero-title">
          Built for professionals.
          <br />
          Priced for volume.
        </h1>
        <p className="hero-copy">
          Contract pricing, volume discounts and technical support for
          contractors, fabricators and facility managers.
        </p>
        <div className="hero-actions">
          <Link
            className="btn btn-primary btn-lg"
            to={collection?.handle ? `/collections/${collection.handle}` : '/collections/all'}
          >
            Shop products
          </Link>
          <Link className="btn btn-secondary btn-lg" to="/account">
            Request a quote
          </Link>
        </div>
      </div>
    </section>
  );
}
