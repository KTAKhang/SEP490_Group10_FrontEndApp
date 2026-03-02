import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    StyleSheet,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyContacts } from '../store/slices/contactSlice';
import { COLORS } from '../constants/colors';

export default function ContactHistoryScreen({ navigation }) {
    const dispatch = useDispatch();

    const { contacts, contactsLoading, contactsError } = useSelector(
        (state) => state.contact,
    );

    useEffect(() => {
        dispatch(fetchMyContacts());
    }, [dispatch]);

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchMyContacts());
        }, [dispatch]),
    );

    const getStatusText = (status) => {
        if (!status) return 'Đang xử lý';
        if (status === 'resolved') return 'Đã phản hồi';
        if (status === 'pending') return 'Chờ xử lý';
        return status;
    };

    const getStatusColor = (status) => {
        if (!status || status === 'pending') return '#F59E0B';
        if (status === 'resolved') return '#10B981';
        return '#6B7280';
    };

    const renderItem = ({ item }) => {
        const id = item._id || item.id;
        const subject = item.subject || 'Không có tiêu đề';
        const category = item.category || 'Khác';
        const statusColor = getStatusColor(item.status);

        const createdAt = item.createdAt
            ? new Date(item.createdAt).toLocaleDateString('vi-VN')
            : '';

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                    navigation.navigate('ContactDetail', { contactId: id })
                }
            >
                <View style={styles.cardTop}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{category}</Text>
                    </View>

                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: statusColor + '20' },
                        ]}
                    >
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {getStatusText(item.status)}
                        </Text>
                    </View>
                </View>

                <Text style={styles.subject}>{subject}</Text>

                <View style={styles.cardBottom}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text style={styles.date}> {createdAt}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

            <LinearGradient
                colors={COLORS.gradient.primary}
                style={styles.headerGradient}
            >
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>

                        <Text style={styles.headerTitle}>Lịch sử liên hệ</Text>

                        <View style={{ width: 42 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <View style={styles.content}>
                {contactsLoading && (!contacts || contacts.length === 0) ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>
                            Đang tải lịch sử liên hệ...
                        </Text>
                    </View>
                ) : contactsError ? (
                    <View style={styles.center}>
                        <Text style={styles.errorText}>{contactsError}</Text>
                    </View>
                ) : !contacts || contacts.length === 0 ? (
                    <View style={styles.center}>
                        <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={60}
                            color="#CBD5E1"
                        />
                        <Text style={styles.emptyTitle}>
                            Bạn chưa có liên hệ nào
                        </Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => navigation.navigate('ContactForm')}
                        >
                            <Text style={styles.createButtonText}>
                                Tạo liên hệ mới
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={contacts}
                        keyExtractor={(item) => item._id || item.id}
                        renderItem={renderItem}
                        refreshControl={
                            <RefreshControl
                                refreshing={contactsLoading}
                                onRefresh={() => dispatch(fetchMyContacts())}
                            />
                        }
                        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    headerGradient: {
        paddingTop: StatusBar.currentHeight + 10,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },

    headerButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },

    content: {
        flex: 1,
        marginTop: -20,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },

    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },

    categoryBadge: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },

    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },

    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },

    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },

    subject: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: 8,
    },

    cardBottom: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    date: {
        fontSize: 13,
        color: '#6B7280',
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },

    loadingText: {
        marginTop: 10,
        color: COLORS.text.secondary,
    },

    errorText: {
        color: '#EF4444',
    },

    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 16,
        color: COLORS.text.secondary,
    },

    createButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 999,
    },

    createButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});