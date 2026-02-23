import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from '../services/notificationService';
import { COLORS } from '../constants/colors';
import { InlineLoading } from '../components/Loading';

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return d.toLocaleDateString('vi-VN');
};

const NotificationItem = ({ item, onPress }) => (
    <TouchableOpacity
        style={[styles.notiCard, !item.isRead && styles.notiCardUnread]}
        onPress={() => onPress(item)}
        activeOpacity={0.8}
    >
        <View style={styles.notiIconWrap}>
            <MaterialIcons
                name={item.type === 'order' ? 'local-shipping' : item.type === 'discount' ? 'local-offer' : 'notifications'}
                size={24}
                color={item.isRead ? COLORS.text.secondary : COLORS.primary}
            />
        </View>
        <View style={styles.notiBody}>
            <Text style={[styles.notiTitle, !item.isRead && styles.notiTitleUnread]} numberOfLines={1}>
                {item.title}
            </Text>
            <Text style={styles.notiBodyText} numberOfLines={2}>
                {item.body}
            </Text>
            <Text style={styles.notiTime}>{formatDate(item.createdAt)}</Text>
        </View>
    </TouchableOpacity>
);

export default function NotificationsScreen({ navigation }) {
    const [list, setList] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const [res, count] = await Promise.all([
                getNotifications({ page: 1, limit: 50 }),
                getUnreadCount(),
            ]);
            setList(res.list);
            setUnreadCount(count);
        } catch (e) {
            if (showRefresh) Alert.alert('Lỗi', e.message || 'Không tải được thông báo');
            else setList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleItemPress = async (item) => {
        if (!item.isRead) {
            try {
                await markAsRead(item._id);
                setList((prev) =>
                    prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
                );
                setUnreadCount((c) => Math.max(0, c - 1));
            } catch (_) {}
        }
        if (item.data?.action === 'view_order' && item.data?.orderId) {
            navigation.navigate('OrderDetails', { orderId: item.data.orderId });
        }
    };

    const handleReadAll = async () => {
        try {
            await markAllAsRead();
            setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (e) {
            Alert.alert('Lỗi', e.message);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={COLORS.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông báo</Text>
                {unreadCount > 0 && (
                    <TouchableOpacity style={styles.readAllBtn} onPress={handleReadAll}>
                        <Text style={styles.readAllText}>Đọc tất cả</Text>
                    </TouchableOpacity>
                )}
            </LinearGradient>

            {loading ? (
                <InlineLoading text="Đang tải..." style={styles.loadWrap} color={COLORS.primary} />
            ) : (
                <FlatList
                    data={list}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <NotificationItem item={item} onPress={handleItemPress} />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <MaterialIcons name="notifications-off" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Chưa có thông báo</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 14,
        paddingTop: (typeof window !== 'undefined' ? 0 : 44) + 14,
    },
    backBtn: { padding: 8, marginRight: 8 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
    readAllBtn: { padding: 8 },
    readAllText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    loadWrap: { marginTop: 40 },
    listContent: { padding: 16, paddingBottom: 32 },
    notiCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    notiCardUnread: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
    notiIconWrap: { marginRight: 12 },
    notiBody: { flex: 1 },
    notiTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text.primary, marginBottom: 4 },
    notiTitleUnread: { color: COLORS.secondary },
    notiBodyText: { fontSize: 13, color: COLORS.text.secondary, marginBottom: 4 },
    notiTime: { fontSize: 11, color: COLORS.text.light },
    emptyWrap: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { marginTop: 12, fontSize: 15, color: COLORS.text.light },
});
