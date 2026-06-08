import { useState } from "react";
import { money } from "../lib/format.js";
import { productImages } from "../lib/products.js";
import { blockNumberInput, DIGITS_PATTERN } from "../lib/validation.js";

export default function ProductCard({ product, addToCart }) {
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id || "");
  const images = productImages(product);
  const image = images[imageIndex % images.length]?.url;
  const variants = product.variants?.length
    ? product.variants
    : [{ id: "", size_label: "Default", price: product.price, stock: product.stock }];
  const selectedVariant = variants.find((variant) => String(variant.id) === String(variantId)) || variants[0];
  const out = Number(selectedVariant.stock) <= 0;

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <img src={image} alt={product.name} />
        {images.length > 1 && (
          <button
            className="image-step"
            type="button"
            aria-label="Next product image"
            onClick={() => setImageIndex((index) => (index + 1) % images.length)}
          >
            Next
          </button>
        )}
      </div>
      <div className="product-body">
        <div>
          <span className="pill">{product.category}</span>
          <h3>{product.name}</h3>
          <p>{product.description || "Fresh cooking oil packed for daily use."}</p>
        </div>
        <div className="product-meta">
          <strong>{money(selectedVariant.price)}</strong>
          <span>{out ? "Out of stock" : `${selectedVariant.stock} available`}</span>
        </div>
        <label className="variant-select">
          Size
          <select value={variantId} onChange={(event) => setVariantId(event.target.value)}>
            {variants.map((variant) => (
              <option key={variant.id || variant.size_label} value={variant.id}>
                {variant.size_label} - {money(variant.price)}
              </option>
            ))}
          </select>
        </label>
        <div className="product-actions">
          <input
            type="text"
            inputMode="numeric"
            pattern={DIGITS_PATTERN}
            min="1"
            max={Math.max(1, Number(selectedVariant.stock))}
            value={quantity}
            disabled={out}
            onKeyDown={blockNumberInput}
            onChange={(event) => setQuantity(event.target.value)}
            aria-label={`Quantity for ${product.name}`}
          />
          <button className="primary-button" disabled={out} onClick={() => addToCart(product, quantity, selectedVariant)}>
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
