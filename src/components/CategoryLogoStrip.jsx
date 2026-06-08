import { slugify } from "../lib/routing.js";

function iconText(category) {
  return category
    .replace(" Oil", "")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);
}

function CategoryIcon({ label }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M34 7c7 8 14 17 14 28 0 10-7 18-16 18s-16-8-16-18C16 24 27 12 34 7Z" />
      <path d="M25 39c1 4 4 7 8 8" />
      <text x="32" y="35" textAnchor="middle">
        {label}
      </text>
    </svg>
  );
}

export default function CategoryLogoStrip({ categories, selected = "" }) {
  return (
    <section className="category-logo-strip" aria-label="Category shortcuts">
      <a className={!selected ? "active" : ""} href="#/category">
        <span className="category-logo-circle">
          <CategoryIcon label="All" />
        </span>
        <strong>All</strong>
      </a>
      {categories.map((category) => (
        <a className={selected === category ? "active" : ""} href={`#/category/${slugify(category)}`} key={category}>
          <span className="category-logo-circle">
            <CategoryIcon label={iconText(category)} />
          </span>
          <strong>{category.replace(" Oil", "")}</strong>
        </a>
      ))}
    </section>
  );
}
