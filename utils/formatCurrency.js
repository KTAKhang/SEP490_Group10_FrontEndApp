// Dùng để hiển thị giá trị tiền tệ chung.
// Giá từ 1.000.000 VND trở lên thu gọn thành dạng 1.000k VND để tránh bể khung.
export const formatCurrency = (amount) => {
    const num = Number(amount);
    if (isNaN(num)) return '0 VND';
    if (num >= 1000000) {
        const k = Math.round(num / 1000);
        const kStr = k.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return kStr + 'k VND';
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND';
}; 