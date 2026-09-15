import {
  data as remixData,
  Form,
  NavLink,
  Outlet,
  useLoaderData,
} from 'react-router';
import type {Route} from './+types/account';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';

export function shouldRevalidate() {
  return true;
}

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const {data, errors} = await customerAccount.query(CUSTOMER_DETAILS_QUERY, {
    variables: {
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw new Error('Customer not found');
  }

  return remixData(
    {customer: data.customer},
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    },
  );
}

export default function AccountLayout() {
  const {customer} = useLoaderData<typeof loader>();

  const heading = customer
    ? customer.firstName
      ? `Welcome, ${customer.firstName}`
      : `Welcome to your account`
    : 'Account Details';

  return (
    <div className="account-page">
      <div className="container-page">
        <h1 className="account-title">{heading}</h1>

        <div className="account-layout">
          <aside className="account-sidebar">
            <AccountMenu />
          </aside>

          <div className="account-main">
            <Outlet context={{customer}} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountMenu() {
  return (
    <nav className="account-nav" role="navigation" aria-label="Account">
      <NavLink
        className={({isActive}) =>
          `account-nav-link${isActive ? ' is-active' : ''}`
        }
        end
        to="/account"
      >
        Dashboard
      </NavLink>
      <NavLink
        className={({isActive}) =>
          `account-nav-link${isActive ? ' is-active' : ''}`
        }
        to="/account/orders"
      >
        Orders
      </NavLink>
      <NavLink
        className={({isActive}) =>
          `account-nav-link${isActive ? ' is-active' : ''}`
        }
        to="/account/addresses"
      >
        Addresses
      </NavLink>
      <NavLink
        className={({isActive}) =>
          `account-nav-link${isActive ? ' is-active' : ''}`
        }
        to="/account/profile"
      >
        Profile
      </NavLink>
      <div className="account-nav-logout">
        <Logout />
      </div>
    </nav>
  );
}

function Logout() {
  return (
    <Form className="account-logout" method="POST" action="/account/logout">
      <button className="btn btn-secondary btn-sm" type="submit">
        Sign out
      </button>
    </Form>
  );
}
