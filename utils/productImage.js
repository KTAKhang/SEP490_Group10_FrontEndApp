import { API_BASE_URL } from '../config/apiConfig';

/**
 * Lấy URL ảnh sản phẩm từ object (product, cart item, order item).
 * Backend trả về images[] hoặc featuredImage, không có field image đơn.
 */
export function getProductImageUrl(productOrItem) {
  if (!productOrItem) return null;
  const url =
    (Array.isArray(productOrItem.images) && productOrItem.images[0]) ||
    productOrItem.featuredImage ||
    productOrItem.image ||
    productOrItem.product_image ||
    null;
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL.replace(/\/$/, '')}${url.startsWith('/') ? url : '/' + url}`;
}
