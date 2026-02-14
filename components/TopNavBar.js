import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';

const TopNavBar = () => {
    const navigation = useNavigation();
    const { cart } = useSelector((state) => state.cart);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const itemCount = cart?.item_count || 0;

    const handleCartPress = () => {
        if (isAuthenticated) {
            navigation.navigate('Cart');
        } else {
            // Hiển thị thông báo yêu cầu đăng nhập
            Alert.alert(
                'Yêu cầu đăng nhập',
                'Bạn cần đăng nhập để xem giỏ hàng. Bạn có muốn đăng nhập ngay không?',
                [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') }
                ]
            );
        }
    };

    const handleLoginPress = () => {
        navigation.navigate('Login');
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
            <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <Text style={styles.logo}>ShopApp</Text>
                
                <View style={styles.rightButtons}>
                    {!isAuthenticated && (
                        <TouchableOpacity 
                            style={styles.loginButton}
                            onPress={handleLoginPress}
                        >
                            <Icon name="person" size={20} color={COLORS.white} />
                            <Text style={styles.loginText}>Đăng nhập</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                        style={styles.cartButton}
                        onPress={handleCartPress}
                    >
                        <Icon name="shopping-cart" size={24} color={COLORS.white} />
                        {isAuthenticated && itemCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{itemCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: (StatusBar.currentHeight || 0) + 12,
        elevation: 5,
        shadowColor: COLORS.shadow.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    logo: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.white,
        letterSpacing: 1,
    },
    rightButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 4,
    },
    loginText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    cartButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '700',
    },
});

export default TopNavBar;