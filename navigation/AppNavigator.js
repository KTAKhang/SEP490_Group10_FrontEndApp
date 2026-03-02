import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthStatus } from '../store/slices/authSlice';
import CustomerChat from '../components/CustomerChat';
import { navigateAfterLogin } from '../utils/authUtils';
import { registerFCMTokenWithBackend } from '../utils/registerFCM';
// Import screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SplashScreen from '../screens/SplashScreen';
import AdminScreen from '../screens/AdminScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RegisterConfirmOTPScreen from '../screens/RegisterConfirmOTPScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ForgotPasswordOTPScreen from '../screens/ForgotPasswordOTPScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import PaymentScreen from '../screens/PaymentScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import CreateReviewScreen from '../screens/CreateReviewScreen';
import EditReviewScreen from '../screens/EditReviewScreen';
import AllProductsScreen from '../screens/AllProductsScreen';
import BuyNowScreen from '../screens/BuyNowScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import VouchersScreen from '../screens/VouchersScreen';
import PreOrderScreen from '../screens/PreOrderScreen';
import PreOrderDetailScreen from '../screens/PreOrderDetailScreen';
import PreOrderCheckoutScreen from '../screens/PreOrderCheckoutScreen';
import PaymentSuccess from '../screens/PaymentSuccess';
import PaymentFail from '../screens/PaymentFail';
import OrderCreatedCOD from '../screens/OrderCreatedCOD';
import * as Linking from 'expo-linking';

const Stack = createStackNavigator();

const linking = {
  prefixes: ['myshopapps://'],
  config: {
    screens: {
      PaymentSuccess: 'payment-success',
      PaymentFail: 'payment-fail',
      OrderCreatedCOD:'create-order-success',
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
      if (isAuthenticated && navigationRef.current && user) {
        navigateAfterLogin(navigationRef.current, user);
      }
    };
    handleNavigation();
  }, [isAuthenticated, user]);

  // Đăng ký FCM token với backend khi user (customer) đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && user?.role_name !== 'admin') {
      registerFCMTokenWithBackend();
    }
  }, [isAuthenticated, user?.role_name]);

  // Sau khi logout, đưa về HomePage để tránh kẹt màn Admin
  useEffect(() => {
    if (!isInitializing && !isAuthenticated && navigationRef.current?.isReady()) {
      navigationRef.current.reset({ index: 0, routes: [{ name: 'HomePage' }] });
    }
  }, [isAuthenticated, isInitializing]);

  // Deep link: VNPay return sau thanh toán mở app với shopapp://payment/vnpay/return?vnp_ResponseCode=00&...
  const handlePaymentReturnUrl = (url) => {
    if (!url || !navigationRef.current?.isReady()) return;
    try {
      if (!url.includes('payment/vnpay/return') && !url.includes('payment%2Fvnpay%2Freturn')) return;
      const queryStart = url.indexOf('?');
      const query = queryStart >= 0 ? url.slice(queryStart + 1) : '';
      const params = {};
      query.split('&').forEach((pair) => {
        const [k, v] = pair.split('=').map((s) => decodeURIComponent(s || '').trim());
        if (k) params[k] = v;
      });
      const code = params.vnp_ResponseCode || params.vnp_TransactionStatus;
      if (code === '00') {
        Alert.alert('Thanh toán thành công', 'Đơn đặt trước của bạn đã được thanh toán đặt cọc. Bạn có thể xem tại "Đặt trước" > "Đơn của tôi".', [
          { text: 'OK', onPress: () => navigationRef.current?.navigate('PreOrder') },
        ]);
      } else {
        Alert.alert('Thanh toán thất bại', 'Giao dịch chưa thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.', [{ text: 'OK' }]);
      }
    } catch (e) {
      // ignore parse error
    }
  };

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => handlePaymentReturnUrl(url));
    Linking.getInitialURL().then((url) => {
      if (url) handlePaymentReturnUrl(url);
    });
    return () => sub.remove();
  }, []);

  const navTheme = {
    dark: false,
    colors: {
      primary: '#13C2C2',
      background: '#F8F9FA',
      card: '#F8F9FA',
      text: '#0D364C',
      border: '#E5E7EB',
      notification: '#13C2C2',
    },
  };

  if (isInitializing) {
    return (
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#0D364C' } }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
      {isAuthenticated && user?.role_name !== 'admin' && <CustomerChat />}
      <Stack.Navigator
        screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#F8F9FA' } }}
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
        <Stack.Screen name="OrderCreatedCOD" component={OrderCreatedCOD} />

        {/* Protected routes - Chỉ user đã đăng nhập mới xem được */}
        {isAuthenticated && (
          <>
            {user?.role_name === 'admin' ? (
              <Stack.Screen name="Admin" component={AdminScreen} />
            ) : (
              <>
                <Stack.Screen name="Cart" component={CartScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Payment" component={PaymentScreen} />
                <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
                <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
                <Stack.Screen name="CreateReview" component={CreateReviewScreen} />
                <Stack.Screen name="EditReview" component={EditReviewScreen} />
                <Stack.Screen name="BuyNow" component={BuyNowScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="Vouchers" component={VouchersScreen} />
                <Stack.Screen name="PreOrder" component={PreOrderScreen} />
                <Stack.Screen name="PreOrderDetail" component={PreOrderDetailScreen} />
                <Stack.Screen name="PreOrderCheckout" component={PreOrderCheckoutScreen} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
