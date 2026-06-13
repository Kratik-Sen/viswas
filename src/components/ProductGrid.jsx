import ProductCard from "./ProductCard.jsx";

export default function ProductGrid({ products, addToCart, showVariantButtons = false, hideVariantControl = false }) {
  if (!products.length) {
    return <div className="empty-state">No products are available in this category yet.</div>;
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.display_key || product.id}
          product={product}
          addToCart={addToCart}
          showVariantButtons={showVariantButtons}
          hideVariantControl={hideVariantControl}
        />
      ))}
    </div>
  );
}
