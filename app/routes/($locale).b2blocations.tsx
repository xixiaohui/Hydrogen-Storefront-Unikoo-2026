import type {Route} from './+types/b2blocations';
import {CUSTOMER_LOCATIONS_QUERY} from '~/graphql/customer-account/CustomerLocationsQuery';

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;

  const buyer = await customerAccount.getBuyer();

  let companyLocationId = buyer?.companyLocationId || null;
  let company = null;

  // Check if logged in customer is a b2b customer
  if (buyer) {
    const customer = await customerAccount.query(CUSTOMER_LOCATIONS_QUERY);
    company =
      customer?.data?.customer?.companyContacts?.edges?.[0]?.node?.company ||
      null;
  }

  // If there is only 1 company location, set it in session and keep the cart
  // in sync so products, prices and quantity rules match that location
  if (!companyLocationId && company?.locations?.edges?.length === 1) {
    companyLocationId = company.locations.edges[0].node.id;

    customerAccount.setBuyer({
      companyLocationId,
    });

    await context.cart.updateBuyerIdentity({
      companyLocationId,
      ...(buyer?.customerAccessToken
        ? {customerAccessToken: buyer.customerAccessToken}
        : {}),
    });
  }

  const modalOpen = Boolean(company) && !companyLocationId;

  return {company, companyLocationId, modalOpen};
}

/**
 * Saves the selected company location on the customer account session.
 *
 * Without this, Storefront queries stay uncontextualized and the customer keeps
 * seeing the retail catalog. The cart buyer identity is updated as well, so
 * cart prices and quantity rules match the selected B2B catalog.
 */
export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const companyLocationId = String(formData.get('companyLocationId') || '');

  if (!companyLocationId) {
    return {error: 'Missing companyLocationId'};
  }

  const buyer = await context.customerAccount.getBuyer();

  context.customerAccount.setBuyer({companyLocationId});

  await context.cart.updateBuyerIdentity({
    companyLocationId,
    ...(buyer?.customerAccessToken
      ? {customerAccessToken: buyer.customerAccessToken}
      : {}),
  });

  return {companyLocationId};
}

/**
 * The location selector itself lives in the shared `Aside` drawer
 * (see `app/components/B2BLocationSelector.tsx`), this route only
 * exposes the company location data to the client.
 */
export default function B2BLocationsRoute() {
  return null;
}
