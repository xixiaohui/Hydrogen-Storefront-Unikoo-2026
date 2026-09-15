import {Link, useLoaderData, useOutletContext} from 'react-router';
import type {Route} from './+types/account._index';
import {getPaginationVariables} from '@shopify/hydrogen';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import type {
  CustomerOrdersFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Account Dashboard'}];
};

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(new Request('http://localhost/account'), {
    pageBy: 5,
  });

  const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query: '',
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return {customer: data.customer};
}

export default function AccountDashboard() {
  const {customer: ordersCustomer} = useLoaderData<{
    customer: CustomerOrdersFragment;
  }>();
  const {customer} = useOutletContext<{customer: CustomerFragment}>();
  const orders = ordersCustomer.orders;

  const recentOrders = orders?.nodes?.slice(0, 5) ?? [];
  const totalOrders = orders?.nodes?.length ?? 0;

  return (
    <div className="account-dashboard">
      {/* Welcome header */}
      <div className="account-welcome">
        <h2>
          Welcome back
          {customer.firstName ? `, ${customer.firstName}` : ''}
        </h2>
        <p className="account-welcome-sub">
          Manage your orders, addresses and account settings.
        </p>
      </div>

      {/* Quick actions */}
      <div className="account-quick-actions">
        <Link className="btn btn-primary" to="/quick-order">
          Quick Order
        </Link>
        <Link className="btn btn-secondary" to="/account/orders">
          View all orders
        </Link>
        <Link className="btn btn-secondary" to="/account/addresses">
          Manage addresses
        </Link>
        <Link className="btn btn-secondary" to="/account/profile">
          Edit profile
        </Link>
      </div>

      {/* Stats */}
      <div className="account-stats">
        <div className="account-stat">
          <p className="account-stat-value">{totalOrders}</p>
          <p className="account-stat-label">Total orders</p>
        </div>
        <div className="account-stat">
          <p className="account-stat-value">
            {customer.addresses?.nodes?.length ?? 0}
          </p>
          <p className="account-stat-label">Saved addresses</p>
        </div>
        <div className="account-stat">
          <p className="account-stat-value">
            {customer.defaultAddress ? 'Yes' : 'No'}
          </p>
          <p className="account-stat-label">Default address set</p>
        </div>
      </div>

      {/* Recent orders */}
      <div className="account-recent-orders">
        <div className="section-heading">
          <h3>Recent orders</h3>
          {totalOrders > 5 && (
            <Link className="link-brand" to="/account/orders">
              View all
            </Link>
          )}
        </div>

        {recentOrders.length > 0 ? (
          <div className="account-orders-list">
            {recentOrders.map((order) => (
              <Link
                className="account-order-card"
                key={order.id}
                to={`/account/orders/${btoa(order.id)}`}
              >
                <div className="account-order-card-header">
                  <strong>#{order.number}</strong>
                  <span className="badge badge-success">
                    {order.financialStatus}
                  </span>
                </div>
                <p className="account-order-date">
                  {new Date(order.processedAt).toLocaleDateString()}
                </p>
                <p className="account-order-total">
                  {order.totalPrice.currencyCode} {order.totalPrice.amount}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted">
            No orders yet.{' '}
            <Link className="link-brand" to="/collections">
              Start shopping →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
