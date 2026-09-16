import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useEffect, useId, useRef, useState} from 'react';
import {useFetcher} from 'react-router';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';
  const summaryId = useId();
  const discountsHeadingId = useId();
  const discountCodeInputId = useId();
  const giftCardHeadingId = useId();
  const giftCardInputId = useId();

  return (
    <div aria-labelledby={summaryId} className={className}>
      <div className="cart-summary-card">
        <h3 id={summaryId} className="cart-summary-heading">
          Order Summary
        </h3>

        <dl className="cart-summary-totals">
          <div className="cart-summary-row">
            <dt>Subtotal</dt>
            <dd>
              {cart?.cost?.subtotalAmount?.amount ? (
                <Money data={cart?.cost?.subtotalAmount} />
              ) : (
                '-'
              )}
            </dd>
          </div>

          {cart?.cost?.totalTaxAmount?.amount && (
            <div className="cart-summary-row">
              <dt>Tax</dt>
              <dd>
                <Money data={cart.cost.totalTaxAmount} />
              </dd>
            </div>
          )}

          {cart?.cost?.totalDutyAmount?.amount && (
            <div className="cart-summary-row">
              <dt>Duty</dt>
              <dd>
                <Money data={cart.cost.totalDutyAmount} />
              </dd>
            </div>
          )}
        </dl>

        <CartDiscounts
          discountCodes={cart?.discountCodes}
          discountsHeadingId={discountsHeadingId}
          discountCodeInputId={discountCodeInputId}
        />

        <CartGiftCard
          giftCardCodes={cart?.appliedGiftCards}
          giftCardHeadingId={giftCardHeadingId}
          giftCardInputId={giftCardInputId}
        />

        <div className="cart-summary-total">
          <span>Total</span>
          <strong>
            {cart?.cost?.totalAmount?.amount ? (
              <Money data={cart.cost.totalAmount} />
            ) : (
              '-'
            )}
          </strong>
        </div>

        <CartNote note={cart?.note} />

        <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
      </div>
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <div className="cart-checkout-actions">
      <a className="btn btn-primary btn-lg btn-block" href={checkoutUrl}>
        Proceed to Checkout
      </a>
      <p className="cart-checkout-note text-muted">
        Taxes and shipping calculated at checkout
      </p>
    </div>
  );
}

function CartNote({note}: {note?: string | null}) {
  return (
    <div className="cart-note">
      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.NoteUpdate}
      >
        <div className="field">
          <label className="label" htmlFor="cart-note">
            Order notes (optional)
          </label>
          <textarea
            className="input"
            defaultValue={note ?? ''}
            id="cart-note"
            name="note"
            placeholder="Add special instructions for your order…"
            rows={3}
          />
        </div>
        <button className="btn btn-secondary btn-sm" type="submit">
          Save note
        </button>
      </CartForm>
    </div>
  );
}

