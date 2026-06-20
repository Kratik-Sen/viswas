import { useEffect, useMemo, useState } from "react";
import { money } from "../lib/format.js";
import { productImages, variantImage } from "../lib/products.js";
import { productIdFromParam } from "../lib/routing.js";
import { blockNumberInput, DIGITS_PATTERN } from "../lib/validation.js";

function productVariants(product) {
  return product?.variants?.length
    ? product.variants
    : [{ id: "", size_label: "Default", price: product?.price, stock: product?.stock }];
}

function clampQuantity(value, stock) {
  const parsed = Math.floor(Number(value || 1));
  const safeQuantity = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
  return Math.min(safeQuantity, Math.max(1, Number(stock) || 1));
}

function unitPriceLabel(variant) {
  const label = String(variant.size_label || "").toLowerCase();
  const price = Number(variant.price || 0);
  const mlMatch = label.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  const literMatch = label.match(/(\d+(?:\.\d+)?)\s*(?:l|ltr|liter|litre)\b/);
  const liters = mlMatch ? Number(mlMatch[1]) / 1000 : literMatch ? Number(literMatch[1]) : 0;

  if (!liters || !price) return `${variant.stock} in stock`;
  return `${money(price / liters)}/L`;
}

function productDescription(product) {
  if (product?.description) return product.description;
  return "Pure Wood pressed/Cold pressed oil for everyday Indian cooking.";
}

function productBenefitsText(product) {
  if (product?.product_benefits) return product.product_benefits;
  if (product?.description) return product.description;
  return [
    "Wood pressed/Cold pressed for natural aroma and nutrients.",
    "Packed fresh with live stock tracking.",
    "Best suited for daily Indian cooking.",
  ].join("\n");
}

function productBenefitPoints(product) {
  return productBenefitsText(product)
    .split(/\r?\n/)
    .flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed) return [];
      return trimmed.includes("\u2022") ? trimmed.split(/\s*\u2022\s*/) : [trimmed];
    })
    .map((line) => line.replace(/^[\u2022*-]\s*/, "").trim())
    .filter(Boolean);
}

