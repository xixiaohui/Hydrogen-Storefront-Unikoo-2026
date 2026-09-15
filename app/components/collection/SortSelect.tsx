import {Form, useSearchParams, useSubmit} from 'react-router';
import {SORT_OPTIONS} from '~/lib/filters';

/**
 * Sorting is part of the URL, so results stay shareable and cacheable.
 * Existing filters are preserved as hidden inputs.
 */
export function SortSelect({current}: {current: string}) {
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  return (
    <Form
      className="sort-form"
      method="get"
      onChange={(event) => {
        void submit(event.currentTarget);
      }}
    >
      {[...searchParams.entries()]
        .filter(([key]) => key !== 'sort' && key !== 'cursor')
        .map(([key, value]) => (
          <input key={key} name={key} type="hidden" value={value} />
        ))}

      <label className="label" htmlFor="sort">
        Sort
      </label>
      <select
        className="select sort-select"
        defaultValue={current}
        id="sort"
        name="sort"
      >
        {SORT_OPTIONS.map(({key, label}) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <noscript>
        <button className="btn btn-secondary btn-sm" type="submit">
          Apply
        </button>
      </noscript>
    </Form>
  );
}
