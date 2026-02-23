import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Đơn hàng - chỉ gọi backend (folder src).
 * GET /order/my-orders, GET /order/my-orders/:id, POST /order/create, PUT /order/cancel/:id
 */

async function authHeaders() {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Bạn cần đăng nhập');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Backend trả về: { status: "OK", data: [...], pagination: { page, limit, total, totalPages } }
 * Chuẩn hóa: mỗi order có order_id (string) để UI dùng; hỗ trợ status_name để lọc.
 */
export async function getOrderByUserApi(
  page = 1,
  limit = 5,
  search = '',
  status_name = ''
) {
  try {
    const params = { page, limit };
    if (search && search.trim()) params.search = search.trim();
    if (status_name && status_name.trim()) params.status_name = status_name.trim();
    const response = await axios.get(`${API_BASE_URL}/order/my-orders`, {
      params,
      headers: await authHeaders(),
    });
    const res = response.data;
    if (res.status !== 'OK') {
      throw new Error(res.message || 'Lỗi lấy danh sách đơn hàng');
    }
    const rawOrders = res.data ?? [];
    const orders = rawOrders.map((o) => ({
      ...o,
      order_id: o.order_id ?? (o._id != null ? String(o._id) : ''),
    }));
    const pagination = res.pagination ?? {};
    const totalCount = pagination.total ?? orders.length;
    const totalPages =
      pagination.totalPages ??
      (Math.ceil(totalCount / limit) || 1);

    return {
      orders,
      total: totalCount,
      page: pagination.page ?? page,
      totalPages,
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Lỗi lấy danh sách đơn hàng'
    );
  }
}

/**
 * Backend: POST /order/create
 * Body: selected_product_ids, receiverInfo, payment_method, city, discount_id?
 */
export async function createOrderApi({
  selected_product_ids,
  receiverInfo,
  payment_method = 'COD',
  city,
  discount_id,
}) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/order/create`,
      {
        selected_product_ids,
        receiverInfo,
        payment_method: payment_method || 'COD',
        city: city || '',
        discount_id: discount_id || null,
      },
      { headers: await authHeaders() }
    );
    const data = response.data;
    if (data.success === false) {
      throw new Error(data.message || 'Tạo đơn hàng thất bại');
    }
    const orderId =
      data.order_id ?? data.orderId ?? data.data?.order_id ?? data.order?._id;
    return {
      success: true,
      order_id: orderId != null ? String(orderId) : undefined,
      ...data,
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Tạo đơn hàng thất bại'
    );
  }
}

export async function cancelOrderApi(order_id) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/order/cancel/${order_id}`,
      {},
      { headers: await authHeaders() }
    );
    const data = response.data;
    if (data.success === false) {
      throw new Error(data.message || 'Hủy đơn hàng thất bại');
    }
    return { success: true, message: data.message || 'Hủy đơn hàng thành công' };
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Hủy đơn hàng thất bại'
    );
  }
}

/**
 * Backend hiện không có API trả hàng. Giữ để UI không lỗi, gọi sẽ báo chưa hỗ trợ.
 */
export async function returnOrderApi(order_id) {
  throw new Error('Tính năng trả hàng chưa được hỗ trợ');
}
