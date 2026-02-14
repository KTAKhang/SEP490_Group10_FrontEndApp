import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    createOrderApi,
    getOrderByUserApi,
    cancelOrderApi,
    returnOrderApi,
} from '../../services/orderService';

export const fetchOrderByUser = createAsyncThunk(
    'order/fetchOrderByUser',
    async ({ page = 1, limit = 5, isLoadMore = false, search = '' } = {}, { rejectWithValue }) => {
        try {
            const response = await getOrderByUserApi(page, limit, search);
            return { ...response, isLoadMore, page };
        } catch (error) {
            console.error('fetchOrderByUser error:', error);
            return rejectWithValue(error.message || 'Failed to fetch orders');
        }
    }
);


export const createOrder = createAsyncThunk(
    'order/createOrder',
    async ({ selected_product_ids, receiverInfo }, { rejectWithValue }) => {
        try {

            const response = await createOrderApi({ selected_product_ids, receiverInfo });
            return response;
        } catch (error) {

            return rejectWithValue(error.message);
        }
    }
);
export const cancelOrder = createAsyncThunk(
    'order/cancelOrder',
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
    'order/returnOrder',
    async (order_id, { rejectWithValue }) => {
        try {
            const response = await returnOrderApi(order_id);
            return { order_id, message: response.message };
        } catch (error) {

            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    orders: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    createSuccess: false,
    newOrderId: null,
    cancelSuccess: false,
    cancelMessage: null,
    returnSuccess: false,
    returnMessage: null,
    // Pagination states
    currentPage: 1,
    totalPages: 1,
    hasMore: true,
    total: 0,
};

const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        clearOrderState: (state) => {
            state.orders = [];
            state.isLoading = false;
            state.isLoadingMore = false;
            state.error = null;
            state.createSuccess = false;
            state.newOrderId = null;
            state.cancelSuccess = false;
            state.cancelMessage = null;
            state.returnSuccess = false;
            state.returnMessage = null;
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
    },
    extraReducers: (builder) => {
        builder
            // Fetch orders by user
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

                // Extract orders and pagination info
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

                // Update orders list
                if (isLoadMore && page > 1) {
                    // Append new orders to existing ones
                    state.orders = [...state.orders, ...orders];
                } else {
                    // Replace orders (first load or refresh)
                    state.orders = orders;
                }

                // Update pagination info
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
                state.createSuccess = false;
                state.newOrderId = null;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.isLoading = false;
                state.createSuccess = true;
                state.newOrderId = action.payload.order_id;
                state.error = null;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.createSuccess = false;
                state.newOrderId = null;
                state.error = action.payload;
            })
            // Cancel order
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

                // Cập nhật trạng thái đơn hàng trong danh sách
                state.orders = state.orders.map(order =>
                    order._id === action.payload.order_id
                        ? { ...order, status: 'cancelled' }
                        : order
                );
            })
            .addCase(cancelOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.cancelSuccess = false;
                state.cancelMessage = null;
                state.error = action.payload;
            })
            // Return order
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

                // Cập nhật trạng thái đơn hàng trong danh sách
                state.orders = state.orders.map(order =>
                    order._id === action.payload.order_id
                        ? { ...order, status: 'returned' }
                        : order
                );
            })
            .addCase(returnOrder.rejected, (state, action) => {
                state.isLoading = false;
                state.returnSuccess = false;
                state.returnMessage = null;
                state.error = action.payload;
            });
    },
});

export const { clearOrderState, resetPagination } = orderSlice.actions;
export default orderSlice.reducer;
