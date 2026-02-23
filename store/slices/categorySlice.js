import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCategories } from '../../services/categoryService';

export const fetchCategoriesAsync = createAsyncThunk(
    'category/fetchCategories',
    async ({ page, limit }, { rejectWithValue }) => {
        try {
            const response = await getCategories({ page, limit });
            // Backend trả về mảng danh mục trong response.data (không phải data.categories)
            return response.data ?? [];
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
                // Backend đã filter status: true; giữ filter an toàn phòng response thay đổi
                const list = Array.isArray(action.payload) ? action.payload : [];
                state.categories = list.filter(category => category.status !== false);
            })
            .addCase(fetchCategoriesAsync.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;  // Lưu thông báo lỗi nếu có
            });
    },
});

export default categorySlice.reducer;
