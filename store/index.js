import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import orderReducer from './slices/orderSlice';
import cartReducer from './slices/cartSlice';
import reviewReducer from './slices/reviewSlice';
import categoryReducer from './slices/categorySlice';
import productReducer from './slices/productSlice';
import chatBotReducer from './slices/chatbotSlice';
import checkoutReducer from './slices/checkoutSlice';
import contactReducer from './slices/contactSlice';
import favoriteReducer from './slices/favoriteSlice';
export const store = configureStore({
    reducer: {
        auth: authReducer,
        user: userReducer,
        order: orderReducer,
        cart: cartReducer,
        review: reviewReducer,
        category: categoryReducer,
        product: productReducer,
        chatBot: chatBotReducer,
        checkout: checkoutReducer,
        contact: contactReducer,
        favorite: favoriteReducer,

    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            thunk: true,
            serializableCheck: {
                ignoredActions: ['persist/PERSIST'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
