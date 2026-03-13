import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUserProfileApi, updateUserProfileApi, changePasswordApi } from '../../services/userService';

export const fetchUserProfile = createAsyncThunk(
    'user/fetchUserProfile',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getUserProfileApi();
            return response;

        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);


export const updateUserProfile = createAsyncThunk(
  "user/updateUserProfile",
  async (
    { user_name, fullName, phone, address, birthday, gender, avatar },
    { rejectWithValue }
  ) => {
    try {
      const response = await updateUserProfileApi({
        user_name,
        fullName,
        phone,
        address,
        birthday,
        gender,
        avatar,
      });

      return response;
    } catch (error) {
      console.log("FULL ERROR:", error);
      console.log("ERROR RESPONSE:", error?.response);
      console.log("ERROR DATA:", error?.response?.data);

      return rejectWithValue(
        error?.response?.data?.message || error.message
      );
    }
  }
);

export const changePassword = createAsyncThunk(
    'user/changePassword',
    async ({ old_password, new_password }, { rejectWithValue }) => {
        try {
            const response = await changePasswordApi({ old_password, new_password });

            return response.message;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    user: null,
    loading: false,
    error: null,
    message: null,

    // phân biệt theo action
    updateLoading: false,
    updateError: null,
    updateMessage: null,
    updateSuccess: false,

    changePasswordLoading: false,
    changePasswordError: null,
    changePasswordMessage: null,
    changePasswordSuccess: false,

    getProfileLoading: false,
    getProfileError: null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        clearProfileMessages: (state) => {
            state.updateMessage = null;
            state.updateError = null;
            state.changePasswordMessage = null;
            state.changePasswordError = null;
            state.updateSuccess = false;
            state.changePasswordSuccess = false;
        },
        resetUpdateSuccess: (state) => {
            state.updateSuccess = false;
            state.updateMessage = null;
            state.updateError = null;
        },
        resetChangePasswordSuccess: (state) => {
            state.changePasswordSuccess = false;
            state.changePasswordMessage = null;
            state.changePasswordError = null;
        },
        clearError: (state) => {
            state.updateError = null;
            state.changePasswordError = null;
            state.getProfileError = null;
        },
    },
    extraReducers: (builder) => {
        builder

        // ===== GET PROFILE =====
        .addCase(fetchUserProfile.pending, (state) => {
            state.getProfileLoading = true;
            state.getProfileError = null;
        })
        .addCase(fetchUserProfile.fulfilled, (state, action) => {
            state.getProfileLoading = false;
            state.user = action.payload;
        })
        .addCase(fetchUserProfile.rejected, (state, action) => {
            state.getProfileLoading = false;
            state.getProfileError = action.payload;
        })

        // ===== UPDATE PROFILE =====
        .addCase(updateUserProfile.pending, (state) => {
            state.updateLoading = true;
            state.updateError = null;
            state.updateMessage = null;
            state.updateSuccess = false;
        })
        .addCase(updateUserProfile.fulfilled, (state, action) => {
            state.updateLoading = false;
            state.user = {
                ...state.user,
                ...action.payload.data,
            };
            state.updateMessage = action.payload.message;
            state.updateSuccess = true;
        })
        .addCase(updateUserProfile.rejected, (state, action) => {
            state.updateLoading = false;
            state.updateError = action.payload;
            state.updateSuccess = false;
        })

        // ===== CHANGE PASSWORD =====
        .addCase(changePassword.pending, (state) => {
            state.changePasswordLoading = true;
            state.changePasswordError = null;
            state.changePasswordMessage = null;
            state.changePasswordSuccess = false;
        })
        .addCase(changePassword.fulfilled, (state, action) => {
            state.changePasswordLoading = false;
            state.changePasswordMessage = action.payload;
            state.changePasswordSuccess = true;
        })
        .addCase(changePassword.rejected, (state, action) => {
            state.changePasswordLoading = false;
            state.changePasswordError = action.payload;
            state.changePasswordSuccess = false;
        });
    },
});

export const { clearProfileMessages, resetUpdateSuccess, resetChangePasswordSuccess, clearError } = userSlice.actions;
export default userSlice.reducer;
