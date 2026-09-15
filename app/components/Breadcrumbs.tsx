import {Link} from 'react-router';

export type Crumb = {
  label: string;
  to?: string;
};

/**
 * Breadcrumb trail. Collections derive their trail from the URL; static pages
 * pass their own crumbs.
 */
export function Breadcrumbs({crumbs}: {crumbs: Crumb[]}) {
  if (!crumbs.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <Link to="/">Home</Link>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <span key={`${crumb.label}-${crumb.to ?? 'current'}`}>
            <span aria-hidden="true"> / </span>
            {isLast || !crumb.to ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link to={crumb.to}>{crumb.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
