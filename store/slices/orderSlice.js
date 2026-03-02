import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createOrderApi,
  getOrderByUserApi,
  getMyOrderByIdApi,
  cancelOrderApi,
  returnOrderApi,
  retryPaymentApi,
  checkShippingApi,
} from "../../services/orderService";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const fetchOrderByUser = createAsyncThunk(
  "order/fetchOrderByUser",
  async (
    {
      page = 1,
      limit = 10,
      isLoadMore = false,
      status_names = "",
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const options = { status_names, search, sortBy, sortOrder };
      const response = await getOrderByUserApi(page, limit, options);
      return { ...response, isLoadMore, page: response.page };
    } catch (error) {
      console.error("fetchOrderByUser error:", error);
      return rejectWithValue(error.message || "Failed to fetch orders");
    }
  }
);

export const fetchOrderDetailByUser = createAsyncThunk(
  "order/fetchOrderDetailByUser",
  async (orderId, { rejectWithValue }) => {
    try {
      console.log(
        "[orderSlice] fetchOrderDetailByUser called, orderId:",
        orderId,
        typeof orderId
      );
      const order = await getMyOrderByIdApi(orderId);
      console.log(
        "[orderSlice] fetchOrderDetailByUser fulfilled, order?",
        !!order,
        "details.length:",
        order?.details?.length ?? 0
      );
      return order;
    } catch (error) {
      console.error(
        "[orderSlice] fetchOrderDetailByUser error:",
        error?.message
      );
      return rejectWithValue(
        error.message || "Failed to fetch order detail"
      );
    }
  }
);

