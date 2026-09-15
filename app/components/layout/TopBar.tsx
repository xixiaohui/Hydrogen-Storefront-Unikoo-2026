import {Suspense} from 'react';
import {Await, Link} from 'react-router';
import {useAside} from '~/components/Aside';
import {useB2BLocation} from '~/components/B2BLocationProvider';
import type {HeaderQuery} from 'storefrontapi.generated';

/**
 * Utility bar above the main header: account state, B2B company / location
 * context and the shortcuts B2B buyers use most (quick order, quote).
 */
export function TopBar({
  isLoggedIn,
  shop,
}: {
  isLoggedIn: Promise<boolean>;
  shop: HeaderQuery['shop'];
}) {
  return (
    <div className="site-topbar">
      <div className="container-page site-topbar-inner">
        <p className="site-topbar-note">{shop.description || shop.name}</p>

        <div className="site-topbar-actions">
          <Suspense fallback={null}>
            <Await resolve={isLoggedIn} errorElement={null}>
              {(isLoggedIn) => (isLoggedIn ? <B2BContext /> : null)}
            </Await>
          </Suspense>

          <Suspense fallback={<Link to="/account">Sign in</Link>}>
            <Await resolve={isLoggedIn} errorElement={<Link to="/account">Sign in</Link>}>
              {(isLoggedIn) => (
                <Link to="/account">
                  {isLoggedIn ? 'My account' : 'Sign in / Register'}
                </Link>
              )}
            </Await>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function B2BContext() {
  const {company, companyLocationId} = useB2BLocation();
  const {open} = useAside();

  if (!company) return null;

  const locations = (company.locations?.edges ?? []).map(({node}) => node);
  const current = locations.find(({id}) => id === companyLocationId);

  return (
    <div className="site-topbar-b2b">
      <span className="site-topbar-company">{company.name}</span>
      {locations.length > 1 && (
        <button
          className="site-topbar-location reset"
          onClick={() => open('location')}
          type="button"
        >
          Ship to: <strong>{current?.name ?? 'Select location'}</strong>
        </button>
      )}
    </div>
  );
}
