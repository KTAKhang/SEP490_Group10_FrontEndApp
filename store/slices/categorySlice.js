import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCategories } from '../../services/categoryService';

export const fetchCategoriesAsync = createAsyncThunk(
    'category/fetchCategories',
    async ({ page, limit }, { rejectWithValue }) => {
        try {
            const response = await getCategories({ page, limit });
            return response.data.categories;
        } catch (error) {
            console.error('API error:', error);
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
                // Store level filtering: Chỉ lưu active categories (status = true)
                const activeCategories = action.payload.filter(category => category.status === true);
                state.categories = activeCategories;
            })
            .addCase(fetchCategoriesAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;  // Lưu thông báo lỗi nếu có
            });
    },
});

export default categorySlice.reducer;
