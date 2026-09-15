/**
 * Value propositions for B2B buyers: free shipping, technical support,
 * volume pricing, fast fulfillment.  Static copy that merchandisers can
 * override later via metaobjects.
 */
export function ValueProps() {
  return (
    <section className="value-props section">
      <div className="container-page">
        <div className="value-props-grid">
          <div className="value-prop">
            <h3>Volume pricing</h3>
            <p>
              Contract discounts and quantity breaks for orders over 50 units.
              Request a custom quote for large projects.
            </p>
          </div>
          <div className="value-prop">
            <h3>Free shipping</h3>
            <p>
              Free freight on orders over $500. Most orders ship within 24
              hours from our central warehouse.
            </p>
          </div>
          <div className="value-prop">
            <h3>Technical support</h3>
            <p>
              Dedicated application engineers help you select the right
              hardware, glass and installation accessories.
            </p>
          </div>
          <div className="value-prop">
            <h3>Certified quality</h3>
            <p>
              ISO 9001 manufacturing, tempered safety glass and hardware
              tested to ANSI and EN standards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
