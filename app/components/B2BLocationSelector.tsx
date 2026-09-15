import {useEffect, useRef} from 'react';
import {CartForm} from '@shopify/hydrogen';
import {Aside, useAside} from '~/components/Aside';
import {useB2BLocation} from '~/components/B2BLocationProvider';
import type {
  CustomerCompanyLocation,
  CustomerCompanyLocationConnection,
} from '~/root';

/**
 * B2B company location selector, rendered inside the shared `Aside` drawer.
 *
 * It opens itself automatically when the logged in customer is a B2B customer
 * without a company location set in the session (or from the header button).
 */
export function LocationAside() {
  const {company, companyLocationId, modalOpen, setModalOpen, refetch} =
    useB2BLocation();
  const {open, close} = useAside();

  const asideRef = useRef({open, close});
  asideRef.current = {open, close};

  const openedBySelector = useRef(false);

  useEffect(() => {
    if (modalOpen && company) {
      openedBySelector.current = true;
      asideRef.current.open('location');
    } else if (openedBySelector.current && !modalOpen) {
      openedBySelector.current = false;
      asideRef.current.close();
    }
  }, [modalOpen, company]);

  if (!company) return null;

  const locations = company?.locations?.edges
    ? company.locations.edges.map(
        (location: CustomerCompanyLocationConnection) => {
          return {...location.node};
        },
      )
    : [];

  return (
    <Aside type="location" heading="LOCATION">
      <div className="location-list">
        <p>
          Logged in for <strong>{company.name}</strong>
        </p>
        <p>Choose a location:</p>
        {locations.map((location: CustomerCompanyLocation) => {
          const addressLines =
            location?.shippingAddress?.formattedAddress ?? [];
          const selected = location.id === companyLocationId;

          return (
            <CartForm
              key={location.id}
              route="/cart"
              action={CartForm.ACTIONS.BuyerIdentityUpdate}
              inputs={{
                buyerIdentity: {companyLocationId: location.id},
              }}
            >
              {(fetcher) => (
                <button
                  aria-label={`Select B2B location: ${location.name}`}
                  className={`location-item${selected ? ' selected' : ''}`}
                  onClick={(event) => {
                    setModalOpen(false);
                    close();
                    void fetcher.submit(event.currentTarget.form, {
                      method: 'POST',
                    });
                    refetch();
                  }}
                >
                  <strong>{location.name}</strong>
                  {addressLines.map((line: string) => (
                    <span key={line}>{line}</span>
                  ))}
                </button>
              )}
            </CartForm>
          );
        })}
      </div>
    </Aside>
  );
}
