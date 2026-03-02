// features/cart/cartSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  checkoutHoldApi,
  checkoutCancelApi,
} from "../../services/checkoutService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";

export const checkoutHold = createAsyncThunk(
  "checkout/checkoutHold",
  async (
    { selected_product_ids, checkout_session_id },
    { rejectWithValue, dispatch },
  ) => {
    try {
      // console.log("checkoutHol", selected_product_ids, checkout_session_id);
      // Nếu product_ids không phải mảng thì convert thành mảng
      const formattedProductIds = Array.isArray(selected_product_ids)
        ? selected_product_ids
        : [selected_product_ids];

      const response = await checkoutHoldApi({
        selected_product_ids: formattedProductIds,
        checkout_session_id,
      });
      await AsyncStorage.setItem(
        "checkout_session_id",
        response.checkout_session_id,
      );
      // Toast.success(response.message);
      // Sau khi xóa thành công, cập nhật lại giỏ hàng
      //   await dispatch(fetchCartByUser());

      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const checkoutCancel = createAsyncThunk(
  "checkout/checkoutCancel",
  async ({ checkout_session_id }, { rejectWithValue, dispatch }) => {
    try {
      // Pass an object to the API helper which expects { checkout_session_id }
      const response = await checkoutCancelApi({ checkout_session_id });
      // Ensure local storage cleared (defensive)
      await AsyncStorage.removeItem("checkout_session_id");
      // Use Toast.show to display messages (react-native-toast-message API)
      try {
        Toast.show({
          type: "success",
          text1: response?.message || "Checkout cancelled",
        });
      } catch (tErr) {
        console.warn("Toast display failed", tErr);
      }
      // await dispatch(fetchCartByUser());
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  checkout_session_id: null,
  items: [],
  item_count: 0,

  loading: false,
  error: null,
  message: null,
};

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    clearCheckoutState: (state) => {
      state.error = null;
      state.checkout_session_id = null;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // ===== CHECKOUT HOLD =====
    builder
      .addCase(checkoutHold.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutHold.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload?.message || null;
        state.checkout_session_id = action.payload.checkout_session_id;
        state.items = action.payload.items;
        state.item_count = action.payload.item_count;
      })
      .addCase(checkoutHold.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ===== CHECKOUT CANCEL =====
      .addCase(checkoutCancel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkoutCancel.fulfilled, (state, action) => {
        state.loading = false;
        // Clear session and items on successful cancel to prevent UI from re-using the session
        state.checkout_session_id = null;
        state.items = [];
        state.item_count = 0;
        state.message =
          action.payload?.message || action.payload || "Checkout cancelled";
      })
      .addCase(checkoutCancel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCheckoutState } = checkoutSlice.actions;
export default checkoutSlice.reducer;
