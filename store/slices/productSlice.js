import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    getProducts,
    getProductById,
    getProductsByCategory,
    getTopSoldProducts
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
    async ({ page, limit, isAllProducts = false, search = null }, { rejectWithValue }) => {
        try {
            const response = await getProducts({ page, limit, search });
            const products = response.data?.products ?? [];
            const pagination = response.data?.total ?? { totalProduct: 0, currentPage: 1, totalPage: 1 };
            return { products, pagination, isAllProducts, page };
        } catch (error) {
            if (__DEV__) console.warn('Products API:', error?.message || error);
            return rejectWithValue(error.message);
        }
    }
);

export const fetchProductsByCategoryAsync = createAsyncThunk(
    'product/fetchProductsByCategory',
    async ({ category_name, page, limit }, { rejectWithValue }) => {
        try {
            const response = await getProductsByCategory({ category_name, page, limit });
            const products = response.data?.products ?? [];
            const pagination = response.data?.total ?? { totalProduct: 0, currentPage: 1, totalPage: 1 };
            return { products, pagination, isAllProducts: true, page };
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

            return response;  // Trả về response thay vì response.product
        } catch (error) {
            console.error('fetchProductByIdAsync error:', error);
            return rejectWithValue(error.message);
        }
    }
);

export const fetchTopSoldProductsAsync = createAsyncThunk(
    'product/fetchTopSoldProducts',
    async ({ page = 1, limit = 10, search = null }, { rejectWithValue }) => {
        try {
            const response = await getTopSoldProducts({ page, limit, search });
            const products = response.data?.products ?? [];
            return { products, pagination: response.data?.total ?? {} };
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
                const activeProducts = Array.isArray(action.payload.products) ? action.payload.products : [];

                if (action.payload.isAllProducts) {
                    const p = action.payload.pagination || {};
                    const currentPage = p.currentPage ?? 1;
                    const totalPage = p.totalPage ?? 1;
                    const limit = 6; // ITEMS_PER_PAGE from AllProductsScreen

                    if (action.payload.page === 1) {
                        state.allActiveProducts = activeProducts;
                        state.allProducts = activeProducts.slice(0, limit);
                    } else {
                        // Client-side pagination: get next page from cached active products
                        const startIndex = (action.payload.page - 1) * limit;
                        const endIndex = startIndex + limit;
                        const nextPageProducts = state.allActiveProducts.slice(startIndex, endIndex);

                        // Append to displayed products
                        const previousCount = state.allProducts.length;
                        state.allProducts = [...state.allProducts, ...nextPageProducts];
                    }

                    state.pagination.currentPage = currentPage;
                    state.pagination.totalPages = totalPage;
                    state.pagination.hasMore = currentPage < totalPage;
                } else {
                    state.products = Array.isArray(activeProducts) ? activeProducts : [];
                }
            })
            .addCase(fetchProductsAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.products = [];
            })
            // Fetch Products By Category
            .addCase(fetchProductsByCategoryAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProductsByCategoryAsync.fulfilled, (state, action) => {
                state.isLoading = false;
                state.error = null;
                const activeProducts = Array.isArray(action.payload.products) ? action.payload.products : [];

                const p = action.payload.pagination || {};
                const currentPage = p.currentPage ?? 1;
                const totalPage = p.totalPage ?? 1;
                const limit = 6; // ITEMS_PER_PAGE from AllProductsScreen

                if (action.payload.page === 1) {
                    state.allActiveProducts = activeProducts;
                    state.allProducts = activeProducts.slice(0, limit);
                } else {
                    // Client-side pagination: get next page from cached active products
                    const startIndex = (action.payload.page - 1) * limit;
                    const endIndex = startIndex + limit;
                    const nextPageProducts = state.allActiveProducts.slice(startIndex, endIndex);

                    // Append to displayed products
                    const previousCount = state.allProducts.length;
                    state.allProducts = [...state.allProducts, ...nextPageProducts];
                }

                // Update pagination based on active products count
                state.pagination.currentPage = currentPage;
                state.pagination.totalPages = totalPage;
                state.pagination.hasMore = currentPage < totalPage;
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
                state.topSoldProducts = Array.isArray(action.payload?.products) ? action.payload.products : [];
            })
            .addCase(fetchTopSoldProductsAsync.rejected, (state, action) => {
                state.isLoadingTopSold = false;
                state.error = action.payload;
            });
    },
});

export const { resetProductState, clearError, resetAllProducts } = productSlice.actions;
export default productSlice.reducer;
