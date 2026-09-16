import {useState} from 'react';
import {Form, Link, useLocation, useSearchParams} from 'react-router';
import {
  clearFiltersUrl,
  countAppliedFilters,
  PRICE_MAX,
  PRICE_MIN,
  toggleFilterUrl,
} from '~/lib/filters';

type CollectionFilter = {
  id: string;
  label: string;
  type: string;
  values: Array<{id: string; label: string; count: number}>;
};

/**
 * Faceted filtering rendered from the filters Shopify returns for the current
 * result set. Values are links, so every filtered view is a shareable URL and
 * works without JavaScript.
 */
export function FilterSidebar({filters}: {filters: CollectionFilter[]}) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const url = new URL(
    `${location.pathname}${location.search}`,
    'https://storefront.local',
  );
  const applied = countAppliedFilters(searchParams);

  if (!filters?.length) return null;

  return (
    <aside className="filters" aria-label="Product filters">
      <div className="filters-header">
        <h2 className="filters-title">Filter</h2>
        {applied > 0 && (
          <Link className="filters-clear" to={clearFiltersUrl(url)}>
            Clear all ({applied})
          </Link>
        )}
      </div>

      {filters.map((filter) => (
        <FilterGroup
          key={filter.id}
          filter={filter}
          url={url}
          selected={searchParams.get(filter.id)?.split(',') ?? []}
        />
      ))}
    </aside>
  );
}

function FilterGroup({
  filter,
  url,
  selected,
}: {
  filter: CollectionFilter;
  url: URL;
  selected: string[];
}) {
  const [expanded, setExpanded] = useState(true);

  if (filter.type === 'PRICE_RANGE') {
    return (
      <div className="filter-group">
        <button
          aria-expanded={expanded}
          className="filter-group-toggle"
          onClick={() => setExpanded(!expanded)}
          type="button"
        >
          {filter.label}
        </button>

        {expanded && (
          <Form className="filter-price" method="get">
            <input
              aria-label={`${filter.label} minimum`}
              className="input"
              inputMode="decimal"
              name={PRICE_MIN}
              placeholder="Min"
              type="number"
            />
            <input
              aria-label={`${filter.label} maximum`}
              className="input"
              inputMode="decimal"
              name={PRICE_MAX}
              placeholder="Max"
              type="number"
            />
            <button className="btn btn-secondary btn-sm" type="submit">
              Go
            </button>
          </Form>
        )}
      </div>
    );
  }

  if (!filter.values?.length) return null;

  return (
    <div className="filter-group">
      <button
        aria-expanded={expanded}
        className="filter-group-toggle"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        {filter.label}
      </button>

      {expanded && (
        <ul className="filter-values">
          {filter.values.map((value) => {
            const isSelected = selected.includes(value.id);

            return (
              <li key={value.id}>
                <Link
                  className={`filter-value${isSelected ? ' is-selected' : ''}`}
                  to={toggleFilterUrl(url, filter.id, value.id)}
                >
                  <span aria-hidden="true" className="filter-checkbox" />
                  <span className="filter-value-label">{value.label}</span>
                  <span className="filter-value-count">({value.count})</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
