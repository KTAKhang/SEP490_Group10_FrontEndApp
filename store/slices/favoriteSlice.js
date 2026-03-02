import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
  addFavoriteApi,
  removeFavoriteApi,
  checkFavoriteApi,
  getFavoritesApi,
} from '../../services/favoriteService';

export const checkFavoriteStatus = createAsyncThunk(
  'favorite/checkFavoriteStatus',
  async (productId, { rejectWithValue }) => {
    try {
      const { isFavorite } = await checkFavoriteApi(productId);
      return { productId, isFavorite };
    } catch (error) {
      return rejectWithValue({ productId, message: error.message });
    }
  }
);

export const addFavorite = createAsyncThunk(
  'favorite/addFavorite',
  async (productId, { rejectWithValue }) => {
    try {
      const result = await addFavoriteApi(productId);
      return { productId, favoriteRecord: result.data };
    } catch (error) {
      // Nếu BE trả "Product is already in favorites" thì coi như đã yêu thích
      if (error.message === 'Product is already in favorites') {
        return { productId, alreadyFavorite: true };
      }
      return rejectWithValue({ productId, message: error.message });
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'favorite/removeFavorite',
  async (productId, { rejectWithValue }) => {
    try {
      const result = await removeFavoriteApi(productId);
      return { productId, message: result.message };
    } catch (error) {
      // Nếu "Product is not in favorites" thì coi như đã bỏ
      if (error.message === 'Product is not in favorites') {
        return { productId, alreadyRemoved: true };
      }
      return rejectWithValue({ productId, message: error.message });
    }
  }
);

export const fetchFavorites = createAsyncThunk(
  'favorite/fetchFavorites',
  async (params, { rejectWithValue }) => {
    try {
      const result = await getFavoritesApi(params || {});
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Map trạng thái yêu thích theo productId -> true/false
  statusByProductId: {},
  // Danh sách sản phẩm yêu thích (cho màn list sau này)
  items: [],
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },
  isChecking: false,
  isUpdating: false,
  isLoadingList: false,
  error: null,
};

const favoriteSlice = createSlice({
  name: 'favorite',
  initialState,
  reducers: {
    clearFavoriteError(state) {
      state.error = null;
    },
    resetFavoriteState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check status
      .addCase(checkFavoriteStatus.pending, (state) => {
        state.isChecking = true;
      })
      .addCase(checkFavoriteStatus.fulfilled, (state, action) => {
        state.isChecking = false;
        const { productId, isFavorite } = action.payload;
        state.statusByProductId[productId] = isFavorite;
      })
      .addCase(checkFavoriteStatus.rejected, (state, action) => {
        state.isChecking = false;
        state.error = action.payload?.message || action.error?.message || null;
      })
      // Add favorite
      .addCase(addFavorite.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        state.isUpdating = false;
        const { productId } = action.payload;
        state.statusByProductId[productId] = true;
      })
      .addCase(addFavorite.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload?.message || action.error?.message || null;
      })
      // Remove favorite
      .addCase(removeFavorite.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.isUpdating = false;
        const { productId } = action.payload;
        state.statusByProductId[productId] = false;
      })
      .addCase(removeFavorite.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload?.message || action.error?.message || null;
      })
      // List favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoadingList = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.isLoadingList = false;
        state.items = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.isLoadingList = false;
        state.error = action.payload || action.error?.message || null;
      });
  },
});

export const { clearFavoriteError, resetFavoriteState } = favoriteSlice.actions;

export default favoriteSlice.reducer;

export const selectIsFavorite = createSelector(
  [(state) => state.favorite.statusByProductId, (state, productId) => productId],
  (statusByProductId, productId) => {
    if (!productId) return false;
    return !!statusByProductId[productId];
  }
);

