import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { createReviewApi, updateReviewApi, getReviewsByOrderIdApi, getProductReviewsByProductId } from '../../services/reviewService';


// Async thunk for fetching product reviews by product ID
export const fetchProductReviewsByProductId = createAsyncThunk(
    'review/fetchProductReviewsByProductId',
    async (product_id, { rejectWithValue }) => {
        try {
            const response = await getProductReviewsByProductId(product_id);
            return { product_id, reviews: response };
        } catch (error) {
            return rejectWithValue({ product_id, error: error.message });
        }
    }
);

export const createReview = createAsyncThunk(
    'review/createReview',
    async ({ product_id, order_detail_id, rating, review_content }, { rejectWithValue }) => {
        try {
            const response = await createReviewApi({ product_id, order_detail_id, rating, review_content });
            return response.review;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);
export const updateReview = createAsyncThunk(
    'review/updateReview',
    async ({ review_id, rating, review_content }, { rejectWithValue }) => {
        try {
            const response = await updateReviewApi({ review_id, rating, review_content });
            return response.review;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const getReviewsByOrderId = createAsyncThunk(
    'review/getReviewsByOrderId',
    async (order_id, { rejectWithValue }) => {
        try {
            const reviews = await getReviewsByOrderIdApi(order_id);
            return reviews;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);



const initialState = {
    reviewsByProduct: {}, // Store reviews by product ID: { productId: { reviews: [], isLoading: false, error: null } }
    isLoading: false,
    error: null,
    successMessage: null,
    lastAction: null,
};

const reviewSlice = createSlice({
    name: 'review',
    initialState,
    reducers: {
        clearReviewState: (state) => {
            state.reviewsByProduct = {};
            state.isLoading = false;
            state.error = null;
            state.successMessage = null
        },
        clearProductReviews: (state, action) => {
            const productId = action.payload;
            if (state.reviewsByProduct[productId]) {
                delete state.reviewsByProduct[productId];
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch product reviews by product ID
            .addCase(fetchProductReviewsByProductId.pending, (state, action) => {
                const productId = action.meta.arg;
                // Khởi tạo state cho sản phẩm cụ thể nếu chưa có
                if (!state.reviewsByProduct[productId]) {
                    state.reviewsByProduct[productId] = {
                        reviews: [],
                        isLoading: false,
                        error: null,
                    };
                }
                state.reviewsByProduct[productId].isLoading = true;
                state.reviewsByProduct[productId].error = null;
            })
            .addCase(fetchProductReviewsByProductId.fulfilled, (state, action) => {
                const { product_id, reviews } = action.payload;
                // Khởi tạo state cho sản phẩm cụ thể nếu chưa có
                if (!state.reviewsByProduct[product_id]) {
                    state.reviewsByProduct[product_id] = {
                        reviews: [],
                        isLoading: false,
                        error: null,
                    };
                }
                // Chỉ cập nhật reviews cho sản phẩm cụ thể
                state.reviewsByProduct[product_id].reviews = reviews || [];
                state.reviewsByProduct[product_id].isLoading = false;
                state.reviewsByProduct[product_id].error = null;
            })
            .addCase(fetchProductReviewsByProductId.rejected, (state, action) => {
                const { product_id, error } = action.payload || {};
                if (product_id) {
                    // Khởi tạo state cho sản phẩm cụ thể nếu chưa có
                    if (!state.reviewsByProduct[product_id]) {
                        state.reviewsByProduct[product_id] = {
                            reviews: [],
                            isLoading: false,
                            error: null,
                        };
                    }
                    state.reviewsByProduct[product_id].isLoading = false;
                    state.reviewsByProduct[product_id].error = error || 'Failed to fetch reviews';
                }
            })
            .addCase(createReview.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.successMessage = false;
            })
            .addCase(createReview.fulfilled, (state, action) => {
                state.isLoading = false;
                state.review = action.payload;
                state.successMessage = true;
                state.lastAction = 'create';
            })
            .addCase(createReview.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(updateReview.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.successMessage = false;
            })
            .addCase(updateReview.fulfilled, (state, action) => {
                state.isLoading = false;
                state.review = action.payload;
                state.successMessage = true;
                state.lastAction = 'update';
            })
            .addCase(updateReview.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(getReviewsByOrderId.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getReviewsByOrderId.fulfilled, (state, action) => {
                state.isLoading = false;
                state.review = action.payload;
                state.lastAction = 'fetch';
            })
            .addCase(getReviewsByOrderId.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

    },
});

export const { clearReviewState, clearProductReviews } = reviewSlice.actions;

// Memoized Selectors - Đảm bảo chỉ trả về reviews của sản phẩm cụ thể
export const selectProductReviews = createSelector(
    [(state) => state.review.reviewsByProduct, (state, productId) => productId],
    (reviewsByProduct, productId) => {
        if (!productId || !reviewsByProduct[productId]) {
            return [];
        }
        return reviewsByProduct[productId].reviews || [];
    }
);

export const selectProductReviewsLoading = createSelector(
    [(state) => state.review.reviewsByProduct, (state, productId) => productId],
    (reviewsByProduct, productId) => {
        if (!productId || !reviewsByProduct[productId]) {
            return false;
        }
        return reviewsByProduct[productId].isLoading || false;
    }
);

export const selectProductReviewsError = createSelector(
    [(state) => state.review.reviewsByProduct, (state, productId) => productId],
    (reviewsByProduct, productId) => {
        if (!productId || !reviewsByProduct[productId]) {
            return null;
        }
        return reviewsByProduct[productId].error || null;
    }
);

export default reviewSlice.reducer;