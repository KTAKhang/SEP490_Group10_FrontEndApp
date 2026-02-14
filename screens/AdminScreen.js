import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';

export default function AdminScreen() {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => dispatch(logoutUser())
                },
            ]
        );
    };
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.welcome}>Welcome!</Text>
                <Text style={styles.userInfo}>
                    Hello, {user?.name || user?.email || 'User'}
                </Text>

                <View style={styles.userDetails}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{user?.email}</Text>

                    {user?.name && (
                        <>
                            <Text style={styles.label}>Name:</Text>
                            <Text style={styles.value}>{user.name}</Text>
                        </>
                    )}
                    <Text style={styles.label}>Please Connect Web to Administration!</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 50,
    },
    welcome: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#333',
    },
    userInfo: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 40,
        color: '#666',
    },
    userDetails: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 40,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
        color: '#333',
    },
    value: {
        fontSize: 16,
        marginBottom: 15,
        color: '#666',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 15,
        borderRadius: 8,
        marginTop: 'auto',
        marginBottom: 50,
    },
    logoutButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
    },
});