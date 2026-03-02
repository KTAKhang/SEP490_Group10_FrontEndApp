// features/cart/cartSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCartByUserApi,
  updateCartApi,
  removeFromCartApi,
  addToCartApi,
} from "../../services/cartService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
export const fetchCartByUser = createAsyncThunk(
  "cart/fetchCartByUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCartByUserApi();
      return response;
    } catch (error) {
      if (error.message === "Lấy giỏ hàng thành công") {
        return null;
      }
      return rejectWithValue(error.message);
    }
  },
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ product_id, quantity }, { rejectWithValue, dispatch }) => {
    try {
      const response = await addToCartApi({ product_id, quantity });
      // Sau khi thêm thành công, cập nhật lại giỏ hàng
      await dispatch(fetchCartByUser());
      return response;
    } catch (error) {
      if (error.message === "Thêm sản phẩm vào giỏ hàng thành công") {
        await dispatch(fetchCartByUser());
        return null;
      }
      return rejectWithValue(error.message);
    }
  },
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ product_id, quantity }, { rejectWithValue, dispatch }) => {
    try {
      const response = await updateCartApi({ product_id, quantity });
      // Sau khi cập nhật thành công, cập nhật lại giỏ hàng
      await dispatch(fetchCartByUser());
      return response;
    } catch (error) {
      if (error.message === "Cập nhật giỏ hàng thành công") {
        await dispatch(fetchCartByUser());
        return null;
      }
      return rejectWithValue(error.message);
    }
  },
);

export const removeCartItem = createAsyncThunk(
  "cart/removeCartItem",
  async ( product_ids , { rejectWithValue, dispatch }) => {
    try {
      // Nếu product_ids không phải mảng thì convert thành mảng
      const formattedProductIds = Array.isArray(product_ids)
        ? product_ids
        : [product_ids];

      const response = await removeFromCartApi(formattedProductIds);

      // Sau khi xóa thành công, cập nhật lại giỏ hàng
      await dispatch(fetchCartByUser());

      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);



const initialState = {
  cart_id: null,
  items: [],
  sum: 0,
  item_count: 0,

  shippingType: null,
  shippingFee: 0,
  totalWeight: 0,

  isLoading: false,
  updateLoading: false,
  error: null,
  message: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCartState: (state) => {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // ===== FETCH CART =====
      .addCase(fetchCartByUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCartByUser.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload) {
          state.cart_id = action.payload.cart_id;
          state.items = action.payload.items;
          state.sum = action.payload.sum;
          state.item_count = action.payload.item_count;
        }
      })
      .addCase(fetchCartByUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ===== ADD ITEM =====
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload?.message || null;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ===== UPDATE ITEM =====
      .addCase(updateCartItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload) {
          state.sum = action.payload.sum;
          state.item_count = action.payload.item_count;
        }
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ===== REMOVE ITEM =====
      .addCase(removeCartItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.isLoading = false;

        if (action.payload) {
          state.sum = action.payload.sum;
          state.item_count = action.payload.item_count;
        }
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
