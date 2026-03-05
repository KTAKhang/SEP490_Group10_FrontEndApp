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
import { useTranslation } from 'react-i18next';

const BottomNavigation = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('HomePage');
    const navigation = useNavigation();
    const route = useRoute();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    if (user?.role_name === 'admin') return null;

    const tabs = [
        { name: 'HomePage', icon: 'home', label: t('nav.home'), requiresAuth: false },
        { name: 'Contact', icon: 'support-agent', label: t('nav.contact'), requiresAuth: true },
        { name: 'OrderHistory', icon: 'local-shipping', label: t('nav.orders'), requiresAuth: true },
        { name: 'Profile', icon: 'person', label: t('nav.profile'), requiresAuth: true },
    ];

    const handleTabPress = (tab) => {
        if (tab.requiresAuth && !isAuthenticated) {
            Alert.alert(
                t('common.loginRequired'),
                `You need to log in to access this. Would you like to log in now?`,
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('common.login'), onPress: () => navigation.navigate('Login') }
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
        <SafeAreaView style={styles.container} edges={['bottom']}>
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
        height: 52,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
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
        fontSize: 11,
        marginTop: 2,
        fontWeight: '400',
    },
});

export default BottomNavigation;
