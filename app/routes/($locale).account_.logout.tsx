import {redirect} from 'react-router';
import type {Route} from './+types/account_.logout';

// if we don't implement this, /account/logout will get caught by account.$.tsx to do login
export async function loader() {
  return redirect('/');
}

export async function action({context}: Route.ActionArgs) {
  // @description Clear B2B company location on logout
  await context.cart.updateBuyerIdentity({
    companyLocationId: null,
    customerAccessToken: null,
  });
  return context.customerAccount.logout();
}
