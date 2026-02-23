import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

//import { API_BASE_URL } from '../config/api';

const API_BASE_URL = 'http://10.0.2.2:3001';


/**
 * Chuẩn hóa order từ backend cho UI: order_id, order_status (từ order_status_id)
 */
function normalizeOrder(order) {
  if (!order) return order;
  const id = order.order_id ?? order._id;
  return {
    ...order,
    order_id: typeof id === 'string' ? id : id?.toString?.() ?? id,
    order_status: order.order_status ?? order.order_status_id,
  };
}

/**
 * Backend: GET /order/my-orders (customer - authUserMiddleware)
 * Query: page, limit, search (order ID), status_names (PENDING, PAID, READY-TO-SHIP, ...), sortBy, sortOrder
 * Response: { status: "OK", data: Order[], pagination: { page, limit, total, totalPages } }
 */
export async function getOrderByUserApi(page = 1, limit = 10, options = {}) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('Không tìm thấy token, vui lòng đăng nhập lại.');
    }

    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    const { status_names, search, sortBy, sortOrder } = options;
    if (status_names && String(status_names).trim() !== '') {
      const normalized = String(status_names).trim().toUpperCase().replace(/-/g, '_');
      params.append('status_names', normalized);
    }
    if (search && String(search).trim() !== '') {
      params.append('search', String(search).trim());
    }
    if (sortBy) params.append('sortBy', String(sortBy));
    if (sortOrder) params.append('sortOrder', String(sortOrder));

    const response = await axios.get(`${API_BASE_URL}/order/my-orders?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = response.data;

    if (result.status !== 'OK') {
      throw new Error(result.message || 'Lỗi lấy danh sách đơn hàng');
    }

    const rawOrders = result.data || [];
    const orders = rawOrders.map(normalizeOrder);
    const pag = result.pagination || { page: 1, limit, total: 0, totalPages: 0 };

    const firstOrder = rawOrders[0];
    if (firstOrder) {
      const hasDetails = Array.isArray(firstOrder.details) && firstOrder.details.length > 0;
      console.log('[OrderList API] first order has details?', hasDetails, 'details?.length=', firstOrder.details?.length ?? 0);
    }

    return {
      orders,
      page: pag.page ?? page,
      limit: pag.limit ?? limit,
      total: pag.total ?? 0,
      totalPages: pag.totalPages ?? 1,
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Lỗi không xác định khi lấy đơn hàng'
    );
  }
}
/**
 * Backend: GET /order/my-orders/:id (customer - authUserMiddleware)
 * Trả về đơn hàng đầy đủ (details, reviews, payment, ...)
 */
export async function getMyOrderByIdApi(orderId) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Vui lòng đăng nhập.');
    const id = orderId != null
      ? (typeof orderId === 'string' ? orderId : (orderId.toString?.() || String(orderId)))
      : '';
    if (!id) throw new Error('Thiếu ID đơn hàng.');

    const url = `${API_BASE_URL}/order/my-orders/${id}`;
    console.log('[OrderDetail API] GET', url);
    const response = await axios.get(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const result = response.data;
    console.log('[OrderDetail API] response.data keys:', result ? Object.keys(result) : 'null');
    console.log('[OrderDetail API] result.status:', result?.status, 'result.data?', !!result?.data);
    if (result?.data) {
      console.log('[OrderDetail API] result.data keys:', Object.keys(result.data));
      console.log('[OrderDetail API] result.data.details length:', result.data.details?.length ?? 'no details');
    }
    if (result && result.status === 'ERR') {
      throw new Error(result.message || 'Lỗi lấy chi tiết đơn hàng');
    }
    if (result && result.status != null && result.status !== 'OK') {
      throw new Error(result.message || 'Lỗi lấy chi tiết đơn hàng');
    }

    const data = result?.data != null ? result.data : result;
    if (!data || typeof data !== 'object') return null;

    const orderObj = data.order != null ? data.order : data;
    let detailsArr = [];
    if (Array.isArray(data.details)) detailsArr = data.details;
    else if (Array.isArray(data.order_details)) detailsArr = data.order_details;
    else if (Array.isArray(data.items)) detailsArr = data.items;
    else if (orderObj && Array.isArray(orderObj.details)) detailsArr = orderObj.details;
    else if (orderObj && Array.isArray(orderObj.order_details)) detailsArr = orderObj.order_details;

    console.log('[OrderDetail API] parsed details length:', detailsArr.length, 'orderObj?', !!orderObj);
    const out = {
      order: orderObj ? normalizeOrder(orderObj) : null,
      details: detailsArr,
      reviews: data.reviews ?? orderObj?.reviews ?? [],
      payment: data.payment ?? orderObj?.payment ?? null,
    };
    console.log('[OrderDetail API] returning details.length:', out.details?.length ?? 0);
    return out;
  } catch (error) {
    console.log('[OrderDetail API] ERROR', error?.message, error?.response?.status, error?.response?.data);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Lỗi không xác định khi lấy chi tiết đơn hàng'
    );
  }
}

export async function createOrderApi({ selected_product_ids, receiverInfo, payment_method,city }) {
    try {
        const token = await AsyncStorage.getItem('token');

        const isMobile=true;
         console.log("selected_product_ids",selected_product_ids)
          console.log("receiverInfo",receiverInfo)
        console.log("city",city)

        const response = await axios.post(
            `${API_BASE_URL}/order/create`,
            { selected_product_ids, receiverInfo, payment_method,city,isMobile },
            {
               headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true
            }
        );

        const data = response.data;
 console.log("response.data",response.data)
        if (!data.success) {
            throw new Error(data.message || 'Tạo đơn hàng thất bại');
        }

        return data;
    } catch (error) {
        console.error('createOrderApi error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Lỗi không xác định khi tạo đơn hàng');
    }
}


/**
 * Backend: hủy đơn (chỉ PENDING) - PUT /order/cancel/:order_id
 */

export async function checkShippingApi({ selected_product_ids, city}) {
    try {
        const token = await AsyncStorage.getItem('token');
        // console.log("selected_product_ids",selected_product_ids)
        // console.log("city",city)
        const response = await axios.post(
            `${API_BASE_URL}/shipping/check`,
            { selected_product_ids, city },
            {
               headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true
            }
        );
        const data = response.data;
        if (data.status!= "OK") {
            throw new Error(data.message || 'Tạo đơn hàng thất bại');
        }

        return data;
    } catch (error) {
        console.error('checkShippingApi error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Lỗi không xác định khi tạo đơn hàng');
    }
}




export async function cancelOrderApi(order_id) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Vui lòng đăng nhập.');

    const response = await axios.put(
      `${API_BASE_URL}/order/cancel/${order_id}`,
      {},
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = response.data;
    const ok = data.success === true || data.status === 'OK';
    if (!ok) {
      throw new Error(data.message || 'Hủy đơn hàng thất bại');
    }

    return { success: true, message: data.message || 'Hủy đơn hàng thành công' };
  } catch (error) {
    console.error('cancelOrderApi error:', error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Không thể hủy đơn hàng'
    );
  }
}

/**
 * Backend: POST /order/retry-payment (authUserMiddleware) - thanh toán lại VNPay
 */
export async function retryPaymentApi(order_id) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Vui lòng đăng nhập.');

    const response = await axios.post(
      `${API_BASE_URL}/order/retry-payment`,
      { orderId: order_id },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = response.data;
    const ok = data.success === true || data.status === 'OK';
    if (!ok) {
      throw new Error(data.message || 'Tạo link thanh toán thất bại');
    }

    return {
      success: true,
      message: data.message,
      paymentUrl: data.paymentUrl ?? data.payment_url ?? data.url,
    };
  } catch (error) {
    console.error('retryPaymentApi error:', error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Không thể tạo thanh toán lại'
    );
  }
}

/**
 * Trả hàng - nếu backend có endpoint PUT /order/return/:id
 */
export async function returnOrderApi(order_id) {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Vui lòng đăng nhập.');

    const response = await axios.put(
      `${API_BASE_URL}/order/return/${order_id}`,
      {},
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = response.data;

    if (!data.success) {
      throw new Error(data.message || 'Trả hàng thất bại');
    }

    return { success: true, message: data.message || 'Trả hàng thành công' };
  } catch (error) {
    console.error('returnOrderApi error:', error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        'Không thể trả hàng'
    );
  }
}
