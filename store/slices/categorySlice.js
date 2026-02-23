import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCategories } from '../../services/categoryService';

export const fetchCategoriesAsync = createAsyncThunk(
    'category/fetchCategories',
    async ({ page, limit }, { rejectWithValue }) => {
        try {
            const response = await getCategories({ page, limit });
            // Backend trả về { status, data, pagination } với data là mảng categories
            const list = Array.isArray(response.data) ? response.data : [];
            return list;
        } catch (error) {
            if (__DEV__) console.warn('Category API:', error?.message || error);
            return rejectWithValue(error.message);
        }
    }
);

const categorySlice = createSlice({
    name: 'category',
    initialState: {
        categories: [],  // Dữ liệu danh mục ban đầu là mảng rỗng
        isLoading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategoriesAsync.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCategoriesAsync.fulfilled, (state, action) => {
                state.isLoading = false;
                const list = Array.isArray(action.payload) ? action.payload : [];
                const activeCategories = list.filter(cat => cat && cat.status === true);
                state.categories = activeCategories;
            })
            .addCase(fetchCategoriesAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.categories = [];
            });
    },
});

export default categorySlice.reducer;
