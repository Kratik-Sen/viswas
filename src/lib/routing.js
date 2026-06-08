import { CATEGORIES } from "./constants.js";

export function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function categoryFromSlug(slug) {
  return CATEGORIES.find((category) => slugify(category) === slug) || "";
}

export function getRoute() {
  const raw = window.location.hash.replace(/^#\/?/, "") || "home";
  const parts = raw.split("/");
  return {
    page: parts[0] || "home",
    param: decodeURIComponent(parts.slice(1).join("/")),
  };
}
