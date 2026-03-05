export const formatCurrency = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return '0 VND';

    // >= 1 tỷ
    if (num >= 1_000_000_000) {
      const billion = num / 1_000_000_000;
      return Number.isInteger(billion)
        ? `${billion}B VND`
        : `${billion.toFixed(1)}B VND`;
    }

    // >= 1 triệu
    if (num >= 1_000_000) {
      const million = num / 1_000_000;
      return Number.isInteger(million)
        ? `${million}M VND`
        : `${million.toFixed(1)}M VND`;
    }

    // < 1 triệu
    return num.toLocaleString('vi-VN') + ' VND';
  };
