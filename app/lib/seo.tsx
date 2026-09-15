/**
 * SEO utilities: JSON-LD structured data builders.
 */

export interface ProductStructuredData {
  name: string;
  url: string;
  image?: string;
  description?: string;
  sku?: string;
  brand?: string;
  price?: {amount: string; currencyCode: string};
  availability?: 'InStock' | 'OutOfStock';
}

export function productJsonLd(data: ProductStructuredData) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    url: data.url,
  };

  if (data.image) jsonLd.image = data.image;
  if (data.description) jsonLd.description = data.description;
  if (data.sku) jsonLd.sku = data.sku;
  if (data.brand) {
    jsonLd.brand = {
      '@type': 'Brand',
      name: data.brand,
    };
  }

  if (data.price) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: data.price.amount,
      priceCurrency: data.price.currencyCode,
      availability: data.availability
        ? `https://schema.org/${data.availability}`
        : 'https://schema.org/InStock',
      url: data.url,
    };
  }

  return jsonLd;
}

export function organizationJsonLd({
  name,
  url,
  logo,
  contactPoint,
}: {
  name: string;
  url: string;
  logo?: string;
  contactPoint?: {telephone?: string; email?: string};
}) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
  };

  if (logo) jsonLd.logo = logo;

  if (contactPoint) {
    jsonLd.contactPoint = {
      '@type': 'ContactPoint',
      telephone: contactPoint.telephone,
      email: contactPoint.email,
      contactType: 'customer service',
    };
  }

  return jsonLd;
}

export function breadcrumbJsonLd(
  items: Array<{name: string; url: string}>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function collectionJsonLd({
  name,
  url,
  description,
  image,
}: {
  name: string;
  url: string;
  description?: string;
  image?: string;
}) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url,
  };

  if (description) jsonLd.description = description;
  if (image) jsonLd.image = image;

  return jsonLd;
}

/**
 * Renders a <script type="application/ld+json"> tag.
 */
export function JsonLd({data}: {data: Record<string, unknown>}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: JSON.stringify(data)}}
    />
  );
}
