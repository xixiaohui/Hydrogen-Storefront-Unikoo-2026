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
 * Clicking a thumbnail swaps the main image. Keyboard navigable:
 * Left/Right arrows move between images when the gallery is focused.
 */
export function ProductGallery({media}: {media: GalleryImage[]}) {
  const images = media;

  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (!images.length) {
    return <div className="product-gallery-main empty" />;
  }

  const goTo = (index: number) => {
    setActiveIndex((index + images.length) % images.length);
  };

  const handleThumbKeyDown = (
    event: React.KeyboardEvent,
    index: number,
  ) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index + 1);
    }
  };

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        {active?.image && (
          <Image
            alt={active.image.altText || ''}
            aspectRatio="1/1"
            data={active.image}
            key={active.image.id}
            loading="eager"
            sizes="(min-width: 62em) 45vw, 100vw"
          />
        )}
      </div>

      {images.length > 1 && (
        <div
          className="product-gallery-thumbs"
          role="group"
          aria-label="Product image thumbnails"
        >
          {images.map((item, index) => (
            <button
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={`product-gallery-thumb${index === activeIndex ? ' is-active' : ''}`}
              key={item.image.id}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => handleThumbKeyDown(event, index)}
              type="button"
            >
              <Image
                alt=""
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
