import {useEffect, useState} from 'react';
import {Link, NavLink} from 'react-router';
import {MegaMenu} from '~/components/layout/MegaMenu';
import {resolveMenuUrl} from '~/lib/menu';
import type {HeaderQuery} from 'storefrontapi.generated';

/**
 * Primary desktop navigation. Two levels are supported, matching what the
 * Shopify `main-menu` navigation exposes. Panels open on hover/focus and are
 * fully keyboard operable (toggle with Enter/Space, close with Escape).
 */
export function MainNavigation({
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

  useEffect(() => {
    if (!openId) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenId(null);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openId]);

  return (
    <nav className="main-nav" aria-label="Primary">
      <ul>
        {items.map((item) => {
          const url = resolveMenuUrl(item.url, {
            primaryDomainUrl,
            publicStoreDomain,
          });
          const hasChildren = Boolean(item.items?.length);
          const isOpen = openId === item.id;

          return (
            <li
              key={item.id}
              className="main-nav-item"
              onMouseEnter={() => setOpenId(hasChildren ? item.id : null)}
              onMouseLeave={() => setOpenId(null)}
            >
              {hasChildren ? (
                <button
                  aria-expanded={isOpen}
                  className="main-nav-link"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  type="button"
                >
                  {item.title}
                  <span aria-hidden="true" className="main-nav-caret">
                    ▾
                  </span>
                </button>
              ) : (
                <NavLink
                  className="main-nav-link"
                  end
                  prefetch="intent"
                  to={url}
                >
                  {item.title}
                </NavLink>
              )}

              {hasChildren && isOpen && (
                <MegaMenu
                  item={item}
                  primaryDomainUrl={primaryDomainUrl}
                  publicStoreDomain={publicStoreDomain}
                />
              )}
            </li>
          );
        })}

        {items.length === 0 && (
          <li>
            <Link className="main-nav-link" to="/collections">
              Shop all
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
