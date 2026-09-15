import {Suspense} from 'react';
import {Await, Link, useAsyncValue} from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {CartApiQueryFragment, HeaderQuery} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {MainNavigation} from '~/components/layout/MainNavigation';
import {TopBar} from '~/components/layout/TopBar';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const {shop, menu} = header;

  return (
    <div className="site-header">
      <TopBar isLoggedIn={isLoggedIn} shop={shop} />

      <div className="header-main">
        <div className="container-page header-main-inner">
          <HeaderMenuMobileToggle />

          <Link className="brand" prefetch="intent" to="/">
            {shop.brand?.logo?.image?.url ? (
              <img
                alt={shop.name}
                height={32}
                src={shop.brand.logo.image.url}
                width={140}
              />
            ) : (
              <span className="brand-name">{shop.name}</span>
            )}
          </Link>

          <MainNavigation
            menu={menu}
            primaryDomainUrl={header.shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />

          <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
        </div>
      </div>
    </div>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      aria-label="Open menu"
      className="header-mobile-toggle reset"
      onClick={() => open('mobile')}
      type="button"
    >
      <span aria-hidden="true">☰</span>
    </button>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <div className="header-actions">
      <SearchToggle />
      <Suspense
        fallback={
          <Link className="header-action" to="/account">
            Sign in
          </Link>
        }
      >
        <Await
          resolve={isLoggedIn}
          errorElement={
            <Link className="header-action" to="/account">
              Sign in
            </Link>
          }
        >
          {(isLoggedIn) => (
            <Link className="header-action" to="/account">
              {isLoggedIn ? 'Account' : 'Sign in'}
            </Link>
          )}
        </Await>
      </Suspense>
      <CartToggle cart={cart} />
    </div>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      className="header-action reset"
      onClick={() => open('search')}
      type="button"
    >
      <span aria-hidden="true">⌕</span>
      Search
    </button>
  );
}

function CartBadge({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <a
      className="header-cart"
      href="/cart"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
    >
      Cart <span aria-label={`(items: ${count})`}>{count}</span>
    </a>
  );
}

function CartToggle({cart}: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}
