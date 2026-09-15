import {useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';
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
 *
 * Selecting a location posts to the `/b2blocations` action, which stores the
 * company location on the customer account session (so every Storefront query
 * is contextualized with it) and updates the cart buyer identity.
 */
export function LocationAside() {
  const {company, companyLocationId, modalOpen, setModalOpen} =
    useB2BLocation();
  const {open, close} = useAside();
  const fetcher = useFetcher();

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

  const selectLocation = (locationId: string) => {
    setModalOpen(false);
    close();
    void fetcher.submit({companyLocationId: locationId}, {
      method: 'POST',
      action: '/b2blocations',
    });
  };

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
            <button
              key={location.id}
              aria-label={`Select B2B location: ${location.name}`}
              className={`location-item${selected ? ' selected' : ''}`}
              disabled={fetcher.state !== 'idle'}
              onClick={() => selectLocation(location.id)}
            >
              <strong>{location.name}</strong>
              {addressLines.map((line: string) => (
                <span key={line}>{line}</span>
              ))}
            </button>
          );
        })}
      </div>
    </Aside>
  );
}
