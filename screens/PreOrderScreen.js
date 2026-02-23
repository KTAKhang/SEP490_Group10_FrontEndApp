import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
    Linking,
    Image,
    StatusBar,
    Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getFruitTypes, getMyPreOrders, createRemainingPayment } from '../services/preorderService';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/formatCurrency';
import { getProductImageUrl } from '../utils/productImage';
import { InlineLoading } from '../components/Loading';

const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN');
const NUM_COLUMNS = 2;

export default function PreOrderScreen({ navigation }) {
    const [fruitTypes, setFruitTypes] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState('list'); // 'list' | 'my'

    const load = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const [fruitRes, ordersRes] = await Promise.all([
                getFruitTypes({ limit: 50 }),
                getMyPreOrders().catch(() => ({ list: [] })),
            ]);
            setFruitTypes(fruitRes.list || []);
            setMyOrders(ordersRes.list || []);
        } catch (e) {
            Alert.alert('Lỗi', e.message || 'Không tải được dữ liệu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handlePayRemaining = async (order) => {
        try {
            const res = await createRemainingPayment(order._id);
            if (res.payUrl) await Linking.openURL(res.payUrl);
        } catch (e) {
            Alert.alert('Lỗi', e.message);
        }
    };

    const headerPaddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
            <LinearGradient
                colors={COLORS.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: headerPaddingTop }]}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đặt trước</Text>
            </LinearGradient>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, tab === 'list' && styles.tabActive]}
                    onPress={() => setTab('list')}
                >
                    <Text style={[styles.tabText, tab === 'list' && styles.tabTextActive]}>
                        Sản phẩm đặt trước
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === 'my' && styles.tabActive]}
                    onPress={() => setTab('my')}
                >
                    <Text style={[styles.tabText, tab === 'my' && styles.tabTextActive]}>
                        Đơn của tôi
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <InlineLoading text="Đang tải..." style={styles.loadWrap} color={COLORS.primary} />
            ) : tab === 'list' ? (
                <FlatList
                    data={fruitTypes}
                    keyExtractor={(item) => item._id}
                    numColumns={NUM_COLUMNS}
                    contentContainerStyle={styles.gridContent}
                    columnWrapperStyle={styles.gridRow}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <MaterialIcons name="eco" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Hiện không có sản phẩm đặt trước</Text>
                        </View>
                    }
                    renderItem={({ item: ft }) => (
                        <View style={styles.productContainer}>
                            <TouchableOpacity
                                style={styles.productCardWrapper}
                                activeOpacity={0.85}
                                onPress={() => navigation.navigate('PreOrderDetail', { fruitType: ft })}
                            >
                                <View style={styles.cardImageWrap}>
                                    {getProductImageUrl(ft) ? (
                                        <Image source={{ uri: getProductImageUrl(ft) }} style={styles.cardImage} resizeMode="cover" />
                                    ) : (
                                        <View style={styles.cardImagePlaceholder}>
                                            <MaterialIcons name="eco" size={48} color="#ccc" />
                                        </View>
                                    )}
                                    <View style={styles.preOrderBadge}>
                                        <Text style={styles.preOrderBadgeText}>Pre-order</Text>
                                    </View>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardName} numberOfLines={2}>{ft.name}</Text>
                                    <Text style={styles.cardPrice}>{formatCurrency(ft.estimatedPrice)}/kg</Text>
                                    <Text style={styles.cardRange}>
                                        {ft.minOrderKg}-{ft.maxOrderKg} kg
                                    </Text>
                                    <View style={styles.orderBtn}>
                                        <Text style={styles.orderBtnText}>Đặt trước</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
                    }
                >
                    {tab === 'my' && (
                        <>
                            {myOrders.length === 0 ? (
                                <View style={styles.emptyWrap}>
                                    <MaterialIcons name="receipt-long" size={64} color="#ccc" />
                                    <Text style={styles.emptyText}>Chưa có đơn đặt trước</Text>
                                </View>
                            ) : (
                                myOrders.map((order) => (
                                    <View key={order._id} style={styles.orderCard}>
                                        <Text style={styles.orderName}>
                                            {order.fruitTypeId?.name || 'N/A'} • {order.quantityKg} kg
                                        </Text>
                                        <Text style={styles.orderStatus}>Trạng thái: {order.status}</Text>
                                        <Text style={styles.orderTotal}>
                                            Tổng: {formatCurrency(order.totalAmount)}
                                            {order.canPayRemaining && order.remainingAmount > 0 && (
                                                <Text style={styles.remaining}>
                                                    {' '}• Còn lại: {formatCurrency(order.remainingAmount)}
                                                </Text>
                                            )}
                                        </Text>
                                        {order.canPayRemaining && order.remainingAmount > 0 && (
                                            <TouchableOpacity
                                                style={styles.payRemainBtn}
                                                onPress={() => handlePayRemaining(order)}
                                            >
                                                <Text style={styles.payRemainText}>Thanh toán 50% còn lại</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))
                            )}
                        </>
                    )}
                </ScrollView>
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
    },
    backBtn: { padding: 8, marginRight: 8 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
    tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
    tabText: { fontSize: 14, color: COLORS.text.secondary },
    tabTextActive: { color: COLORS.primary, fontWeight: '600' },
    loadWrap: { marginTop: 40 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    gridContent: { padding: 16, paddingBottom: 100 },
    gridRow: { paddingVertical: 8 },
    productContainer: {
        flex: 1,
        paddingHorizontal: 6,
        paddingVertical: 8,
    },
    productCardWrapper: {
        borderRadius: 20,
        backgroundColor: COLORS.white,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: COLORS.shadow.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    cardImageWrap: {
        width: '100%',
        height: 160,
        backgroundColor: COLORS.border.light,
        position: 'relative',
    },
    cardImage: { width: '100%', height: '100%' },
    cardImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    preOrderBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    preOrderBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    cardInfo: { padding: 12 },
    cardName: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary, marginBottom: 6, height: 40 },
    cardPrice: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
    cardRange: { fontSize: 12, color: COLORS.text.light, marginBottom: 8 },
    orderBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    orderBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    orderName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    orderStatus: { fontSize: 13, color: COLORS.text.secondary, marginBottom: 4 },
    orderTotal: { fontSize: 13, color: COLORS.text.primary },
    remaining: { color: COLORS.primary, fontWeight: '600' },
    payRemainBtn: {
        marginTop: 10,
        backgroundColor: COLORS.secondary,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    payRemainText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    emptyWrap: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { marginTop: 12, fontSize: 15, color: COLORS.text.light },
});
