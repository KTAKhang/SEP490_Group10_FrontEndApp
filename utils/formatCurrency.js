//Dùng để hiển thị giá trị tiền tệ chung
export const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VND";
}; 