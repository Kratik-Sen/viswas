import CategoryLogoStrip from "../components/CategoryLogoStrip.jsx";
import ProductGrid from "../components/ProductGrid.jsx";

export default function HomePage({ products, categories, addToCart }) {
  const totalStock = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Fresh batches. Honest source. Clean cooking.</p>
          <h1>Viswas Cold Pressed Oils</h1>
          <p>
            Shop groundnut, coconut, mustard, sesame, almond, sunflower, and flaxseed oils made for everyday Indian kitchens.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#/category">
              Shop oils
            </a>
            <a className="light-button" href="#/about">
              Our story
            </a>
          </div>
        </div>
      </section>

      <section className="store-strip" aria-label="Store highlights">
        <div>
          <strong>{categories.length}</strong>
          <span>Oil categories</span>
        </div>
        <div>
          <strong>{products.length}</strong>
          <span>Products listed</span>
        </div>
        <div>
          <strong>{totalStock}</strong>
          <span>Units available</span>
        </div>
      </section>

      <CategoryLogoStrip categories={categories} />

      <section className="content-wrap product-section">
        <div className="section-head">
          <span>Featured Oils</span>
          <a href="#/category">Explore products</a>
        </div>
        <ProductGrid products={products.slice(0, 8)} addToCart={addToCart} />
      </section>
    </main>
  );
}
