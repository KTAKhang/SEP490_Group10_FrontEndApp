/**
 *api config cho app, thay đổi dựa theo thực tế
 1. Nếu backend ở localhost thì mở cmd gõ ipconfig xem ipv4 address và thay đổi giá trị đúng ở file .env
 2. Nếu backend ở host thật thì thay đổi giá trị đúng ở file .env thành url đúng ví dụ dùng Render: https://my-shop-apps-backend.onrender.com
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || '').trim();
