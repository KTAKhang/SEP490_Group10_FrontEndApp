import { Alert } from 'react-native';

/**
 * Utility function to check if user is authenticated and show login prompt if not
 * @param {boolean} isAuthenticated - Current authentication state
 * @param {Function} navigation - Navigation object
 * @param {string} featureName - Name of the feature requiring authentication
 * @returns {boolean} - True if authenticated, false if not
 */
export const requireAuth = (isAuthenticated, navigation, featureName = 'this feature') => {
    if (!isAuthenticated) {
        Alert.alert(
            'Login required',
            `You need to log in to use ${featureName}. Do you want to log in now?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log in', onPress: () => navigation.navigate('Login') }
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
        'cart': 'view cart',
        'add to cart': 'add product to cart',
        'checkout': 'proceed to checkout',
        'buy': 'buy product',
        'order history': 'view order history',
        'profile': 'view profile',
        'review': 'review product',
        'default': 'use this feature'
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
export const handleLoginSuccess = (navigation, user, successMessage = 'Login successful!') => {
    // Show success message if provided
    if (successMessage) {
        // You can use Toast here if available
        console.log(successMessage);
    }
    
    // Navigate to appropriate screen
    navigateAfterLogin(navigation, user);
}; 