import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
    createReviewApi,
    updateReviewApi,
    createReviewWithFormDataApi,
    updateReviewWithFormDataApi,
    getReviewsByOrderIdApi,
    getProductReviewsByProductId,
} from '../../services/reviewService';

const DEFAULT_REVIEW_LIMIT = 4;

// Async thunk: arg = productId (string) OR { product_id, page?, limit?, rating?, isLoadMore? }
export const fetchProductReviewsByProductId = createAsyncThunk(
    'review/fetchProductReviewsByProductId',
    async (arg, { rejectWithValue }) => {
        const payload = typeof arg === 'string' ? { product_id: arg, page: 1 } : arg;
        const {
            product_id,
            page = 1,
            limit = DEFAULT_REVIEW_LIMIT,
            rating,
            isLoadMore = false,
        } = payload;
        if (!product_id) return rejectWithValue({ product_id: null, error: 'product_id required' });
        try {
            const { list, pagination } = await getProductReviewsByProductId(product_id, {
                page,
                limit,
                rating: rating === '' || rating == null ? undefined : rating,
            });
            return {
                product_id,
                reviews: list,
                pagination: pagination || { page: 1, limit, total: 0, totalPages: 0 },
                isLoadMore,
            };
        } catch (error) {
            return rejectWithValue({ product_id, error: error.message });
        }
    }
);

export const createReview = createAsyncThunk(
    'review/createReview',
    async ({ product_id, order_id, rating, review_content }, { rejectWithValue }) => {
        try {
            const response = await createReviewApi({
                product_id,
                order_id,
                rating,
                comment: review_content ?? '',
            });
            return response.data ?? response.review;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateReview = createAsyncThunk(
    'review/updateReview',
    async ({ review_id, rating, review_content }, { rejectWithValue }) => {
        try {
            const response = await updateReviewApi({
                review_id,
                rating,
                comment: review_content ?? '',
            });
            return response.data ?? response.review;
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

export const createReviewWithFormData = createAsyncThunk(
    'review/createReviewWithFormData',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await createReviewWithFormDataApi(formData);
            return response.data ?? response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateReviewWithFormData = createAsyncThunk(
    'review/updateReviewWithFormData',
    async ({ reviewId, formData }, { rejectWithValue }) => {
        try {
            const response = await updateReviewWithFormDataApi(reviewId, formData);
            return response.data ?? response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    reviewsByProduct: {},
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
            state.successMessage = null;
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
            .addCase(fetchProductReviewsByProductId.pending, (state, action) => {
                const arg = action.meta.arg;
                const product_id = typeof arg === 'string' ? arg : arg?.product_id;
                const isLoadMore = typeof arg === 'object' && arg?.isLoadMore;
                if (!product_id) return;
                if (!state.reviewsByProduct[product_id]) {
                    state.reviewsByProduct[product_id] = {
                        reviews: [],
                        pagination: { page: 1, total: 0, totalPages: 0 },
                        isLoading: false,
                        isLoadingMore: false,
                        error: null,
                    };
                }
                if (isLoadMore) {
                    state.reviewsByProduct[product_id].isLoadingMore = true;
                } else {
                    state.reviewsByProduct[product_id].isLoading = true;
                }
                state.reviewsByProduct[product_id].error = null;
            })
            .addCase(fetchProductReviewsByProductId.fulfilled, (state, action) => {
                const { product_id, reviews, pagination, isLoadMore } = action.payload;
                if (!state.reviewsByProduct[product_id]) {
                    state.reviewsByProduct[product_id] = {
                        reviews: [],
                        pagination: { page: 1, total: 0, totalPages: 0 },
                        isLoading: false,
                        isLoadingMore: false,
                        error: null,
                    };
                }
                if (isLoadMore && pagination?.page > 1) {
                    state.reviewsByProduct[product_id].reviews = [
                        ...(state.reviewsByProduct[product_id].reviews || []),
                        ...(reviews || []),
                    ];
                } else {
                    state.reviewsByProduct[product_id].reviews = reviews || [];
                }
                state.reviewsByProduct[product_id].pagination = pagination || state.reviewsByProduct[product_id].pagination;
                state.reviewsByProduct[product_id].isLoading = false;
                state.reviewsByProduct[product_id].isLoadingMore = false;
                state.reviewsByProduct[product_id].error = null;
            })
            .addCase(fetchProductReviewsByProductId.rejected, (state, action) => {
                const { product_id, error } = action.payload || {};
                if (product_id && state.reviewsByProduct[product_id]) {
                    state.reviewsByProduct[product_id].isLoading = false;
                    state.reviewsByProduct[product_id].isLoadingMore = false;
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
            .addCase(createReviewWithFormData.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.successMessage = false;
            })
            .addCase(createReviewWithFormData.fulfilled, (state, action) => {
                state.isLoading = false;
                state.review = action.payload;
                state.successMessage = true;
                state.lastAction = 'create';
            })
            .addCase(createReviewWithFormData.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(updateReviewWithFormData.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.successMessage = false;
            })
            .addCase(updateReviewWithFormData.fulfilled, (state, action) => {
                state.isLoading = false;
                state.review = action.payload;
                state.successMessage = true;
                state.lastAction = 'update';
            })
            .addCase(updateReviewWithFormData.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const { clearReviewState, clearProductReviews } = reviewSlice.actions;

export const selectProductReviews = createSelector(
    [(state) => state.review.reviewsByProduct, (state, productId) => productId],
    (reviewsByProduct, productId) => {
        if (!productId || !reviewsByProduct[productId]) return [];
        return reviewsByProduct[productId].reviews || [];
    }
);

export const selectProductReviewsLoading = createSelector(
    [(state) => state.review.reviewsByProduct, (state, productId) => productId],
    (reviewsByProduct, productId) => {
        if (!productId || !reviewsByProduct[productId]) return false;
        return reviewsByProduct[productId].isLoading || false;
    }
);

export const selectProductReviewsError = createSelector(
    [(state) => state.review.reviewsByProduct, (state, productId) => productId],
    (reviewsByProduct, productId) => {
        if (!productId || !reviewsByProduct[productId]) return null;
        return reviewsByProduct[productId].error || null;
    }
);

export const selectProductReviewsPagination = createSelector(
    [(state) => state.review.reviewsByProduct, (state, productId) => productId],
    (reviewsByProduct, productId) => {
        if (!productId || !reviewsByProduct[productId]) {
            return { page: 1, total: 0, totalPages: 0 };
        }
        return reviewsByProduct[productId].pagination || { page: 1, total: 0, totalPages: 0 };
    }
);

export const selectProductReviewsLoadingMore = createSelector(
    [(state) => state.review.reviewsByProduct, (state, productId) => productId],
    (reviewsByProduct, productId) => {
        if (!productId || !reviewsByProduct[productId]) return false;
        return !!reviewsByProduct[productId].isLoadingMore;
    }
);

export default reviewSlice.reducer;