function CartDiscounts({
  discountCodes,
  discountsHeadingId,
  discountCodeInputId,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
  discountsHeadingId: string;
  discountCodeInputId: string;
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  return (
    <div className="cart-discounts">
      <h4 className="cart-summary-subheading">Discounts</h4>

      {codes.length > 0 && (
        <div className="cart-discount-applied">
          <UpdateDiscountForm>
            <div
              className="cart-discount-code"
              role="group"
              aria-labelledby={discountsHeadingId}
            >
              <code>{codes?.join(', ')}</code>
              <button
                className="btn btn-ghost btn-sm"
                type="submit"
                aria-label="Remove discount"
              >
                Remove
              </button>
            </div>
          </UpdateDiscountForm>
        </div>
      )}

      <UpdateDiscountForm discountCodes={codes}>
        <div className="cart-discount-form">
          <input
            aria-label="Discount code"
            className="input"
            id={discountCodeInputId}
            type="text"
            name="discountCode"
            placeholder="Discount code"
          />
          <button className="btn btn-secondary btn-sm" type="submit">
            Apply
          </button>
        </div>
      </UpdateDiscountForm>
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartGiftCard({
  giftCardCodes,
  giftCardHeadingId,
  giftCardInputId,
}: {
  giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
  giftCardHeadingId: string;
  giftCardInputId: string;
}) {
  const giftCardCodeInput = useRef<HTMLInputElement>(null);
  const removeButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const previousCardIdsRef = useRef<string[]>([]);
  const giftCardAddFetcher = useFetcher({key: 'gift-card-add'});
  const [removedCardIndex, setRemovedCardIndex] = useState<number | null>(null);

  useEffect(() => {
    if (giftCardAddFetcher.data) {
      if (giftCardCodeInput.current !== null) {
        giftCardCodeInput.current.value = '';
      }
    }
  }, [giftCardAddFetcher.data]);

  useEffect(() => {
    const currentCardIds = giftCardCodes?.map((card) => card.id) || [];

    if (removedCardIndex !== null && giftCardCodes) {
      const focusTargetIndex = Math.min(
        removedCardIndex,
        giftCardCodes.length - 1,
      );
      const focusTargetCard = giftCardCodes[focusTargetIndex];
      const focusButton = focusTargetCard
        ? removeButtonRefs.current.get(focusTargetCard.id)
        : null;

      if (focusButton) {
        focusButton.focus();
      } else if (giftCardCodeInput.current) {
        giftCardCodeInput.current.focus();
      }

      setRemovedCardIndex(null);
    }

    previousCardIdsRef.current = currentCardIds;
  }, [giftCardCodes, removedCardIndex]);

  const handleRemoveClick = (cardId: string) => {
    const index = previousCardIdsRef.current.indexOf(cardId);
    if (index !== -1) {
      setRemovedCardIndex(index);
    }
  };

  return (
    <div className="cart-gift-cards">
      <h4 className="cart-summary-subheading">Gift Cards</h4>

      {giftCardCodes && giftCardCodes.length > 0 && (
        <div className="cart-gift-card-applied">
          {giftCardCodes.map((giftCard) => (
            <div className="cart-gift-card-code" key={giftCard.id}>
              <RemoveGiftCardForm
                giftCardId={giftCard.id}
                lastCharacters={giftCard.lastCharacters}
                onRemoveClick={() => handleRemoveClick(giftCard.id)}
                buttonRef={(el: HTMLButtonElement | null) => {
                  if (el) {
                    removeButtonRefs.current.set(giftCard.id, el);
                  } else {
                    removeButtonRefs.current.delete(giftCard.id);
                  }
                }}
              >
                <code>***{giftCard.lastCharacters}</code>
                <Money data={giftCard.amountUsed} />
              </RemoveGiftCardForm>
            </div>
          ))}
        </div>
      )}

      <AddGiftCardForm fetcherKey="gift-card-add">
        <div className="cart-gift-card-form">
          <input
            aria-label="Gift card code"
            className="input"
            id={giftCardInputId}
            type="text"
            name="giftCardCode"
            placeholder="Gift card code"
            ref={giftCardCodeInput}
          />
          <button
            className="btn btn-secondary btn-sm"
            type="submit"
            disabled={giftCardAddFetcher.state !== 'idle'}
          >
            Apply
          </button>
        </div>
      </AddGiftCardForm>
    </div>
  );
}

function AddGiftCardForm({
  fetcherKey,
  children,
}: {
  fetcherKey?: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      fetcherKey={fetcherKey}
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesAdd}
    >
      {children}
    </CartForm>
  );
}

function RemoveGiftCardForm({
  giftCardId,
  lastCharacters,
  children,
  onRemoveClick,
  buttonRef,
}: {
  giftCardId: string;
  lastCharacters: string;
  children: React.ReactNode;
  onRemoveClick?: () => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesRemove}
      inputs={{
        giftCardCodes: [giftCardId],
      }}
    >
      {children}
      <button
        className="btn btn-ghost btn-sm"
        type="submit"
        aria-label={`Remove gift card ending in ${lastCharacters}`}
        onClick={onRemoveClick}
        ref={buttonRef}
      >
        Remove
      </button>
    </CartForm>
  );
}
