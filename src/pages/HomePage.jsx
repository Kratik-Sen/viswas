import CategoryLogoStrip from "../components/CategoryLogoStrip.jsx";
import ProductGrid from "../components/ProductGrid.jsx";

export default function HomePage({ products, categories, addToCart }) {
  const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);

  return (
    <main>
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Farm Fresh · Wood pressed/Cold pressed · Pure</p>
          <h1>
            <em>Vishwash</em> Foods<br />Wood pressed/Cold pressed Oils
          </h1>
          <p className="hero-subtitle">
            Groundnut, coconut, mustard, sesame, almond, sunflower and flaxseed oils —
            crafted for everyday Indian kitchens. No chemicals, no adulteration.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#/category">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Shop All Oils
            </a>
            <a className="light-button" href="#/about">
              Our Story →
            </a>
          </div>

          {/* Trust badges */}
          <div className="hero-trust">
            <div className="trust-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              100% Pure
            </div>
            <div className="trust-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20,6 9,17 4,12" />
              </svg>
              Lab Tested
            </div>
            <div className="trust-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
              </svg>
              No Chemicals
            </div>
            <div className="trust-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
              Farm Direct
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS STRIP ===== */}
      <div className="store-strip">
        <div>
          <strong>{categories.length}+</strong>
          <span>Oil categories</span>
        </div>
        <div>
          <strong>{products.length}+</strong>
          <span>Products available</span>
        </div>
        <div>
          <strong>{totalStock.toLocaleString("en-IN")}+</strong>
          <span>Units in stock</span>
        </div>
      </div>

      {/* ===== CATEGORY STRIP ===== */}
      <CategoryLogoStrip categories={categories} />

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="content-wrap product-section">
        <div className="section-head">
          <span>Featured Oils</span>
          <a href="#/category">View all products →</a>
        </div>
        <ProductGrid products={products.slice(0, 8)} addToCart={addToCart} />
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section className="why-section">
        <div className="why-section-inner">
          <h2>Why Choose Vishwash Foods?</h2>
          <p className="section-sub">We believe in complete transparency — from source to shelf.</p>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <strong>Wood pressed/Cold pressed Method</strong>
              <p>Our oils are extracted using traditional Wood pressed/Cold pressed extraction — no heat, no chemicals, just pure goodness preserved.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </div>
              <strong>Direct from Farmers</strong>
              <p>We source directly from verified Indian farms with no middlemen, ensuring fresh produce at fair prices.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9,11 12,14 22,4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <strong>Lab Tested & Certified</strong>
              <p>Every batch is independently tested for purity, residue, and nutritional content. GMO-free guaranteed.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <strong>Fresh Batches Always</strong>
              <p>We produce in small batches and keep live stock counts so you always know exactly what you're getting.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
