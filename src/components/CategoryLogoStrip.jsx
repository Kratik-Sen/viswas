import { useEffect, useRef } from "react";
import { publicAssetUrl } from "../lib/api.js";
import { slugify } from "../lib/routing.js";

const CATEGORY_IMAGES = {
  "Groundnut Oil": "public/images/groundnut oil.png",
  "Sunflower Oil": "public/images/sunflower oil.png",
  "Black Mustard Oil": "public/images/black mustard oil.png",
  "Yellow Mustard Oil": "public/images/yellow musturd oil.png",
  "Coconut Oil": "public/images/coconut oil.png",
  "White Sesame Oil": "public/images/white sesame oil.png",
  "Black Sesame Oil": "public/images/black sesame oil.png",
  "Almond Oil": "public/images/almond oil.png",
  "Flaxseed Oil": "public/images/flaxseed oil.png",
};

function categoryImage(category) {
  return publicAssetUrl(CATEGORY_IMAGES[category] || "public/images/logo.png");
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
        <span aria-hidden="true">{"<"}</span>
      </button>

      <nav className="category-logo-strip" aria-label="Category shortcuts" ref={stripRef}>
        <a className={!selected ? "active" : ""} href="#/category">
          <span className="cat-icon-wrap">
            <img src={publicAssetUrl("public/images/logo.png")} alt="" aria-hidden="true" />
          </span>
          <strong>All</strong>
        </a>

        {categories.map((category) => (
          <a
            key={category}
            className={selected === category ? "active" : ""}
            href={`#/category/${slugify(category)}`}
          >
            <span className="cat-icon-wrap">
              <img src={categoryImage(category)} alt="" aria-hidden="true" />
            </span>
            <strong>{category.replace(" Oil", "")}</strong>
          </a>
        ))}
      </nav>

      <button className="category-slide-button right" type="button" aria-label="Next categories" onClick={() => slide(1)}>
        <span aria-hidden="true">{">"}</span>
      </button>
    </div>
  );
}