export const createOrder = createAsyncThunk(
  "order/createOrder",
  async (
    { selected_product_ids, receiverInfo, payment_method, city, discount_id },
    { rejectWithValue }
  ) => {
    try {
      const response = await createOrderApi({
        selected_product_ids,
        receiverInfo,
        payment_method,
        city,
        discount_id: discount_id || undefined,
      });
      if (response.success) {
        await AsyncStorage.removeItem("checkout_session_id");

        if (response.redirect_url) {
          await Linking.openURL(response.redirect_url);
          return;
        }
        if (response.payment_url) {
          await Linking.openURL(response.payment_url);
          return response;
        }
      }

      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkShipping = createAsyncThunk(
  "order/checkShipping",
  async ({ selected_product_ids, city }, { rejectWithValue }) => {
    try {
      const response = await checkShippingApi({
        selected_product_ids,
        city,
      });

      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "order/cancelOrder",
  async (order_id, { rejectWithValue }) => {
    try {
      const response = await cancelOrderApi(order_id);
      return { order_id, message: response.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const returnOrder = createAsyncThunk(
  "order/returnOrder",
  async (order_id, { rejectWithValue }) => {
    try {
      const response = await returnOrderApi(order_id);
      return { order_id, message: response.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const retryPayment = createAsyncThunk(
  "order/retryPayment",
  async (order_id, { rejectWithValue }) => {
    try {
      const response = await retryPaymentApi(order_id);
      return {
        order_id,
        message: response.message,
        paymentUrl: response.paymentUrl,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  orders: [],
  isLoading: false,
  loading: false,
  order_id: null,
  payment_url: null,
  isLoadingMore: false,
  error: null,
  createSuccess: false,
  newOrderId: null,
  cancelSuccess: false,
  cancelMessage: null,
  returnSuccess: false,
  returnMessage: null,
  orderDetail: null,
  detailLoading: false,
  detailError: null,
  retryPaymentUrl: null,
  shippingType: null,
  shippingFee: 0,
  totalWeight: 0,
  currentPage: 1,
  totalPages: 1,
  hasMore: true,
  total: 0,
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearOrderState: (state) => {
      state.orders = [];
      state.isLoading = false;
      state.loading = false;
      state.order_id = null;
      state.payment_url = null;
      state.isLoadingMore = false;
      state.error = null;
      state.createSuccess = false;
      state.newOrderId = null;
      state.cancelSuccess = false;
      state.cancelMessage = null;
      state.returnSuccess = false;
      state.returnMessage = null;
      state.orderDetail = null;
      state.detailLoading = false;
      state.detailError = null;
      state.retryPaymentUrl = null;
      state.shippingType = null;
      state.shippingFee = 0;
      state.totalWeight = 0;
      state.currentPage = 1;
      state.totalPages = 1;
      state.hasMore = true;
      state.total = 0;
    },
    resetPagination: (state) => {
      state.currentPage = 1;
      state.totalPages = 1;
      state.hasMore = true;
      state.total = 0;
      state.cancelSuccess = false;
      state.cancelMessage = null;
    },
    clearOrderDetail: (state) => {
      state.orderDetail = null;
      state.detailLoading = false;
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderByUser.pending, (state, action) => {
        const { isLoadMore } = action.meta.arg || {};
        if (isLoadMore) {
          state.isLoadingMore = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchOrderByUser.fulfilled, (state, action) => {
        const { isLoadMore, page } = action.payload;

        if (isLoadMore) {
          state.isLoadingMore = false;
        } else {
          state.isLoading = false;
        }

        let orders = [];
        let paginationInfo = {};

        if (action.payload && action.payload.orders) {
          orders = action.payload.orders;
          paginationInfo = {
            total: parseInt(action.payload.total) || 0,
            currentPage: parseInt(action.payload.page) || 1,
            totalPages: parseInt(action.payload.totalPages) || 1,
          };
        } else if (Array.isArray(action.payload)) {
          orders = action.payload;
          paginationInfo = {
            total: action.payload.length,
            currentPage: 1,
            totalPages: 1,
          };
        } else {
          orders = [];
          paginationInfo = {
            total: 0,
            currentPage: 1,
            totalPages: 1,
          };
        }

        if (isLoadMore && page > 1) {
          state.orders = [...state.orders, ...orders];
        } else {
          state.orders = orders;
        }

        state.total = paginationInfo.total;
        state.currentPage = paginationInfo.currentPage;
        state.totalPages = paginationInfo.totalPages;
        state.hasMore = paginationInfo.currentPage < paginationInfo.totalPages;

        state.error = null;
      })
      .addCase(fetchOrderByUser.rejected, (state, action) => {
        const { isLoadMore } = action.meta.arg || {};

        if (isLoadMore) {
          state.isLoadingMore = false;
        } else {
          state.isLoading = false;
        }
        state.error = action.payload;
      })
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.createSuccess = false;
        state.newOrderId = null;
        state.order_id = null;
        state.payment_url = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload || {};
        state.createSuccess = !!payload.success;
        state.newOrderId = payload.data?.order_id || null;
        state.order_id = payload.data?.order_id || null;
        state.payment_url = payload.data?.payment_url || null;
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.createSuccess = false;
        state.newOrderId = null;
        state.error =
          action.payload || action.error?.message || "Tạo đơn hàng thất bại";
      })
      .addCase(checkShipping.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(checkShipping.fulfilled, (state, action) => {
        state.loading = false;
        state.shippingType = action.payload.data?.shippingType || null;
        state.totalWeight = action.payload.data?.totalWeight || null;
        state.shippingFee = action.payload.data?.shippingFee || 0;
      })
      .addCase(checkShipping.rejected, (state, action) => {
        state.loading = false;
        state.createSuccess = false;
        state.newOrderId = null;
        state.error = action.payload;
      })
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
        state.cancelSuccess = false;
        state.cancelMessage = null;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cancelSuccess = true;
        state.cancelMessage = action.payload.message;

        state.orders = state.orders.map((order) =>
          order._id === action.payload.order_id
            ? { ...order, status: "cancelled" }
            : order
        );
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.cancelSuccess = false;
        state.cancelMessage = null;
        state.error = action.payload;
      })
      .addCase(returnOrder.pending, (state) => {
        state.isLoading = true;
        state.returnSuccess = false;
        state.returnMessage = null;
        state.error = null;
      })
      .addCase(returnOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.returnSuccess = true;
        state.returnMessage = action.payload.message;

        state.orders = state.orders.map((order) =>
          order._id === action.payload.order_id
            ? { ...order, status: "returned" }
            : order
        );
      })
      .addCase(returnOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.returnSuccess = false;
        state.returnMessage = null;
        state.error = action.payload;
      })
      .addCase(fetchOrderDetailByUser.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchOrderDetailByUser.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.orderDetail = action.payload;
        state.detailError = null;
        console.log(
          "[orderSlice] fulfilled: orderDetail.details.length=",
          action.payload?.details?.length ?? 0
        );
      })
      .addCase(fetchOrderDetailByUser.rejected, (state, action) => {
        state.detailLoading = false;
        state.orderDetail = null;
        state.detailError = action.payload;
        console.log("[orderSlice] rejected:", action.payload);
      })
      .addCase(retryPayment.fulfilled, (state, action) => {
        state.retryPaymentUrl = action.payload?.paymentUrl ?? null;
      })
      .addCase(retryPayment.rejected, (state) => {
        state.retryPaymentUrl = null;
      });
  },
});

export const {
  clearOrderState,
  resetPagination,
  clearOrderDetail,
} = orderSlice.actions;
export default orderSlice.reducer;
