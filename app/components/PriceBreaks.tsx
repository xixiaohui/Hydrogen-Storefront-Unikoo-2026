import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

type PriceBreak = {
  minimumQuantity: number;
  price: MoneyV2;
};

export type PriceBreaksProps = {
  priceBreaks: PriceBreak[];
};

/**
 * B2B volume pricing displayed as a compact data table.
 */
export function PriceBreaks({priceBreaks}: PriceBreaksProps) {
  return (
    <div className="product-b2b-rules">
      <h3 className="section-heading">
        <span>Volume Pricing</span>
      </h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Minimum Quantity</th>
            <th>Unit Price</th>
          </tr>
        </thead>
        <tbody>
          {priceBreaks.map((pb) => (
            <tr key={`pb-${pb.minimumQuantity}`}>
              <td>{pb.minimumQuantity}+</td>
              <td>
                <Money data={pb.price} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
