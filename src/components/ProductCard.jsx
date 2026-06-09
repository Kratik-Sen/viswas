import { useState } from "react";
import { publicAssetUrl } from "../lib/api.js";
import { money } from "../lib/format.js";
import { productImages } from "../lib/products.js";
import { productHref } from "../lib/routing.js";
import { blockNumberInput, DIGITS_PATTERN } from "../lib/validation.js";

const PRODUCT_HOVER_IMAGE = publicAssetUrl("public/images/hover.png");

/* Certification badge icons */
function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  );
}

export default function ProductCard({ product, addToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || "");

  const images = productImages(product);
  const image = images[0]?.url;
  const hoverImage = PRODUCT_HOVER_IMAGE;

  const variants = product.variants?.length
    ? product.variants
    : [{ id: "", size_label: "Default", price: product.price, stock: product.stock }];

  const selectedVariant =
    variants.find((v) => String(v.id) === String(variantId)) || variants[0];
  const out = Number(selectedVariant.stock) <= 0;
  const openProduct = () => {
    window.location.hash = productHref(product);
  };

  function stopCardNavigation(event) {
    event.stopPropagation();
  }

  function handleCardKeyDown(event) {
    if (event.currentTarget !== event.target) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProduct();
    }
  }

  return (
    <article
      className="product-card"
      role="link"
      tabIndex="0"
      aria-label={`View ${product.name}`}
      onClick={openProduct}
      onKeyDown={handleCardKeyDown}
    >
      {/* ---- Image Area (hover swap effect) ---- */}
      <div className="product-image-wrap">
        {/* Main product image */}
        <img
          className="product-img-primary"
          src={image}
          alt={product.name}
        />

        {hoverImage && (
          <img
            className="product-img-hover"
            src={hoverImage}
            alt=""
            aria-hidden="true"
          />
        )}

        {/* Certification overlay — appears on hover */}
        <div className="product-cert-overlay" aria-hidden="true">
          {/* Left column: stacked cert badges */}
          <div className="cert-badges">
            <div className="cert-badge">
              <CheckIcon /> Residue Free
            </div>
            <div className="cert-badge">
              <CheckIcon /> No Outsourcing
            </div>
            <div className="cert-badge">
              <CheckIcon /> Farm Direct
            </div>
          </div>

          {/* Bottom-right: GMO Free + Lab Tested grid */}
          <div className="cert-grid">
            <div className="cert-grid-item">
              GMO<br />FREE
            </div>
            <div className="cert-grid-item">
              LAB<br />TESTED
            </div>
          </div>
        </div>

      </div>

      {/* ---- Product Body ---- */}
      <div className="product-body">
        <div>
          <span className="pill">{product.category}</span>
          <h3>{product.name}</h3>
          <p>{product.description || "Pure cold pressed oil for everyday Indian cooking."}</p>
        </div>

        <div>
          <div className="product-meta">
            <strong>{money(selectedVariant.price)}</strong>
            <span>
              {out
                ? "Out of stock"
                : `${selectedVariant.stock} left`}
            </span>
          </div>

          <label className="variant-select" onClick={stopCardNavigation}>
            Size
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
            >
              {variants.map((v) => (
                <option key={v.id || v.size_label} value={v.id}>
                  {v.size_label} — {money(v.price)}
                </option>
              ))}
            </select>
          </label>

          <div className="product-actions" style={{ marginTop: "10px" }} onClick={stopCardNavigation}>
            <input
              type="text"
              inputMode="numeric"
              pattern={DIGITS_PATTERN}
              min="1"
              max={Math.max(1, Number(selectedVariant.stock))}
              value={quantity}
              disabled={out}
              onKeyDown={blockNumberInput}
              onChange={(e) => setQuantity(e.target.value)}
              aria-label={`Quantity for ${product.name}`}
            />
            <button
              className="primary-button"
              style={{ flex: 1 }}
              disabled={out}
              onClick={() => addToCart(product, quantity, selectedVariant)}
            >
              {out ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
