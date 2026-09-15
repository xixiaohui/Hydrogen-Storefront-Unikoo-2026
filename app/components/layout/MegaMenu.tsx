import {Link} from 'react-router';
import {resolveMenuUrl, type MenuItem} from '~/lib/menu';

/**
 * Desktop mega menu panel. Children come from the Shopify `main-menu`
 * navigation, so adding a column is a merchandising task, not a code change.
 */
export function MegaMenu({
  item,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  item: MenuItem;
  primaryDomainUrl: string;
  publicStoreDomain: string;
}) {
  const children = item.items ?? [];

  return (
    <div className="mega-menu" role="group" aria-label={item.title}>
      <div className="container-page mega-menu-inner">
        <div className="mega-menu-columns">
          <div className="mega-menu-column">
            <p className="mega-menu-heading">{item.title}</p>
            <ul>
              {children.map((child) => (
                <li key={child.id}>
                  <Link
                    to={resolveMenuUrl(child.url, {
                      primaryDomainUrl,
                      publicStoreDomain,
                    })}
                  >
                    {child.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {children.length === 0 && (
            <p className="mega-menu-empty text-muted">
              No subcategories configured yet.
            </p>
          )}
        </div>

        {item.url && (
          <Link
            className="mega-menu-featured"
            to={resolveMenuUrl(item.url, {
              primaryDomainUrl,
              publicStoreDomain,
            })}
          >
            <span className="mega-menu-featured-title">Shop all {item.title}</span>
            <span className="mega-menu-featured-copy">
              Browse the full range, specifications and technical documents.
            </span>
            <span className="link-brand">View category →</span>
          </Link>
        )}
      </div>
    </div>
  );
}
