import { CATEGORIES } from "./constants.js";

export function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function categoryFromSlug(slug) {
  return CATEGORIES.find((category) => slugify(category) === slug) || "";
}

export function productSlug(product) {
  return `${product.id}-${slugify(product.name || "product")}`;
}

export function productHref(product) {
  return `#/product/${productSlug(product)}`;
}

export function productIdFromParam(param) {
  return Number(String(param || "").split("-")[0]);
}

export function getRoute() {
  const raw = window.location.hash.replace(/^#\/?/, "") || "home";
  const parts = raw.split("/");
  return {
    page: parts[0] || "home",
    param: decodeURIComponent(parts.slice(1).join("/")),
  };
}
