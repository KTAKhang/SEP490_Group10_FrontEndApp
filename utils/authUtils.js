import { Alert } from 'react-native';

/**
 * Utility function to check if user is authenticated and show login prompt if not
 * @param {boolean} isAuthenticated - Current authentication state
 * @param {Function} navigation - Navigation object
 * @param {string} featureName - Name of the feature requiring authentication
 * @returns {boolean} - True if authenticated, false if not
 */
export const requireAuth = (isAuthenticated, navigation, featureName = 'tính năng này') => {
    if (!isAuthenticated) {
        Alert.alert(
            'Yêu cầu đăng nhập',
            `Bạn cần đăng nhập để sử dụng ${featureName}. Bạn có muốn đăng nhập ngay không?`,
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
            ]
        );
        return false;
    }
    return true;
};

/**
 * Utility function to check if user is authenticated and show login prompt if not
 * @param {boolean} isAuthenticated - Current authentication state
 * @param {Function} navigation - Navigation object
 * @param {string} featureName - Name of the feature requiring authentication
 * @param {Function} onSuccess - Callback function to execute if authenticated
 */
export const withAuth = (isAuthenticated, navigation, featureName, onSuccess) => {
    if (requireAuth(isAuthenticated, navigation, featureName)) {
        onSuccess();
    }
};

/**
 * Get appropriate message for authentication requirement
 * @param {string} featureName - Name of the feature
 * @returns {string} - Formatted message
 */
export const getAuthMessage = (featureName) => {
    const messages = {
        'giỏ hàng': 'xem giỏ hàng',
        'thêm vào giỏ hàng': 'thêm sản phẩm vào giỏ hàng',
        'thanh toán': 'tiến hành thanh toán',
        'mua hàng': 'mua sản phẩm',
        'xem đơn hàng': 'xem lịch sử đơn hàng',
        'hồ sơ': 'xem hồ sơ cá nhân',
        'đánh giá': 'đánh giá sản phẩm',
        'default': 'sử dụng tính năng này'
    };
    
    return messages[featureName] || messages.default;
};

/**
 * Navigate to appropriate screen after successful login
 * @param {Function} navigation - Navigation object
 * @param {Object} user - User object with role information
 */
export const navigateAfterLogin = (navigation, user) => {
    if (user?.role_name === 'admin') {
        navigation.navigate('Admin');
    } else {
        navigation.navigate('HomePage');
    }
};

/**
 * Handle successful login with automatic navigation
 * @param {Function} navigation - Navigation object
 * @param {Object} user - User object
 * @param {string} successMessage - Optional success message
 */
export const handleLoginSuccess = (navigation, user, successMessage = 'Đăng nhập thành công!') => {
    // Show success message if provided
    if (successMessage) {
        // You can use Toast here if available
        console.log(successMessage);
    }
    
    // Navigate to appropriate screen
    navigateAfterLogin(navigation, user);
}; 