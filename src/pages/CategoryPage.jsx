import { useMemo, useState } from "react";
import CategoryLogoStrip from "../components/CategoryLogoStrip.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import { publicAssetUrl } from "../lib/api.js";
import { money } from "../lib/format.js";
import { categoryFromSlug, slugify } from "../lib/routing.js";

function categoryImage(category) {
  return publicAssetUrl(`public/images/${slugify(category)}.png`);
}

function categorySizes(products) {
  const sizes = new Map();

  products.forEach((product) => {
    (product.variants || []).forEach((variant) => {
      const key = variant.size_label || "Default";
      const previous = sizes.get(key);
      const price = Number(variant.price || 0);

      if (!previous || price < previous.price) {
        sizes.set(key, { label: key, price });
      }
    });
  });

  return Array.from(sizes.values());
}

export default function CategoryPage({ route, products, categories, addToCart }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const selected = categoryFromSlug(route.param);
  const categoryProducts = useMemo(
    () => (selected ? products.filter((product) => product.category === selected) : []),
    [products, selected]
  );

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

  const sizes = useMemo(() => (selected ? categorySizes(categoryProducts) : []), [categoryProducts, selected]);

  return (
    <main className="page-wrap">
      <div className="page-title page-title-row">
        <div>
          <p className="eyebrow">Choose by oil type</p>
          <h1>{selected || "All Categories"}</h1>
        </div>
        <span className="result-count">{visible.length} products</span>
      </div>

      {selected && (
        <section className="category-hero-banner">
          <div>
            <p className="eyebrow">Wood pressed/Cold pressed</p>
            <h2>{selected}</h2>
            <p>Explore every available size in this category and choose the bottle that fits your kitchen.</p>
            {sizes.length > 0 && (
              <div className="category-size-chips" aria-label={`${selected} sizes`}>
                {sizes.map((size) => (
                  <span key={size.label}>
                    {size.label}
                    {size.price > 0 ? ` from ${money(size.price)}` : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
          <img src={categoryImage(selected)} alt={selected} />
        </section>
      )}

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

      <ProductGrid products={visible} addToCart={addToCart} showVariantButtons={Boolean(selected)} />
    </main>
  );
}
