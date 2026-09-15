import type {Maybe} from '@shopify/hydrogen/customer-account-api-types';

export type QuantityRulesProps = {
  maximum?: Maybe<number> | undefined;
  minimum?: Maybe<number> | undefined;
  increment?: Maybe<number> | undefined;
};

export const hasQuantityRules = (quantityRule?: QuantityRulesProps) => {
  return (
    quantityRule &&
    (quantityRule?.increment != 1 ||
      quantityRule?.minimum != 1 ||
      quantityRule?.maximum)
  );
};

/**
 * B2B quantity rules displayed as a compact data table.
 */
export function QuantityRules({
  maximum,
  minimum,
  increment,
}: QuantityRulesProps) {
  return (
    <div className="product-b2b-rules">
      <h3 className="section-heading">
        <span>Quantity Rules</span>
      </h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Increment</th>
            <th>Minimum</th>
            <th>Maximum</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{increment ?? 1}</td>
            <td>{minimum ?? 1}</td>
            <td>{maximum ?? '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
