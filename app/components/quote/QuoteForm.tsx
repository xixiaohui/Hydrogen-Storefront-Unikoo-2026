import type {CartLine} from '~/components/CartLineItem';

type ActionData =
  | {mode: 'draft_order'; draftOrderName: string; invoiceUrl: string; message: string}
  | {
      mode: 'mailto';
      company: string;
      contact: string;
      email: string;
      phone: string;
      project: string;
      lineItems: Array<{title: string; sku: string; quantity: number}>;
    };

/**
 * Quote request form.
 *
 * Submits to the /quote action which either:
 * 1. Creates a Draft Order via Shopify Admin API (if token configured)
 * 2. Falls back to client-side mailto: generation (no backend dependency)
 *
 * When the action returns a "mailto" result, this component opens the
 * email client with a structured body containing the cart contents.
 */
export function QuoteForm({
  cartLines,
  actionData,
}: {
  cartLines: CartLine[];
  actionData?: ActionData;
}) {
  // If draft order was created, the success banner is shown in the page above.
  if (actionData?.mode === 'draft_order') return null;

  // If mailto fallback returned, open email client.
  if (actionData?.mode === 'mailto') {
    const linesSummary = actionData.lineItems
      .map(
        (item) =>
          `${item.title} (SKU: ${item.sku || '-'}) x ${item.quantity}`,
      )
      .join('\n');

    const body = [
      `Company: ${actionData.company}`,
      `Contact: ${actionData.contact}`,
      `Email: ${actionData.email}`,
      `Phone: ${actionData.phone}`,
      '',
      `Project / notes:`,
      actionData.project,
      '',
      `Items:`,
      linesSummary,
    ].join('\n');

    const subject = `Quote Request — ${actionData.company || 'B2B Customer'}`;
    const mailto = `mailto:sales@industrial-supply.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Auto-open mailto on next render
    if (typeof window !== 'undefined') {
      window.location.href = mailto;
    }

    return (
      <div className="quote-form-card card">
        <div className="card-body">
          <h2 className="section-heading">
            <span>Opening email client…</span>
          </h2>
          <p className="quote-form-success">
            Your email client should have opened with the quote request.
            If not, please email sales@industrial-supply.com directly with
            your cart contents.
          </p>
          <a className="btn btn-primary" href={mailto}>
            Open email
          </a>
          <button
            className="btn btn-secondary"
            onClick={() => window.print()}
            type="button"
          >
            Print quote
          </button>
        </div>
      </div>
    );
  }

  // Default: show the form
  return (
    <div className="quote-form-card card">
      <div className="card-body">
        <h2 className="section-heading">
          <span>Your details</span>
        </h2>

        <form className="quote-form" method="post">
          <div className="field">
            <label className="label" htmlFor="company">
              Company name
            </label>
            <input
              autoComplete="organization"
              className="input"
              id="company"
              name="company"
              placeholder="Your company"
              required
              type="text"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="contact">
              Contact person
            </label>
            <input
              autoComplete="name"
              className="input"
              id="contact"
              name="contact"
              placeholder="Full name"
              required
              type="text"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              autoComplete="email"
              className="input"
              id="email"
              name="email"
              placeholder="you@company.com"
              required
              type="email"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <input
              autoComplete="tel"
              className="input"
              id="phone"
              name="phone"
              placeholder="+1 (555) 000-0000"
              type="tel"
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="project">
              Project / notes
            </label>
            <textarea
              className="input"
              id="project"
              name="project"
              placeholder="Tell us about your project, delivery timeline, or special requirements…"
              rows={4}
            />
          </div>

          <div className="quote-form-actions">
            <button className="btn btn-primary btn-lg" type="submit">
              Submit quote request
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
              type="button"
            >
              Print quote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
