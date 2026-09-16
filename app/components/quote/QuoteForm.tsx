import {useState} from 'react';
import type {CartLine} from '~/components/CartLineItem';

/**
 * Quote request form. Generates a mailto: link with the cart contents
 * and project details so the sales team receives a structured request.
 * Also offers a printable quote summary.
 */
export function QuoteForm({cartLines}: {cartLines: CartLine[]}) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const company = String(formData.get('company') || '');
    const contact = String(formData.get('contact') || '');
    const email = String(formData.get('email') || '');
    const phone = String(formData.get('phone') || '');
    const project = String(formData.get('project') || '');

    // Build the mailto body
    const linesSummary = cartLines
      .map((line) => {
        const merchandise =
          'merchandise' in line ? line.merchandise : null;
        if (!merchandise) return '';
        const title =
          'product' in merchandise && merchandise.product
            ? (merchandise.product as {title?: string}).title
            : ('title' in merchandise ? String(merchandise.title) : '');
        const sku =
          'sku' in merchandise && merchandise.sku
            ? String(merchandise.sku)
            : '-';
        return `${title} (SKU: ${sku}) x ${line.quantity}`;
      })
      .filter(Boolean)
      .join('\n');

    const body = [
      `Company: ${company}`,
      `Contact: ${contact}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      '',
      `Project / notes:`,
      project,
      '',
      `Items:`,
      linesSummary,
    ].join('\n');

    const subject = `Quote Request — ${company || 'B2B Customer'}`;
    const mailto = `mailto:sales@industrial-supply.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setSubmitted(true);
  };

  return (
    <div className="quote-form-card card">
      <div className="card-body">
        <h2 className="section-heading">
          <span>Your details</span>
        </h2>

        {submitted && (
          <p className="quote-form-success">
            Your email client should have opened with the quote request.
            If not, please email sales@industrial-supply.com directly.
          </p>
        )}

        <form className="quote-form" onSubmit={handleSubmit}>
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
              Send quote request
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
