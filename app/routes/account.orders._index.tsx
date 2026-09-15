import {useRef} from 'react';
import {
  Link,
  useLoaderData,
  useSearchParams,
} from 'react-router';
import type {Route} from './+types/account.orders._index';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
  type OrderFilterParams,
} from '~/lib/orderFilters';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from 'customer-accountapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

type OrdersLoaderData = {
  customer: CustomerOrdersFragment;
  filters: OrderFilterParams;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Orders'}];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return {customer: data.customer, filters};
}

export default function Orders() {
  const {customer, filters} = useLoaderData<OrdersLoaderData>();
  const {orders} = customer;

  return (
    <div className="account-orders">
      <div className="section-heading">
        <h2>Orders</h2>
      </div>

      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

function OrdersTable({
  orders,
  filters,
}: {
  orders: CustomerOrdersFragment['orders'];
  filters: OrderFilterParams;
}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div className="account-orders-table" aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection connection={orders}>
          {({node: order}) => <OrderRow key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

function EmptyOrders({hasFilters = false}: {hasFilters?: boolean}) {
  return (
    <div className="account-orders-empty">
      {hasFilters ? (
        <>
          <p>No orders found matching your search.</p>
          <Link className="link-brand" to="/account/orders">
            Clear filters →
          </Link>
        </>
      ) : (
        <>
          <p>You haven&apos;t placed any orders yet.</p>
          <Link className="link-brand" to="/collections">
            Start shopping →
          </Link>
        </>
      )}
    </div>
  );
}

function OrderSearchForm({
  currentFilters,
}: {
  currentFilters: OrderFilterParams;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();

    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);

    setSearchParams(params);
  };

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="order-search-form"
      aria-label="Search orders"
    >
      <div className="order-search-inputs">
        <input
          className="input order-search-input"
          type="search"
          name={ORDER_FILTER_FIELDS.NAME}
          placeholder="Order #"
          aria-label="Order number"
          defaultValue={currentFilters.name || ''}
        />
        <input
          className="input order-search-input"
          type="search"
          name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
          placeholder="Confirmation #"
          aria-label="Confirmation number"
          defaultValue={currentFilters.confirmationNumber || ''}
        />
        <button className="btn btn-secondary" type="submit">
          Search
        </button>
        {hasFilters && (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setSearchParams(new URLSearchParams());
              formRef.current?.reset();
            }}
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}

function OrderRow({order}: {order: OrderItemFragment}) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;

  return (
    <Link
      className="account-order-row"
      to={`/account/orders/${btoa(order.id)}`}
    >
      <div className="account-order-cell">
        <strong>#{order.number}</strong>
        <span className="account-order-date">
          {new Date(order.processedAt).toLocaleDateString()}
        </span>
      </div>

      <div className="account-order-cell">
        <span className="badge badge-success">{order.financialStatus}</span>
        {fulfillmentStatus && (
          <span className="badge">{fulfillmentStatus}</span>
        )}
      </div>

      <div className="account-order-cell account-order-total">
        <Money data={order.totalPrice} />
      </div>

      <div className="account-order-cell">
        <span className="link-brand">View →</span>
      </div>
    </Link>
  );
}
