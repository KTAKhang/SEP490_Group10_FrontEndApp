import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useDispatch, useSelector } from "react-redux";
import { checkAuthStatus } from "../store/slices/authSlice";
import ChatBotModal from "../components/ChatBotModal";
import { navigateAfterLogin } from "../utils/authUtils";
// Import screens
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import SplashScreen from "../screens/SplashScreen";
import AdminScreen from "../screens/AdminScreen";
import RegisterScreen from "../screens/RegisterScreen";
import RegisterConfirmOTPScreen from "../screens/RegisterConfirmOTPScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ForgotPasswordOTPScreen from "../screens/ForgotPasswordOTPScreen";
// Thêm dòng này
import CartScreen from "../screens/CartScreen";
import ProfileScreen from "../screens/ProfileScreen";
import OrderHistoryScreen from "../screens/OrderHistoryScreen";
import PaymentScreen from "../screens/PaymentScreen";
import OrderDetailsScreen from "../screens/OrderDetailsScreen";
import AllProductsScreen from "../screens/AllProductsScreen";
import BuyNowScreen from "../screens/BuyNowScreen";
import PaymentSuccess from "../screens/PaymentSuccess";
import PaymentFail from "../screens/PaymentFail";
import * as Linking from "expo-linking";
const Stack = createStackNavigator();

const linking = {
  prefixes: ["myshopapps://"],
  config: {
    screens: {
      PaymentSuccess: "payment-success",
      PaymentFail: "payment-fail",
    },
  },
};

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isInitializing, setIsInitializing] = React.useState(true);
  const navigationRef = React.useRef();

  useEffect(() => {
    const initializeAuth = async () => {
      await dispatch(checkAuthStatus());
      setIsInitializing(false);
    };

    initializeAuth();
  }, [dispatch]);

  // Effect để tự động chuyển về HomePage sau khi đăng nhập thành công
  useEffect(() => {
    const handleNavigation = async () => {
      const initialUrl = await Linking.getInitialURL();

      // Nếu app được mở bằng deep link → KHÔNG auto navigate
      // if (initialUrl) {
      //   console.log("Opened from deep link:", initialUrl);
      //   return;
      // }

      if (isAuthenticated && navigationRef.current && user) {
        navigateAfterLogin(navigationRef.current, user);
      }
    };

    handleNavigation();
  }, [isAuthenticated, user]);

  if (isInitializing) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      {/* ✅ Chỉ hiển thị Chatbot nếu đã đăng nhập và không phải admin */}
      {isAuthenticated && user?.role_name !== "admin" && <ChatBotModal />}

      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="HomePage"
      >
        {/* Public routes - Guest có thể xem */}
        <Stack.Screen name="HomePage" component={HomeScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="AllProducts" component={AllProductsScreen} />

        {/* Auth routes */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="VerifyOtp" component={RegisterConfirmOTPScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen
          name="ForgotPasswordOTP"
          component={ForgotPasswordOTPScreen}
        />
        <Stack.Screen name="PaymentSuccess" component={PaymentSuccess} />
        <Stack.Screen name="PaymentFail" component={PaymentFail} />

        {/* Protected routes - Chỉ user đã đăng nhập mới xem được */}
        {isAuthenticated && (
          <>
            {user?.role_name === "admin" ? (
              <Stack.Screen name="Admin" component={AdminScreen} />
            ) : (
              <>
                <Stack.Screen name="Cart" component={CartScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Payment" component={PaymentScreen} />
                <Stack.Screen
                  name="OrderHistory"
                  component={OrderHistoryScreen}
                />
                <Stack.Screen
                  name="OrderDetails"
                  component={OrderDetailsScreen}
                />
                <Stack.Screen name="BuyNow" component={BuyNowScreen} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
