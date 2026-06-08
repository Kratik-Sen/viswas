import ProductCard from "./ProductCard.jsx";

export default function ProductGrid({ products, addToCart }) {
  if (!products.length) {
    return <div className="empty-state">No products are available in this category yet.</div>;
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} addToCart={addToCart} />
      ))}
    </div>
  );
}
