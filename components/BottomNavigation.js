import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

const BottomNavigation = () => {
    const [activeTab, setActiveTab] = useState('HomePage');
    const navigation = useNavigation();
    const route = useRoute();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    // Admin không có Cart/Profile/OrderHistory trong stack — ẩn bottom nav để tránh lỗi navigate
    if (user?.role_name === 'admin') return null;

    const tabs = [
        { name: 'HomePage', icon: 'home', label: 'Trang chủ', requiresAuth: false },
        { name: 'Cart', icon: 'shopping-cart', label: 'Giỏ hàng', requiresAuth: true },
        { name: 'OrderHistory', icon: 'local-shipping', label: 'Đơn hàng', requiresAuth: true },
        { name: 'Vouchers', icon: 'confirmation-number', label: 'Voucher', requiresAuth: true },
        { name: 'Profile', icon: 'person', label: 'Hồ sơ', requiresAuth: true },
    ];

    const handleTabPress = (tab) => {
        if (tab.requiresAuth && !isAuthenticated) {
            Alert.alert(
                'Login required',
                `You need to log in to access ${tab.label.toLowerCase()}.Would you like to log in now?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log in', onPress: () => navigation.navigate('Login') }
                ]
            );
            return;
        }

        setActiveTab(tab.name);
        navigation.navigate(tab.name);
    };

    useFocusEffect(
        React.useCallback(() => {
            const currentRouteName = route.name;
            const tabExists = tabs.some(tab => tab.name === currentRouteName);
            if (tabExists) {
                setActiveTab(currentRouteName);
            }
        }, [route.name])
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.navigation}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.name}
                        style={[
                            styles.tabItem,
                            !isAuthenticated && tab.requiresAuth && styles.disabledTab
                        ]}
                        onPress={() => handleTabPress(tab)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconContainer}>
                            <MaterialIcons
                                name={tab.icon}
                                size={24}
                                color={
                                    activeTab === tab.name
                                        ? '#007AFF'
                                        : (!isAuthenticated && tab.requiresAuth)
                                            ? '#D1D5DB'
                                            : '#9CA3AF'
                                }
                            />
                        </View>
                        <Text
                            style={[
                                styles.tabLabel,
                                {
                                    color: activeTab === tab.name
                                        ? '#007AFF'
                                        : (!isAuthenticated && tab.requiresAuth)
                                            ? '#D1D5DB'
                                            : '#9CA3AF',
                                },
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    navigation: {
        flexDirection: 'row',
        height: 64,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    disabledTab: {
        opacity: 0.6,
    },
    iconContainer: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '400',
    },
});

export default BottomNavigation;
