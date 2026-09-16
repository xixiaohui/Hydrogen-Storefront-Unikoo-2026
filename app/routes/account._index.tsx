import {Link, useLoaderData, useOutletContext} from 'react-router';
import type {Route} from './+types/account._index';
import {getPaginationVariables} from '@shopify/hydrogen';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import {CUSTOMER_DRAFT_ORDERS_QUERY} from '~/graphql/customer-account/CustomerDraftOrdersQuery';
import {CUSTOMER_COMPANY_CONTACTS_QUERY} from '~/graphql/customer-account/CustomerCompanyContactsQuery';
import type {
  CustomerOrdersFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';
import {DraftOrders, type DraftOrderItem} from '~/components/account/DraftOrders';
import {TeamMembers, type TeamMember} from '~/components/account/TeamMembers';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Account Dashboard'}];
};

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(
    new Request('http://localhost/account'),
    {pageBy: 5},
  );

  const {data: ordersData, errors: ordersErrors} = await customerAccount.query(
    CUSTOMER_ORDERS_QUERY,
    {
      variables: {
        ...paginationVariables,
        query: '',
        language: customerAccount.i18n.language,
      },
    },
  );

  if (ordersErrors?.length || !ordersData?.customer) {
    throw Error('Customer orders not found');
  }

  // Load B2B data in parallel; failures are non-fatal
  const [draftOrdersResult, contactsResult] = await Promise.allSettled([
    customerAccount.query(CUSTOMER_DRAFT_ORDERS_QUERY, {
      variables: {first: 5, language: customerAccount.i18n.language},
    }),
    customerAccount.query(CUSTOMER_COMPANY_CONTACTS_QUERY, {
      variables: {first: 10, language: customerAccount.i18n.language},
    }),
  ]);

  const draftOrders: DraftOrderItem[] =
    draftOrdersResult.status === 'fulfilled'
      ? ((draftOrdersResult.value?.data?.customer?.draftOrders?.nodes ??
          []) as DraftOrderItem[])
      : [];

  const contacts: TeamMember[] =
    contactsResult.status === 'fulfilled'
      ? ((contactsResult.value?.data?.customer?.companyContacts?.nodes ??
          []) as TeamMember[])
      : [];

  return {
    customer: ordersData.customer,
    draftOrders,
    contacts,
  };
}

export default function AccountDashboard() {
  const {customer: ordersCustomer, draftOrders, contacts} =
    useLoaderData<typeof loader>();
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
        <Link className="btn btn-secondary" to="/quote">
          Request a Quote
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
          <p className="account-stat-value">{draftOrders.length}</p>
          <p className="account-stat-label">Pending approvals</p>
        </div>
        <div className="account-stat">
          <p className="account-stat-value">{contacts.length}</p>
          <p className="account-stat-label">Team members</p>
        </div>
      </div>

      {/* Pending approvals (B2B draft orders) */}
      <DraftOrders orders={draftOrders} />

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

      {/* Team members (company contacts) */}
      <TeamMembers contacts={contacts} />
    </div>
  );
}
