import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useFetcher, useRevalidator} from 'react-router';
import {type CustomerCompany} from '~/root';

export type B2BLocationContextValue = {
  company?: CustomerCompany;
  companyLocationId?: string;
  modalOpen?: boolean;
  setModalOpen: (b: boolean) => void;
  /** Re-run the `/b2blocations` loader, e.g. after a location was selected */
  refetch: () => void;
};

const defaultB2BLocationContextValue = {
  company: undefined,
  companyLocationId: undefined,
  modalOpen: undefined,
  setModalOpen: () => {},
  refetch: () => {},
};

const B2BLocationContext = createContext<B2BLocationContextValue>(
  defaultB2BLocationContextValue,
);

export function B2BLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const fetcher = useFetcher<B2BLocationContextValue>();
  const revalidator = useRevalidator();
  const [modalOpen, setModalOpen] = useState(fetcher?.data?.modalOpen);
  const [reloadKey, setReloadKey] = useState(0);

  const initialized = useRef(false);
  const previousLocationId = useRef<string | undefined>(undefined);

  // Keep a stable reference to the fetcher so the effect below only
  // runs on mount and whenever `refetch()` is called
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    void fetcherRef.current.load('/b2blocations');
  }, [reloadKey]);

  // The company location can still change after the page was rendered, for
  // example when it is auto selected for a single location company. Reload the
  // route data so products and prices match the selected company location.
  useEffect(() => {
    const companyLocationId = fetcher.data?.companyLocationId;

    if (!fetcher.data) return;

    if (!initialized.current) {
      initialized.current = true;
      previousLocationId.current = companyLocationId;
      if (companyLocationId) void revalidator.revalidate();
      return;
    }

    if (companyLocationId && companyLocationId !== previousLocationId.current) {
      previousLocationId.current = companyLocationId;
      void revalidator.revalidate();
    }
  }, [fetcher.data, revalidator]);

  const value = useMemo<B2BLocationContextValue>(() => {
    return {
      ...defaultB2BLocationContextValue,
      ...fetcher.data,
      modalOpen: modalOpen ?? fetcher?.data?.modalOpen,
      setModalOpen,
      refetch: () => setReloadKey((key) => key + 1),
    };
  }, [fetcher, modalOpen]);

  return (
    <B2BLocationContext.Provider value={value}>
      {children}
    </B2BLocationContext.Provider>
  );
}

export function useB2BLocation(): B2BLocationContextValue {
  return useContext(B2BLocationContext);
}
