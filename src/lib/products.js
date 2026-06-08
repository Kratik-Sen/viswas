import { PLACEHOLDER_IMAGE } from "./constants.js";
import { publicAssetUrl } from "./api.js";

export function productImage(product) {
  return publicAssetUrl(product?.images?.[0]?.url || product?.image || PLACEHOLDER_IMAGE);
}

export function productImages(product) {
  const images = product?.images?.length ? product.images : [{ url: product?.image || PLACEHOLDER_IMAGE }];
  return images.map((image) => ({ ...image, url: publicAssetUrl(image.url) }));
}
