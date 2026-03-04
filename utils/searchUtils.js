/**
 * Chuẩn hóa chuỗi tiếng Việt: bỏ dấu để tìm kiếm không dấu vẫn ra kết quả (vd: "Mit" → "mit" khớp "Mít").
 * Backend nên so sánh với tên đã chuẩn hóa tương tự.
 */

/**
 * Bỏ dấu tiếng Việt, chuyển về chữ thường (để search "Mit" / "mit" khớp "Mít").
 * @param {string} str
 * @returns {string}
 */
export function removeVietnameseTone(str) {
  if (str == null || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[àáảãạăằắẳẵặâầấẩẫậ]/gi, 'a')
    .replace(/[èéẻẽẹêềếểễệ]/gi, 'e')
    .replace(/[ìíỉĩị]/gi, 'i')
    .replace(/[òóỏõọôồốổỗộơờớởỡợ]/gi, 'o')
    .replace(/[ùúủũụưừứửữự]/gi, 'u')
    .replace(/[ỳýỷỹỵ]/gi, 'y')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}
