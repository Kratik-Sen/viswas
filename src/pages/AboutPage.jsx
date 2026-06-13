export default function AboutPage() {
  return (
    <main className="page-wrap story-page">
      <section className="copy-panel">
        <p className="eyebrow">Our Story</p>
        <h1>Cooking Oil with Source,<br />Care & Clarity.</h1>
        <p>
          Vishwash Foods is built for homes that want reliable, wholesome cooking oils without
          confusion or compromise. We source directly from Indian farms and press every drop
          using traditional Wood pressed/Cold pressed methods — retaining natural nutrients, aroma, and flavour.
        </p>
        <p>
          Our catalogue focuses on familiar kitchen staples, clear categories, live stock
          visibility, and a direct checkout experience. No middlemen. No mystery ingredients.
          Just honest oil.
        </p>
      </section>

      <section className="values-grid">
        <div>
          <div className="value-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
          </div>
          <strong>Live Inventory</strong>
          <p>Every product shows real-time stock counts. You always know what's available before placing an order.</p>
        </div>
        <div>
          <div className="value-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
          <strong>Simple Buying</strong>
          <p>Browse freely, then sign up with your delivery details when you're ready to order. No forced accounts.</p>
        </div>
        <div>
          <div className="value-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <strong>Purity Guaranteed</strong>
          <p>All our oils are Wood pressed/Cold pressed with zero additives, no heat processing, and independently lab certified.</p>
        </div>
      </section>

      <section>
        <div style={{
          padding: "36px 32px",
          background: "linear-gradient(135deg, #1a4d2e 0%, #2d6a4f 100%)",
          borderRadius: "18px",
          color: "#fff",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "24px",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", margin: "0 0 8px", color: "#fff" }}>
              Ready to experience the difference?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "0.95rem" }}>
              Shop our full range of Wood pressed/Cold pressed oils and taste the Vishwash Foods difference.
            </p>
          </div>
          <a
            href="#/category"
            className="primary-button"
            style={{ background: "#c8963e", boxShadow: "0 4px 16px rgba(200,150,62,0.4)", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            Shop Now →
          </a>
        </div>
      </section>
    </main>
  );
}
