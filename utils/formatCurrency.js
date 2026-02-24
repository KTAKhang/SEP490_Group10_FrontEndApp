export const formatCurrency = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return '0 đ';

    // >= 1 tỷ
    if (num >= 1_000_000_000) {
      const billion = num / 1_000_000_000;
      return Number.isInteger(billion)
        ? `${billion} tỷ`
        : `${billion.toFixed(1)} tỷ`;
    }

    // >= 1 triệu
    if (num >= 1_000_000) {
      const million = num / 1_000_000;
      return Number.isInteger(million)
        ? `${million} triệu`
        : `${million.toFixed(1)} triệu`;
    }

    // < 1 triệu
    return num.toLocaleString('vi-VN') + ' đ';
  };
