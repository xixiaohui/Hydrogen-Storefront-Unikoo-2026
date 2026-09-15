import {useState} from 'react';
import {Link, NavLink} from 'react-router';
import {resolveMenuUrl} from '~/lib/menu';
import type {HeaderQuery} from 'storefrontapi.generated';

/**
 * Mobile navigation rendered inside the `Aside` drawer: accordion per top
 * level item, so deep catalogs stay scannable on small screens.
 */
export function MobileMenu({
  menu,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: HeaderQuery['menu'];
  primaryDomainUrl: string;
  publicStoreDomain: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const items = menu?.items ?? [];

  return (
    <nav className="mobile-nav" aria-label="Mobile">
      <ul>
        <li>
          <NavLink end prefetch="intent" to="/">
            Home
          </NavLink>
        </li>

        {items.map((item) => {
          const url = resolveMenuUrl(item.url, {
            primaryDomainUrl,
            publicStoreDomain,
          });
          const hasChildren = Boolean(item.items?.length);
          const isOpen = openId === item.id;

          return (
            <li key={item.id} className="mobile-nav-item">
              <div className="mobile-nav-row">
                <NavLink end prefetch="intent" to={url}>
                  {item.title}
                </NavLink>

                {hasChildren && (
                  <button
                    aria-expanded={isOpen}
                    aria-label={`Toggle ${item.title} subcategories`}
                    className="reset mobile-nav-toggle"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    type="button"
                  >
                    {isOpen ? '−' : '+'}
                  </button>
                )}
              </div>

              {hasChildren && isOpen && (
                <ul className="mobile-nav-children">
                  {item.items!.map((child) => (
                    <li key={child.id}>
                      <NavLink
                        end
                        prefetch="intent"
                        to={resolveMenuUrl(child.url, {
                          primaryDomainUrl,
                          publicStoreDomain,
                        })}
                      >
                        {child.title}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
