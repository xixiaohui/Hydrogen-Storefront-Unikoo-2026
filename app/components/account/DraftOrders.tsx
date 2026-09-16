import {Money} from '@shopify/hydrogen';

export type DraftOrderItem = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  totalPrice: {amount: string; currencyCode: string};
};

/**
 * Pending approval draft orders, loaded server-side in account._index.
 * Actual approval happens in Shopify Admin (no mutation available).
 */
export function DraftOrders({orders}: {orders: DraftOrderItem[]}) {
  if (!orders.length) return null;

  return (
    <div className="account-draft-orders">
      <div className="section-heading">
        <h3>Pending approvals</h3>
        <span className="badge badge-brand">{orders.length}</span>
      </div>

      <p className="account-draft-orders-note text-muted">
        These orders require approval from your company administrator before
        they are submitted.
      </p>

      <div className="account-draft-orders-list">
        {orders.map((order) => (
          <div className="card account-draft-order" key={order.id}>
            <div className="card-body">
              <div className="account-draft-order-header">
                <strong>{order.name}</strong>
                <span className="badge badge-warning">{order.status}</span>
              </div>
              <p className="account-draft-order-date">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <p className="account-draft-order-total">
                {order.totalPrice.currencyCode} {order.totalPrice.amount}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
