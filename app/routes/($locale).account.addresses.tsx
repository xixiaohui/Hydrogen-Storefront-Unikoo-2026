import type {CustomerAddressInput} from '@shopify/hydrogen/customer-account-api-types';
import type {
  AddressFragment,
  CustomerFragment,
} from 'customer-accountapi.generated';
import {
  data,
  Form,
  useActionData,
  useNavigation,
  useOutletContext,
  type Fetcher,
} from 'react-router';
import type {Route} from './+types/account.addresses';
import {
  UPDATE_ADDRESS_MUTATION,
  DELETE_ADDRESS_MUTATION,
  CREATE_ADDRESS_MUTATION,
} from '~/graphql/customer-account/CustomerAddressMutations';

export type ActionResponse = {
  addressId?: string | null;
  createdAddress?: AddressFragment;
  defaultAddress?: string | null;
  deletedAddress?: string | null;
  error: Record<AddressFragment['id'], string> | null;
  updatedAddress?: AddressFragment;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Addresses'}];
};

export async function loader({context}: Route.LoaderArgs) {
  await context.customerAccount.handleAuthStatus();
  return {};
}

export async function action({request, context}: Route.ActionArgs) {
  const {customerAccount} = context;

  try {
    const form = await request.formData();

    const addressId = form.has('addressId')
      ? String(form.get('addressId'))
      : null;
    if (!addressId) {
      throw new Error('You must provide an address id.');
    }

    const isLoggedIn = await customerAccount.isLoggedIn();
    if (!isLoggedIn) {
      return data(
        {error: {[addressId]: 'Unauthorized'}},
        {status: 401},
      );
    }

    const defaultAddress = form.has('defaultAddress')
      ? String(form.get('defaultAddress')) === 'on'
      : false;
    const address: CustomerAddressInput = {};
    const keys: (keyof CustomerAddressInput)[] = [
      'address1',
      'address2',
      'city',
      'company',
      'territoryCode',
      'firstName',
      'lastName',
      'phoneNumber',
      'zoneCode',
      'zip',
    ];

    for (const key of keys) {
      const value = form.get(key);
      if (typeof value === 'string') {
        address[key] = value;
      }
    }

    switch (request.method) {
      case 'POST': {
        try {
          const {data, errors} = await customerAccount.mutate(
            CREATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressCreate?.userErrors?.length) {
            throw new Error(data?.customerAddressCreate?.userErrors[0].message);
          }

          if (!data?.customerAddressCreate?.customerAddress) {
            throw new Error('Customer address create failed.');
          }

          return {
            error: null,
            createdAddress: data?.customerAddressCreate?.customerAddress,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {status: 400},
            );
          }
          return data({error: {[addressId]: error}}, {status: 400});
        }
      }

      case 'PUT': {
        try {
          const {data, errors} = await customerAccount.mutate(
            UPDATE_ADDRESS_MUTATION,
            {
              variables: {
                address,
                addressId: decodeURIComponent(addressId),
                defaultAddress,
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressUpdate?.userErrors?.length) {
            throw new Error(data?.customerAddressUpdate?.userErrors[0].message);
          }

          if (!data?.customerAddressUpdate?.customerAddress) {
            throw new Error('Customer address update failed.');
          }

          return {
            error: null,
            updatedAddress: address,
            defaultAddress,
          };
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {status: 400},
            );
          }
          return data({error: {[addressId]: error}}, {status: 400});
        }
      }

      case 'DELETE': {
        try {
          const {data, errors} = await customerAccount.mutate(
            DELETE_ADDRESS_MUTATION,
            {
              variables: {
                addressId: decodeURIComponent(addressId),
                language: customerAccount.i18n.language,
              },
            },
          );

          if (errors?.length) {
            throw new Error(errors[0].message);
          }

          if (data?.customerAddressDelete?.userErrors?.length) {
            throw new Error(data?.customerAddressDelete?.userErrors[0].message);
          }

          if (!data?.customerAddressDelete?.deletedAddressId) {
            throw new Error('Customer address delete failed.');
          }

          return {error: null, deletedAddress: addressId};
        } catch (error: unknown) {
          if (error instanceof Error) {
            return data(
              {error: {[addressId]: error.message}},
              {status: 400},
            );
          }
          return data({error: {[addressId]: error}}, {status: 400});
        }
      }

      default: {
        return data(
          {error: {[addressId]: 'Method not allowed'}},
          {status: 405},
        );
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return data({error: error.message}, {status: 400});
    }
    return data({error}, {status: 400});
  }
}

