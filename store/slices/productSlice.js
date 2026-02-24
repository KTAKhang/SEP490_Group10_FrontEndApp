import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    getProducts,
    getProductById,
    getProductsByCategory,
    getFeaturedProducts,
} from '../../services/productService';

// Initial state cho product
const initialState = {
    products: [],
    allProducts: [], // Separate state for all products page
    allActiveProducts: [], // Cache all active products for client-side pagination
    topSoldProducts: [], // State for top sold products
    product: null,
    isLoading: false,
    isLoadingTopSold: false, // Separate loading state for top sold products
    error: null,
    pagination: {
        currentPage: 1,
        totalPages: 1,
        hasMore: true
    }
};

export const fetchProductsAsync = createAsyncThunk(
    'product/fetchProducts',
    async ({ page, limit, isAllProducts = false, search = null, categoryId = null }, { rejectWithValue }) => {
        try {
            const response = await getProducts({ page, limit, search, category: categoryId || undefined });
            const pag = response.pagination || {};
            return {
                products: response.data || [],
                pagination: {
                    currentPage: pag.page ?? page,
                    totalPage: pag.totalPages ?? 1,
                    total: pag.total ?? 0,
                    hasMore: (pag.page ?? page) < (pag.totalPages ?? 1),
                },
                isAllProducts,
                page,
            };
        } catch (error) {
            console.error('API error:', error);
            return rejectWithValue(error.message);
        }
    }
);

export const fetchProductsByCategoryAsync = createAsyncThunk(
    'product/fetchProductsByCategory',
    async ({ categoryId, page, limit, search = '' }, { rejectWithValue }) => {
        try {
            const response = await getProductsByCategory({ categoryId, page, limit, search });
            const pag = response.pagination || {};
            return {
                products: response.data || [],
                pagination: {
                    currentPage: pag.page ?? page,
                    totalPage: pag.totalPages ?? 1,
                    total: pag.total ?? 0,
                    hasMore: (pag.page ?? page) < (pag.totalPages ?? 1),
                },
                isAllProducts: true,
                page,
            };
        } catch (error) {
            console.error('fetchProductsByCategoryAsync error:', error);
            return rejectWithValue(error.message);
        }
    }
);

export const fetchProductByIdAsync = createAsyncThunk(
    'product/fetchProductById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await getProductById(id);
            return response;
        } catch (error) {
            console.error('fetchProductByIdAsync error:', error);
            return rejectWithValue(error.message);
        }
    }
);

export const fetchTopSoldProductsAsync = createAsyncThunk(
    'product/fetchTopSoldProducts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getFeaturedProducts();
            return { products: response.data || [] };
        } catch (error) {
            console.error('fetchTopSoldProductsAsync error:', error);
            return rejectWithValue(error.message);
        }
    }
);

const productSlice = createSlice({
    name: 'product',
    initialState,
    reducers: {
        resetProductState: (state) => {
            state.product = null;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        },
        resetAllProducts: (state) => {
            state.allProducts = [];
            state.allActiveProducts = [];
            state.pagination.currentPage = 1;
            state.pagination.hasMore = true;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Products
            .addCase(fetchProductsAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProductsAsync.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;
                const activeProducts = action.payload.products || [];
                const pag = action.payload.pagination || {};

                if (action.payload.isAllProducts) {
                    state.allProducts = activeProducts;
                    state.allActiveProducts = [];
                    state.pagination.currentPage = pag.currentPage ?? action.payload.page;
                    state.pagination.totalPages = pag.totalPage ?? 1;
                    state.pagination.hasMore = pag.hasMore ?? false;
                } else {
                    state.products = activeProducts;
                }
            })
            .addCase(fetchProductsAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Fetch Products By Category
            .addCase(fetchProductsByCategoryAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProductsByCategoryAsync.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;
                const activeProducts = action.payload.products || [];
                const pag = action.payload.pagination || {};

                state.allProducts = activeProducts;
                state.pagination.currentPage = pag.currentPage ?? action.payload.page;
                state.pagination.totalPages = pag.totalPage ?? 1;
                state.pagination.hasMore = pag.hasMore ?? false;
            })
            .addCase(fetchProductsByCategoryAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Fetch Product By ID
            .addCase(fetchProductByIdAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProductByIdAsync.fulfilled, (state, action) => {
                state.isLoading = false;
                state.product = action.payload;
                state.error = null;
            })
            .addCase(fetchProductByIdAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.product = null;
                state.error = action.payload;
            })
            // Fetch Top Sold Products
            .addCase(fetchTopSoldProductsAsync.pending, (state) => {
                state.isLoadingTopSold = true;
                state.error = null;
            })
            .addCase(fetchTopSoldProductsAsync.fulfilled, (state, action) => {
                state.isLoadingTopSold = false;
                state.error = null;
                state.topSoldProducts = action.payload.products || [];
            })
            .addCase(fetchTopSoldProductsAsync.rejected, (state, action) => {
                state.isLoadingTopSold = false;
                state.error = action.payload;
            });
    },
});

export const { resetProductState, clearError, resetAllProducts } = productSlice.actions;
export default productSlice.reducer;
