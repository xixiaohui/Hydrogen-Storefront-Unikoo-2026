import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';
type NavCollection = {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  image?: {
    id: string;
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

/**
 * Quick category navigation rendered from Shopify collections.
 * Merchandising decides which collections appear (most recently updated).
 */
export function CategoryNav({collections}: {collections: NavCollection[]}) {
  if (!collections?.length) return null;

  return (
    <section className="category-nav section">
      <div className="container-page">
        <div className="section-heading">
          <h2>Shop by category</h2>
          <Link className="link-brand" to="/collections">
            View all
          </Link>
        </div>

        <div className="category-grid">
          {collections.map((collection) => {
            const image = collection.image;
            return (
              <Link
                className="category-card"
                key={collection.id}
                to={`/collections/${collection.handle}`}
              >
                <div className="category-card-media">
                  {image && (
                    <Image
                      alt={image.altText || collection.title}
                      aspectRatio="4/3"
                      data={image}
                      sizes="(min-width: 48em) 25vw, 50vw"
                    />
                  )}
                </div>
                <div className="category-card-body">
                  <h3 className="category-card-title">{collection.title}</h3>
                  {collection.description && (
                    <p className="category-card-copy">
                      {collection.description.slice(0, 80)}
                      {collection.description.length > 80 ? '…' : ''}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
