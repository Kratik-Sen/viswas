import { useMemo, useState } from "react";
import CategoryLogoStrip from "../components/CategoryLogoStrip.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import { categoryFromSlug } from "../lib/routing.js";

export default function CategoryPage({ route, products, categories, addToCart }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const selected = categoryFromSlug(route.param);

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory = selected ? product.category === selected : true;
      const matchesQuery = normalizedQuery
        ? `${product.name} ${product.category} ${product.description || ""}`.toLowerCase().includes(normalizedQuery)
        : true;
      return matchesCategory && matchesQuery;
    });

    return filtered.sort((a, b) => {
      if (sort === "price-low") return Number(a.price) - Number(b.price);
      if (sort === "price-high") return Number(b.price) - Number(a.price);
      if (sort === "stock") return Number(b.stock) - Number(a.stock);
      return Number(b.id) - Number(a.id);
    });
  }, [products, query, selected, sort]);

  return (
    <main className="page-wrap">
      <div className="page-title page-title-row">
        <div>
          <p className="eyebrow">Choose by oil type</p>
          <h1>{selected || "All Categories"}</h1>
        </div>
        <span className="result-count">{visible.length} products</span>
      </div>

      <div className="shop-toolbar">
        <label>
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search oils" />
        </label>
        <label>
          Sort
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-low">Price low to high</option>
            <option value="price-high">Price high to low</option>
            <option value="stock">Most stock</option>
          </select>
        </label>
      </div>

      <CategoryLogoStrip categories={categories} selected={selected} />

      <ProductGrid products={visible} addToCart={addToCart} />
    </main>
  );
}