export default function Addresses() {
  const {customer} = useOutletContext<{customer: CustomerFragment}>();
  const {defaultAddress, addresses} = customer;

  return (
    <div className="account-addresses">
      <div className="section-heading">
        <h2>Addresses</h2>
      </div>

      <div className="account-addresses-content">
        <div className="card account-new-address">
          <div className="card-body">
            <h3 className="section-heading">
              <span>Add new address</span>
            </h3>
            <NewAddressForm key={addresses.nodes.length} />
          </div>
        </div>

        <div className="account-existing-addresses">
          <h3 className="section-heading">
            <span>Saved addresses</span>
          </h3>

          {!addresses.nodes.length ? (
            <p className="text-muted">No addresses saved yet.</p>
          ) : (
            <div className="account-addresses-grid">
              {addresses.nodes.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  defaultAddress={defaultAddress}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewAddressForm() {
  const newAddress = {
    address1: '',
    address2: '',
    city: '',
    company: '',
    territoryCode: '',
    firstName: '',
    id: 'new',
    lastName: '',
    phoneNumber: '',
    zoneCode: '',
    zip: '',
  } as CustomerAddressInput;

  return (
    <AddressForm
      addressId={'NEW_ADDRESS_ID'}
      address={newAddress}
      defaultAddress={null}
    >
      {({stateForMethod}) => (
        <button
          className="btn btn-primary"
          disabled={stateForMethod('POST') !== 'idle'}
          formMethod="POST"
          type="submit"
        >
          {stateForMethod('POST') !== 'idle' ? 'Creating…' : 'Create address'}
        </button>
      )}
    </AddressForm>
  );
}

function AddressCard({
  address,
  defaultAddress,
}: {
  address: AddressFragment;
  defaultAddress: CustomerFragment['defaultAddress'];
}) {
  const isDefault = defaultAddress?.id === address.id;

  return (
    <div className={`card account-address-card${isDefault ? ' is-default' : ''}`}>
      <div className="card-body">
        <div className="account-address-header">
          <h4>
            {address.firstName} {address.lastName}
          </h4>
          {isDefault && <span className="badge badge-brand">Default</span>}
        </div>

        {address.company && (
          <p className="account-address-company">{address.company}</p>
        )}

        <address className="account-address-details">
          {address.address1}
          {address.address2 && <>, {address.address2}</>}
          <br />
          {address.city}, {address.zoneCode} {address.zip}
          <br />
          {address.territoryCode}
        </address>

        {address.phoneNumber && (
          <p className="account-address-phone">☎ {address.phoneNumber}</p>
        )}

        <AddressForm
          addressId={address.id}
          address={address}
          defaultAddress={defaultAddress}
        >
          {({stateForMethod}) => (
            <div className="account-address-actions">
              <button
                className="btn btn-secondary btn-sm"
                disabled={stateForMethod('PUT') !== 'idle'}
                formMethod="PUT"
                type="submit"
              >
                {stateForMethod('PUT') !== 'idle' ? 'Saving…' : 'Save'}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                disabled={stateForMethod('DELETE') !== 'idle'}
                formMethod="DELETE"
                type="submit"
              >
                {stateForMethod('DELETE') !== 'idle' ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
        </AddressForm>
      </div>
    </div>
  );
}

export function AddressForm({
  addressId,
  address,
  defaultAddress,
  children,
}: {
  addressId: AddressFragment['id'];
  address: CustomerAddressInput;
  defaultAddress: CustomerFragment['defaultAddress'];
  children: (props: {
    stateForMethod: (method: 'PUT' | 'POST' | 'DELETE') => Fetcher['state'];
  }) => React.ReactNode;
}) {
  const {state, formMethod} = useNavigation();
  const action = useActionData<ActionResponse>();
  const error = action?.error?.[addressId];
  const isDefaultAddress = defaultAddress?.id === addressId;

  return (
    <Form className="address-form" id={addressId}>
      <input type="hidden" name="addressId" defaultValue={addressId} />

      <div className="address-form-grid">
        <div className="field">
          <label className="label" htmlFor="firstName">
            First name
          </label>
          <input
            autoComplete="given-name"
            className="input"
            defaultValue={address?.firstName ?? ''}
            id="firstName"
            name="firstName"
            placeholder="First name"
            required
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
            defaultValue={address?.lastName ?? ''}
            id="lastName"
            name="lastName"
            placeholder="Last name"
            required
            type="text"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="company">
            Company
          </label>
          <input
            autoComplete="organization"
            className="input"
            defaultValue={address?.company ?? ''}
            id="company"
            name="company"
            placeholder="Company"
            type="text"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="address1">
            Address line 1
          </label>
          <input
            autoComplete="address-line1"
            className="input"
            defaultValue={address?.address1 ?? ''}
            id="address1"
            name="address1"
            placeholder="Street address"
            required
            type="text"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="address2">
            Address line 2
          </label>
          <input
            autoComplete="address-line2"
            className="input"
            defaultValue={address?.address2 ?? ''}
            id="address2"
            name="address2"
            placeholder="Apt, suite, etc."
            type="text"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="city">
            City
          </label>
          <input
            autoComplete="address-level2"
            className="input"
            defaultValue={address?.city ?? ''}
            id="city"
            name="city"
            placeholder="City"
            required
            type="text"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="zoneCode">
            State / Province
          </label>
          <input
            autoComplete="address-level1"
            className="input"
            defaultValue={address?.zoneCode ?? ''}
            id="zoneCode"
            name="zoneCode"
            placeholder="State / Province"
            required
            type="text"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="zip">
            Zip / Postal code
          </label>
          <input
            autoComplete="postal-code"
            className="input"
            defaultValue={address?.zip ?? ''}
            id="zip"
            name="zip"
            placeholder="Zip / Postal code"
            required
            type="text"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="territoryCode">
            Country
          </label>
          <input
            autoComplete="country"
            className="input"
            defaultValue={address?.territoryCode ?? ''}
            id="territoryCode"
            name="territoryCode"
            placeholder="Country"
            required
            type="text"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="phoneNumber">
            Phone
          </label>
          <input
            autoComplete="tel"
            className="input"
            defaultValue={address?.phoneNumber ?? ''}
            id="phoneNumber"
            name="phoneNumber"
            placeholder="+1 (555) 000-0000"
            type="tel"
          />
        </div>
      </div>

      <div className="field-checkbox">
        <input
          defaultChecked={isDefaultAddress}
          id="defaultAddress"
          name="defaultAddress"
          type="checkbox"
        />
        <label htmlFor="defaultAddress">Set as default address</label>
      </div>

      {error && <p className="account-error">{error}</p>}

      {children({
        stateForMethod: (method) => (formMethod === method ? state : 'idle'),
      })}
    </Form>
  );
}
