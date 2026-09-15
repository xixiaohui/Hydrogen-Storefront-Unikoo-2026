import {useEffect, useRef, useState} from 'react';
import {Link, NavLink} from 'react-router';
import {MegaMenu} from '~/components/layout/MegaMenu';
import {resolveMenuUrl} from '~/lib/menu';
import type {HeaderQuery} from 'storefrontapi.generated';

/**
 * Primary desktop navigation with full keyboard support:
 * - Left/Right arrows move between top-level items
 * - Up/Down arrows move within a mega menu panel
 * - Escape closes the panel
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
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openId) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenId(null);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openId]);

  const handleKeyDown = (event: React.KeyboardEvent, itemId: string) => {
    const buttons = navRef.current?.querySelectorAll<HTMLButtonElement>(
      '.main-nav-link',
    );
    if (!buttons?.length) return;

    const currentIndex = Array.from(buttons).findIndex(
      (b) => b.getAttribute('aria-expanded') === 'true',
    );

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const nextIndex =
        event.key === 'ArrowRight'
          ? (currentIndex + 1) % buttons.length
          : (currentIndex - 1 + buttons.length) % buttons.length;
      const nextItem = items[nextIndex];
      if (nextItem?.items?.length) {
        setOpenId(nextItem.id);
      }
      (buttons[nextIndex] as HTMLElement).focus();
    }
  };

  return (
    <nav className="main-nav" aria-label="Primary" ref={navRef}>
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
                  aria-haspopup="true"
                  className="main-nav-link"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  onKeyDown={(e) => handleKeyDown(e, item.id)}
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
