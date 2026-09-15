import {Suspense} from 'react';
import {Await, Link, NavLink} from 'react-router';
import type {FooterQuery, HeaderQuery} from 'storefrontapi.generated';
import {resolveMenuUrl, isExternalUrl} from '~/lib/menu';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

/**
 * Industrial footer: brand + contact info + multi-column link groups +
 * compliance strip.  Menu content comes from Shopify footer menu.
 */
export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="site-footer">
            <div className="container-page">
              {/* Top: brand + contact + link columns */}
              <div className="footer-top">
                <div className="footer-brand">
                  <Link className="footer-logo" to="/">
                    {header.shop.name}
                  </Link>
                  <p className="footer-tagline">
                    Industrial supply and B2B procurement for contractors,
                    fabricators and facility managers.
                  </p>
                </div>

                <div className="footer-contact">
                  <h3 className="footer-heading">Contact</h3>
                  <ul className="footer-contact-list">
                    <li>
                      <a href="tel:+18005550123">(800) 555-0123</a>
                    </li>
                    <li>
                      <a href="mailto:sales@industrial-supply.com">
                        sales@industrial-supply.com
                      </a>
                    </li>
                    <li>
                      <address>
                        123 Industrial Blvd<br />
                        Suite 400<br />
                        Manufacturing City, ST 12345
                      </address>
                    </li>
                  </ul>
                </div>

                {footer?.menu && (
                  <FooterMenu
                    menu={footer.menu}
                    primaryDomainUrl={header.shop.primaryDomain.url}
                    publicStoreDomain={publicStoreDomain}
                  />
                )}
              </div>

              {/* Bottom: copyright + compliance */}
              <div className="footer-bottom">
                <p className="footer-copyright">
                  © {new Date().getFullYear()} {header.shop.name}. All rights
                  reserved.
                </p>
                <ul className="footer-compliance">
                  <li>
                    <NavLink to="/policies/privacy-policy">
                      Privacy Policy
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/policies/terms-of-service">
                      Terms of Service
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/policies/shipping-policy">
                      Shipping Policy
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/policies/refund-policy">
                      Refund Policy
                    </NavLink>
                  </li>
                </ul>
              </div>
            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

function FooterMenu({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: FooterQuery['menu'];
  primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
  publicStoreDomain: string;
}) {
  const items = (menu || FALLBACK_FOOTER_MENU).items;

  /* Group menu items into columns for an industrial look.
     If the Shopify menu has nested items, render them as a single column;
     otherwise split top-level items into four columns. */
  const columns: Array<{title: string; items: typeof items}> = [];
  const ITEMS_PER_COLUMN = 4;

  if (items.length <= ITEMS_PER_COLUMN * 2) {
    /* Single column layout for short menus */
    columns.push({title: 'Quick links', items});
  } else {
    for (let i = 0; i < items.length; i += ITEMS_PER_COLUMN) {
      const slice = items.slice(i, i + ITEMS_PER_COLUMN);
      columns.push({
        title: `Links ${Math.floor(i / ITEMS_PER_COLUMN) + 1}`,
        items: slice,
      });
    }
  }

  return (
    <nav className="footer-nav" role="navigation">
      {columns.map((col) => (
        <div className="footer-column" key={`col-${col.title}`}>
          <h3 className="footer-heading">{col.title}</h3>
          <ul className="footer-links">
            {col.items.map((item) => {
              const url = resolveMenuUrl(item.url, {
                primaryDomainUrl,
                publicStoreDomain,
              });
              const external = isExternalUrl(url);
              return (
                <li key={item.id}>
                  {external ? (
                    <a href={url} rel="noopener noreferrer" target="_blank">
                      {item.title}
                    </a>
                  ) : (
                    <NavLink end prefetch="intent" to={url}>
                      {item.title}
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: [],
    },
  ],
};
