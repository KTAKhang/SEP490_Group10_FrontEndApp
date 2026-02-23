// Dùng để hiển thị giá trị tiền tệ chung
export const formatCurrency = (amount) => {
    const n = Number(amount);
    if (!isFinite(n)) return '0 VND';
    const formatted = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n);
    return `${formatted} VND`;
};