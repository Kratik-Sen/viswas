import { useEffect, useRef } from "react";
import { slugify } from "../lib/routing.js";

/* -------------------------------------------------------
   SVG icon map for common oil / product categories
   All icons: outlined, no fill, stroke-based
   ------------------------------------------------------- */
const ICON_MAP = {
  "All": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="20" r="12" />
      <line x1="29" y1="29" x2="40" y2="40" />
      <line x1="14" y1="20" x2="26" y2="20" />
      <line x1="20" y1="14" x2="20" y2="26" />
    </svg>
  ),
  "Ghee": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="24" cy="32" rx="13" ry="7" />
      <path d="M11 32V26c0-4 6-10 13-18 7 8 13 14 13 18v6" />
      <path d="M17 24c2-3 4-5 7-8" />
    </svg>
  ),
  "Oils": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="17" y="18" width="14" height="22" rx="3" />
      <path d="M20 18v-4c0-1 .9-2 2-2h4c1.1 0 2 .9 2 2v4" />
      <path d="M22 12v-3" />
      <path d="M17 28h14" />
      <path d="M20 35c0 2 8 2 8 0" />
    </svg>
  ),
  "Combos": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="20" width="12" height="18" rx="2" />
      <rect x="28" y="14" width="12" height="24" rx="2" />
      <path d="M10 20v-3c0-1 .9-2 2-2h8c1.1 0 2 .9 2 2v3" />
      <path d="M30 14v-3c0-1 .9-2 2-2h8c1.1 0 2 .9 2 2v3" />
      <path d="M14 9v3" />
      <path d="M34 5v5" />
    </svg>
  ),
  "Atta": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 36h28l-3-18H13L10 36z" />
      <path d="M16 18c0-5 3-9 8-9s8 4 8 9" />
      <path d="M13 24h22" />
      <path d="M12 30h24" />
    </svg>
  ),
  "Deal": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="16" width="34" height="22" rx="3" />
      <path d="M7 22h34" />
      <path d="M16 16v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <circle cx="24" cy="31" r="4" />
      <path d="M21.8 31h4.4" />
    </svg>
  ),
  "Superfoods": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 8c-5 3-10 9-10 16 0 7 4 12 10 12s10-5 10-12c0-7-5-13-10-16z" />
      <path d="M20 28c1 2 3 4 4 4" />
      <path d="M32 14c2 4 3 8 2 12" />
    </svg>
  ),
  "Groundnut": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="24" cy="26" rx="11" ry="14" />
      <path d="M24 12c0-3 3-5 3-5s-3-2-3-5" />
      <path d="M18 22c3-2 6-2 12 0" />
      <path d="M17 28c3 2 6 2 14 0" />
    </svg>
  ),
  "Coconut": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 10c-8 0-14 5-14 14 0 9 6 16 14 16s14-7 14-16c0-9-6-14-14-14z" />
      <path d="M24 10c0-5 4-7 4-7s4 2 4 7" />
      <path d="M16 20c3-4 13-4 16 0" />
      <path d="M13 28c3 5 19 5 22 0" />
    </svg>
  ),
  "Sunflower": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="22" r="6" />
      <path d="M24 8v4M24 32v4M8 22h4M32 22h4M12.3 12.3l2.8 2.8M32.9 32.9l2.8 2.8M12.3 31.7l2.8-2.8M32.9 11.1l2.8-2.8" />
      <line x1="24" y1="32" x2="24" y2="42" />
    </svg>
  ),
  "Mustard": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="14" r="4" />
      <circle cx="32" cy="14" r="4" />
      <circle cx="24" cy="22" r="4" />
      <circle cx="16" cy="30" r="4" />
      <circle cx="32" cy="30" r="4" />
    </svg>
  ),
  "Black Mustard": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="14" r="4" />
      <circle cx="32" cy="14" r="4" />
      <circle cx="24" cy="22" r="4" />
      <circle cx="16" cy="30" r="4" />
      <circle cx="32" cy="30" r="4" />
    </svg>
  ),
  "Yellow Mustard": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="16" cy="14" r="4" />
      <circle cx="32" cy="14" r="4" />
      <circle cx="24" cy="22" r="4" />
      <circle cx="16" cy="30" r="4" />
      <circle cx="32" cy="30" r="4" />
    </svg>
  ),
  "Sesame": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="24" cy="12" rx="5" ry="7" />
      <ellipse cx="24" cy="30" rx="5" ry="7" />
      <path d="M19 18c-3 1-7 3-7 7s4 6 7 6" />
      <path d="M29 18c3 1 7 3 7 7s-4 6-7 6" />
    </svg>
  ),
  "Almond": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 8c-7 0-12 8-12 16 0 9 5 16 12 16s12-7 12-16c0-8-5-16-12-16z" />
      <path d="M20 24c1-3 3-6 4-8" />
    </svg>
  ),
  "Flaxseed": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="20" cy="18" rx="5" ry="8" transform="rotate(-20 20 18)" />
      <ellipse cx="28" cy="18" rx="5" ry="8" transform="rotate(20 28 18)" />
      <ellipse cx="24" cy="28" rx="5" ry="8" />
      <line x1="24" y1="36" x2="24" y2="42" />
    </svg>
  ),
  "Castor": (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 8c-4 5-8 11-8 18 0 7 4 12 8 12s8-5 8-12c0-7-4-13-8-18z" />
      <path d="M24 10c4-3 8-2 10 2" />
      <path d="M24 10c-4-3-8-2-10 2" />
    </svg>
  ),
};

function getCategoryIcon(category) {
  // Exact match first
  if (ICON_MAP[category]) return ICON_MAP[category];

  // Partial match
  const keys = Object.keys(ICON_MAP);
  for (const key of keys) {
    if (category.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(category.toLowerCase())) {
      return ICON_MAP[key];
    }
  }

  // Fallback: a generic oil drop icon
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 7c-7 9-13 17-13 24 0 9 6 14 13 14s13-5 13-14c0-7-6-15-13-24z" />
      <path d="M18 34c1 4 4 6 6 6" />
    </svg>
  );
}

export default function CategoryLogoStrip({ categories, selected = "" }) {
  const stripRef = useRef(null);

  useEffect(() => {
    const activeItem = stripRef.current?.querySelector("a.active");
    activeItem?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selected, categories]);

  function slide(direction) {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({
      left: direction * Math.min(strip.clientWidth * 0.82, 420),
      behavior: "smooth",
    });
  }

  return (
    <div className="category-strip-shell">
      <button className="category-slide-button left" type="button" aria-label="Previous categories" onClick={() => slide(-1)}>
        <span aria-hidden="true">‹</span>
      </button>

      <nav className="category-logo-strip" aria-label="Category shortcuts" ref={stripRef}>
        <a className={!selected ? "active" : ""} href="#/category">
          <span className="cat-icon-wrap">{ICON_MAP["All"]}</span>
          <strong>All</strong>
        </a>

        {categories.map((category) => (
          <a
            key={category}
            className={selected === category ? "active" : ""}
            href={`#/category/${slugify(category)}`}
          >
            <span className="cat-icon-wrap">{getCategoryIcon(category)}</span>
            <strong>{category.replace(" Oil", "")}</strong>
          </a>
        ))}
      </nav>

      <button className="category-slide-button right" type="button" aria-label="Next categories" onClick={() => slide(1)}>
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}
