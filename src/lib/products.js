import { PLACEHOLDER_IMAGE } from "./constants.js";
import { publicAssetUrl } from "./api.js";

export function variantImage(variant) {
  return variant?.image_url ? publicAssetUrl(variant.image_url) : "";
}

export function productImage(product, variant = null) {
  const firstVariantImage = (product?.variants || []).find((item) => item.image_url)?.image_url;
  return variantImage(variant) || publicAssetUrl(product?.images?.[0]?.url || product?.image || firstVariantImage || PLACEHOLDER_IMAGE);
}

export function productImages(product) {
  const variantImages = (product?.variants || [])
    .filter((variant) => variant.image_url)
    .map((variant) => ({
      id: `variant-${variant.id || variant.size_label}`,
      url: variant.image_url,
    }));
  const images = product?.images?.length
    ? product.images
    : variantImages.length
      ? variantImages
      : [{ url: product?.image || PLACEHOLDER_IMAGE }];

  return images.map((image) => ({ ...image, url: publicAssetUrl(image.url) }));
}

export function variantOriginalPrice(variant, fallback = 0) {
  const price = Number(variant?.price ?? fallback ?? 0);
  return Number.isFinite(price) ? price : 0;
}

export function variantDiscountPrice(variant) {
  const originalPrice = variantOriginalPrice(variant);
  const discountPrice = Number(variant?.discount_price ?? 0);

  if (!Number.isFinite(discountPrice) || discountPrice <= 0 || discountPrice >= originalPrice) {
    return null;
  }

  return discountPrice;
}

export function variantSalePrice(variant, fallback = 0) {
  return variantDiscountPrice(variant) ?? variantOriginalPrice(variant, fallback);
}

export function hasVariantDiscount(variant) {
  return variantDiscountPrice(variant) !== null;
}
