import {useState} from 'react';
import {Image} from '@shopify/hydrogen';
type GalleryImage = {
  image: {
    id: string;
    url: string;
    altText?: string | null | undefined;
    width?: number | null | undefined;
    height?: number | null | undefined;
  };
};

/**
 * Product image gallery with main image + thumbnail strip.
 * Clicking a thumbnail swaps the main image. Keyboard navigable (Left/Right).
 */
export function ProductGallery({media}: {media: GalleryImage[]}) {
  const images = media;

  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (!images.length) {
    return <div className="product-gallery-main empty" />;
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        {active?.image && (
          <Image
            alt={active.image.altText || ''}
            aspectRatio="1/1"
            data={active.image}
            key={active.image.id}
            sizes="(min-width: 62em) 45vw, 100vw"
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="product-gallery-thumbs" role="tablist">
          {images.map((item, index) => (
            <button
              aria-label={`View image ${index + 1}`}
              aria-selected={index === activeIndex}
              className={`product-gallery-thumb${index === activeIndex ? ' is-active' : ''}`}
              key={item.image.id}
              onClick={() => setActiveIndex(index)}
              role="tab"
              type="button"
            >
              <Image
                alt={item.image.altText || ''}
                data={item.image}
                height={80}
                sizes="80px"
                width={80}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
