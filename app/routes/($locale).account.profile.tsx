import type {CustomerFragment} from 'customer-accountapi.generated';
import type {CustomerUpdateInput} from '@shopify/hydrogen/customer-account-api-types';
import {CUSTOMER_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerUpdateMutation';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
} from 'react-router';
import type {Route} from './+types/account.profile';

export type ActionResponse = {
  error: string | null;
  customer: CustomerFragment | null;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Profile'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();
  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  if (request.method !== 'PUT') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const form = await request.formData();

  try {
    const customer: CustomerUpdateInput = {};
    const validInputKeys = ['firstName', 'lastName'] as const;
    for (const [key, value] of form.entries()) {
      if (!validInputKeys.includes(key as any)) continue;
      if (typeof value === 'string' && value.length) {
        customer[key as (typeof validInputKeys)[number]] = value;
      }
    }

    const {data, errors} = await customerAccount.mutate(
      CUSTOMER_UPDATE_MUTATION,
      {
        variables: {
          customer,
          language: customerAccount.i18n.language,
        },
      },
    );

    if (errors?.length) {
      throw new Error(errors[0].message);
    }

    if (!data?.customerUpdate?.customer) {
      throw new Error('Customer profile update failed.');
    }

    return {
      error: null,
      customer: data?.customerUpdate?.customer,
    };
  } catch (error: any) {
    return data(
      {error: error.message, customer: null},
      {status: 400},
    );
  }
}

export default function AccountProfile() {
  const account = useOutletContext<{customer: CustomerFragment}>();
  const {state} = useNavigation();
  const action = useActionData<ActionResponse>();
  const customer = action?.customer ?? account?.customer;

  return (
    <div className="account-profile">
      <div className="section-heading">
        <h2>Profile</h2>
      </div>

      <div className="card account-profile-card">
        <div className="card-body">
          <h3 className="section-heading">
            <span>Personal information</span>
          </h3>

          <Form method="PUT" className="account-profile-form">
            <div className="field">
              <label className="label" htmlFor="firstName">
                First name
              </label>
              <input
                autoComplete="given-name"
                className="input"
                defaultValue={customer.firstName ?? ''}
                id="firstName"
                name="firstName"
                placeholder="First name"
                type="text"
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="lastName">
                Last name
              </label>
              <input
                autoComplete="family-name"
                className="input"
                defaultValue={customer.lastName ?? ''}
                id="lastName"
                name="lastName"
                placeholder="Last name"
                type="text"
              />
            </div>

            {action?.error && (
              <p className="account-error">{action.error}</p>
            )}

            <button
              className="btn btn-primary"
              disabled={state !== 'idle'}
              type="submit"
            >
              {state !== 'idle' ? 'Saving…' : 'Save changes'}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