export default function ProductPage({ route, products, addToCart, showToast }) {
  const productId = productIdFromParam(route.param);
  const product = products.find((item) => Number(item.id) === productId);
  const images = useMemo(() => (product ? productImages(product) : []), [product]);
  const variants = useMemo(() => productVariants(product), [product]);
  const benefitItems = useMemo(() => (product ? productBenefitPoints(product) : []), [product]);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const selectedVariant =
    variants.find((variant) => String(variant.id) === String(variantId)) || variants[0];
  const stock = Number(selectedVariant?.stock || 0);
  const outOfStock = stock <= 0;
  const selectedImage = selectedImageUrl || variantImage(selectedVariant) || images[0]?.url;
  const selectedPrice = money(selectedVariant?.price || product?.price || 0);

  useEffect(() => {
    setVariantId(variants[0]?.id || "");
    setSelectedImageUrl(variantImage(variants[0]) || images[0]?.url || "");
    setQuantity(1);
  }, [product?.id, images, variants]);

  useEffect(() => {
    if (outOfStock) {
      setQuantity(0);
      return;
    }
    setQuantity((current) => clampQuantity(current, stock));
  }, [outOfStock, stock]);

  if (!product) {
    return (
      <main className="page-wrap">
        <div className="empty-state">
          Product not found. <a href="#/category">Browse all products</a>
        </div>
      </main>
    );
  }

  function handleQuantityChange(value) {
    if (outOfStock) return;
    setQuantity(clampQuantity(value, stock));
  }

  function handleAddToCart() {
    addToCart(product, quantity, selectedVariant);
  }

  function handleBuyNow() {
    if (outOfStock) return;
    addToCart(product, quantity, selectedVariant);
    window.location.hash = "#/cart";
  }

  function selectVariant(variant) {
    setVariantId(variant.id || "");
    setSelectedImageUrl(variantImage(variant) || images[0]?.url || "");
  }

  async function shareProduct() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: productDescription(product), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast("Product link copied.");
    } catch (error) {
      showToast("Product link is ready in the address bar.");
    }
  }

  return (
    <main className="product-detail-page">
      <section className="product-detail-layout">
        <div className="product-gallery">
          <div className="product-gallery-main">
            <img src={selectedImage} alt={product.name} />
          </div>
          {images.length > 1 && (
            <div className="product-thumbs" aria-label={`${product.name} images`}>
              {images.map((image, index) => (
                <button
                  className={image.url === selectedImage ? "selected" : ""}
                  type="button"
                  key={image.id || image.url}
                  onClick={() => setSelectedImageUrl(image.url)}
                  aria-label={`View product image ${index + 1}`}
                >
                  <img src={image.url} alt="" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <div className="product-detail-head">
            <div>
              <p className="product-kicker">{product.category}</p>
              <h1>{product.name}</h1>
            </div>
            <button className="share-button" type="button" onClick={shareProduct} aria-label="Share product">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.6 10.7 15.4 6.3M8.6 13.3l6.8 4.4" />
              </svg>
            </button>
          </div>

          <p className="product-teaser">{productDescription(product)}</p>

          <div className="product-review-line">
            <span aria-hidden="true">★</span>
            <strong>4.8</strong>
            <small>{Math.max(64, Number(product.id || 1) * 37)} reviews</small>
          </div>

          <div className="product-price-row">
            <strong>{selectedPrice}</strong>
            <span>MRP incl. all taxes</span>
          </div>

          <div className="product-coin-banner">
            Buy now and earn purity coins instantly
          </div>

          <div className="product-best-price">
            <strong>Best Price {selectedPrice}</strong>
            <span>with coupon - Apply at checkout</span>
          </div>

          <section className="detail-section">
            <h2>Select Variant</h2>
            <div className="variant-card-grid">
              {variants.map((variant) => {
                const selected = String(variant.id) === String(selectedVariant?.id);
                const unavailable = Number(variant.stock) <= 0;

                return (
                  <button
                    className={selected ? "variant-card selected" : "variant-card"}
                    type="button"
                    disabled={unavailable}
                    key={variant.id || variant.size_label}
                    onClick={() => selectVariant(variant)}
                  >
                    <span>{variant.size_label}</span>
                    <strong>{money(variant.price)}</strong>
                    <small>{unavailable ? "Out of stock" : unitPriceLabel(variant)}</small>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="app-offer-strip">
            <div>
              <span>APP</span>
              <small>PRE-SALE</small>
            </div>
            <p>
              <strong>Get Flat 30% OFF exclusively on our app.</strong>
              <small>Use code: POP30</small>
            </p>
          </div>

          <div className="detail-actions">
            <div className="quantity-stepper" aria-label="Quantity">
              <button
                type="button"
                disabled={outOfStock || quantity <= 1}
                onClick={() => handleQuantityChange(Number(quantity) - 1)}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern={DIGITS_PATTERN}
                min={outOfStock ? "0" : "1"}
                max={String(Math.max(1, stock))}
                value={quantity}
                disabled={outOfStock}
                onKeyDown={blockNumberInput}
                onChange={(event) => handleQuantityChange(event.target.value)}
                aria-label={`Quantity for ${product.name}`}
              />
              <button
                type="button"
                disabled={outOfStock || quantity >= stock}
                onClick={() => handleQuantityChange(Number(quantity) + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button className="primary-button" type="button" disabled={outOfStock} onClick={handleAddToCart}>
              {outOfStock ? "Out of Stock" : "Add to cart"}
            </button>
            <button className="buy-now-button" type="button" disabled={outOfStock} onClick={handleBuyNow}>
              Buy Now
            </button>
          </div>

          <section className="detail-section product-description">
            <h2>Product Description</h2>
            <ul>
              {benefitItems.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
