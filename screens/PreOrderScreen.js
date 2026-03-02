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
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getFruitTypes, getMyPreOrders, createRemainingPayment } from '../services/preorderService';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/formatCurrency';
import { getProductImageUrl } from '../utils/productImage';
import { InlineLoading } from '../components/Loading';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

const STATUS_LABEL = {
    WAITING_FOR_ALLOCATION: 'Chờ phân bổ',
    WAITING_FOR_NEXT_BATCH: 'Chờ lô hàng sau',
    ALLOCATED_WAITING_PAYMENT: 'Đã phân bổ, thanh toán phần còn lại',
    READY_FOR_FULFILLMENT: 'Sẵn sàng giao',
    COMPLETED: 'Hoàn thành',
    REFUND: 'Hoàn tiền',
    WAITING_FOR_PRODUCT: 'Chờ phân bổ (cũ)',
};

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'WAITING_FOR_ALLOCATION', label: 'Chờ phân bổ' },
    { value: 'WAITING_FOR_NEXT_BATCH', label: 'Chờ lô hàng sau' },
    { value: 'ALLOCATED_WAITING_PAYMENT', label: 'Thanh toán còn lại' },
    { value: 'READY_FOR_FULFILLMENT', label: 'Sẵn sàng giao' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'REFUND', label: 'Hoàn tiền' },
];

const FILTERABLE_STATUSES = STATUS_OPTIONS.filter((s) => s.value !== '');

function DetailRow({ label, value, valueStyle }) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
        </View>
    );
}

const NUM_COLUMNS = 2;

export default function PreOrderScreen({ navigation, route }) {
    const [fruitTypes, setFruitTypes] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [myPagination, setMyPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [myLoading, setMyLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState('list');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [detailId, setDetailId] = useState(null);
    const [payingRemainingId, setPayingRemainingId] = useState(null);
    const [err, setErr] = useState('');
    const [msg, setMsg] = useState('');

    const loadFruitTypes = useCallback(async () => {
        try {
            const res = await getFruitTypes({ limit: 50 });
            setFruitTypes(res.list || []);
        } catch (e) {
            Alert.alert('Lỗi', e.message || 'Không tải được danh sách');
        }
    }, []);

    const loadMyOrders = useCallback(async (page = 1, showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setMyLoading(true);
        setErr('');
        try {
            const res = await getMyPreOrders({
                page,
                limit: 10,
                sortBy,
                sortOrder,
                status: statusFilter || undefined,
            });
            setMyOrders(res.list || []);
            setMyPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
        } catch (e) {
            setErr(e.message || 'Không tải được đơn đặt trước');
            setMyOrders([]);
        } finally {
            setMyLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter, sortBy, sortOrder]);

    const load = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        setLoading(true);
        try {
            await loadFruitTypes();
            if (tab === 'my') await loadMyOrders(1, showRefresh);
        } finally {
            setLoading(false);
            if (showRefresh) setRefreshing(false);
        }
    }, [tab, loadFruitTypes, loadMyOrders]);

    useEffect(() => {
        setLoading(true);
        loadFruitTypes()
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [loadFruitTypes]);

    useEffect(() => {
        if (tab === 'my') loadMyOrders(1);
    }, [tab, statusFilter, sortBy, sortOrder, loadMyOrders]);

    useEffect(() => {
        const remaining = route.params?.remaining;
        if (remaining === 'success') {
            setMsg('Thanh toán phần còn lại thành công.');
            if (tab === 'my') loadMyOrders(myPagination.page || 1);
            if (navigation.setParams) navigation.setParams({ remaining: undefined });
        } else if (remaining === 'failed') {
            setErr('Thanh toán phần còn lại thất bại hoặc đã hủy.');
            if (navigation.setParams) navigation.setParams({ remaining: undefined });
        }
    }, [route.params?.remaining]);

    const handlePayRemaining = async (order) => {
        setPayingRemainingId(order._id);
        setErr('');
        try {
            const res = await createRemainingPayment(order._id);
            if (res.payUrl) await Linking.openURL(res.payUrl);
            else Alert.alert('Lỗi', 'Không tạo được link thanh toán');
        } catch (e) {
            Alert.alert('Lỗi', e.message || 'Thanh toán thất bại');
        } finally {
            setPayingRemainingId(null);
        }
    };

    const getStatusBadgeStyle = (status) => {
        const map = {
            COMPLETED: styles.badgeCompleted,
            READY_FOR_FULFILLMENT: styles.badgeReady,
            ALLOCATED_WAITING_PAYMENT: styles.badgeAllocated,
            WAITING_FOR_NEXT_BATCH: styles.badgeWaitingBatch,
            WAITING_FOR_ALLOCATION: styles.badgeWaitingAlloc,
            WAITING_FOR_PRODUCT: styles.badgeWaitingAlloc,
            REFUND: styles.badgeRefund,
        };
        return map[status] || styles.badgeDefault;
    };

    const displayList = myOrders.filter((po) => po.status !== 'CANCELLED');
    const totalPages = myPagination?.totalPages || Math.ceil((myPagination?.total || 0) / (myPagination?.limit || 10)) || 1;
    const currentPage = myPagination?.page || 1;

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
                        <RefreshControl
                            refreshing={refreshing || myLoading}
                            onRefresh={() => { if (tab === 'my') loadMyOrders(1, true); }}
                        />
                    }
                >
                    {tab === 'my' && (
                        <>
                            {(msg || err) ? (
                                <View style={styles.messageWrap}>
                                    {msg ? (
                                        <View style={styles.msgSuccess}>
                                            <Text style={styles.msgSuccessText}>{msg}</Text>
                                        </View>
                                    ) : null}
                                    {err ? (
                                        <View style={styles.msgError}>
                                            <Text style={styles.msgErrorText}>{err}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            ) : null}

                            <View style={styles.filterRow}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
                                    <TouchableOpacity
                                        style={[styles.filterChip, statusFilter === '' && styles.filterChipActive]}
                                        onPress={() => setStatusFilter('')}
                                    >
                                        <Text style={[styles.filterChipText, statusFilter === '' && styles.filterChipTextActive]}>Tất cả</Text>
                                    </TouchableOpacity>
                                    {FILTERABLE_STATUSES.map((opt) => (
                                        <TouchableOpacity
                                            key={opt.value}
                                            style={[styles.filterChip, statusFilter === opt.value && styles.filterChipActive]}
                                            onPress={() => setStatusFilter(opt.value)}
                                        >
                                            <Text style={[styles.filterChipText, statusFilter === opt.value && styles.filterChipTextActive]} numberOfLines={1}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.sortRow}>
                                <Text style={styles.sortLabel}>Sắp xếp:</Text>
                                <View style={styles.pickerWrap}>
                                    <Picker
                                        selectedValue={`${sortBy}:${sortOrder}`}
                                        onValueChange={(v) => {
                                            const [sby, sord] = (v || '').split(':');
                                            if (sby && sord) { setSortBy(sby); setSortOrder(sord); }
                                        }}
                                        style={styles.picker}
                                        mode="dropdown"
                                    >
                                        <Picker.Item label="Mới nhất" value="createdAt:desc" />
                                        <Picker.Item label="Cũ nhất" value="createdAt:asc" />
                                        <Picker.Item label="Tổng cao → thấp" value="totalAmount:desc" />
                                        <Picker.Item label="Tổng thấp → cao" value="totalAmount:asc" />
                                    </Picker>
                                </View>
                            </View>

                            {displayList.length === 0 ? (
                                <View style={styles.emptyWrap}>
                                    <MaterialIcons name="receipt-long" size={64} color="#ccc" />
                                    <Text style={styles.emptyTitle}>Chưa có đơn đặt trước</Text>
                                    <Text style={styles.emptySubtext}>Khi bạn đặt trước, đơn sẽ hiển thị tại đây.</Text>
                                </View>
                            ) : (
                                <>
                                    {displayList.map((po) => {
                                        const ft = po.fruitTypeId;
                                        const isDetailOpen = detailId === po._id;
                                        const statusLabel = STATUS_LABEL[po.status] || po.status || '—';
                                        return (
                                            <View key={po._id} style={styles.orderCard}>
                                                <View style={styles.orderRow}>
                                                    <Text style={styles.orderId} numberOfLines={1}>{po._id}</Text>
                                                    <View style={[styles.statusBadge, getStatusBadgeStyle(po.status)]}>
                                                        <Text style={styles.statusBadgeText} numberOfLines={1}>{statusLabel}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.orderInfo}>
                                                    <View style={styles.orderInfoRow}>
                                                        <MaterialIcons name="event" size={16} color="#6b7280" />
                                                        <Text style={styles.orderInfoText}>{formatDate(po.createdAt)}</Text>
                                                    </View>
                                                    <View style={styles.orderInfoRow}>
                                                        <MaterialIcons name="inventory-2" size={16} color="#6b7280" />
                                                        <Text style={styles.orderInfoText} numberOfLines={1}>{ft?.name || '—'} · {po.quantityKg} kg</Text>
                                                    </View>
                                                    <View style={styles.orderInfoRow}>
                                                        <MaterialIcons name="person" size={16} color="#6b7280" />
                                                        <Text style={styles.orderInfoText} numberOfLines={1}>{po.receiver_name || '—'} · {po.receiver_phone || '—'}</Text>
                                                    </View>
                                                    <View style={styles.orderInfoRow}>
                                                        <MaterialIcons name="place" size={16} color="#6b7280" />
                                                        <Text style={styles.orderInfoText} numberOfLines={2}>{po.receiver_address || '—'}</Text>
                                                    </View>
                                                    {po.canPayRemaining && (po.remainingAmount || 0) > 0 && (
                                                        <View style={styles.remainingRow}>
                                                            <MaterialIcons name="payment" size={16} color={COLORS.primary} />
                                                            <Text style={styles.remainingText}>Còn phải thanh toán: {formatCurrency(po.remainingAmount)}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View style={styles.orderFooter}>
                                                    <View>
                                                        <Text style={styles.orderTotal}>{formatCurrency(po.totalAmount)}</Text>
                                                        <Text style={styles.orderDeposit}>
                                                            Đặt cọc: {formatCurrency(po.depositPaid)}
                                                            {(po.remainingAmount || 0) > 0 && ` · Còn lại: ${formatCurrency(po.remainingAmount)}`}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.orderActions}>
                                                        <TouchableOpacity
                                                            style={styles.btnDetail}
                                                            onPress={() => setDetailId((prev) => (prev === po._id ? null : po._id))}
                                                        >
                                                            <Text style={styles.btnDetailText}>{isDetailOpen ? 'Ẩn chi tiết' : 'Xem chi tiết'}</Text>
                                                        </TouchableOpacity>
                                                        {po.canPayRemaining && (
                                                            <TouchableOpacity
                                                                style={[styles.btnPayRemain, payingRemainingId === po._id && styles.btnPayRemainDisabled]}
                                                                onPress={() => handlePayRemaining(po)}
                                                                disabled={payingRemainingId === po._id}
                                                            >
                                                                <Text style={styles.btnPayRemainText}>
                                                                    {payingRemainingId === po._id ? 'Đang xử lý...' : 'Thanh toán còn lại'}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                </View>
                                                {isDetailOpen && (
                                                    <View style={styles.detailBlock}>
                                                        <DetailRow label="Người nhận" value={po.receiver_name || '—'} />
                                                        <DetailRow label="Số điện thoại" value={po.receiver_phone || '—'} />
                                                        <DetailRow label="Địa chỉ giao hàng" value={po.receiver_address || '—'} />
                                                        <DetailRow label="Tổng tiền" value={formatCurrency(po.totalAmount)} />
                                                        <DetailRow label="Đã đặt cọc" value={formatCurrency(po.depositPaid)} />
                                                        {(po.remainingAmount || 0) > 0 && (
                                                            <DetailRow label="Còn lại" value={formatCurrency(po.remainingAmount)} valueStyle={styles.detailValueGreen} />
                                                        )}
                                                        {po.remainingPaidAt && (
                                                            <DetailRow label="Đã thanh toán còn lại lúc" value={formatDate(po.remainingPaidAt)} />
                                                        )}
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}

                                    {totalPages > 1 && (
                                        <View style={styles.pagination}>
                                            <TouchableOpacity
                                                style={[styles.pageBtn, currentPage <= 1 && styles.pageBtnDisabled]}
                                                onPress={() => loadMyOrders(currentPage - 1)}
                                                disabled={currentPage <= 1}
                                            >
                                                <MaterialIcons name="chevron-left" size={24} color={currentPage <= 1 ? '#9ca3af' : '#374151'} />
                                            </TouchableOpacity>
                                            <Text style={styles.pageText}>Trang {currentPage} / {totalPages}</Text>
                                            <TouchableOpacity
                                                style={[styles.pageBtn, currentPage >= totalPages && styles.pageBtnDisabled]}
                                                onPress={() => loadMyOrders(currentPage + 1)}
                                                disabled={currentPage >= totalPages}
                                            >
                                                <MaterialIcons name="chevron-right" size={24} color={currentPage >= totalPages ? '#9ca3af' : '#374151'} />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </>
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
    orderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    orderId: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#6b7280', flex: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
    statusBadgeText: { fontSize: 11, fontWeight: '600' },
    badgeCompleted: { backgroundColor: '#dcfce7' },
    badgeReady: { backgroundColor: '#dcfce7' },
    badgeAllocated: { backgroundColor: '#f3e8ff' },
    badgeWaitingBatch: { backgroundColor: '#fef3c7' },
    badgeWaitingAlloc: { backgroundColor: '#f3f4f6' },
    badgeRefund: { backgroundColor: '#fee2e2' },
    badgeDefault: { backgroundColor: '#f3f4f6' },
    orderInfo: { marginBottom: 12 },
    orderInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
    orderInfoText: { fontSize: 13, color: '#374151', flex: 1 },
    remainingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    remainingText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 },
    orderTotal: { fontSize: 17, fontWeight: '700', color: '#111827' },
    orderDeposit: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    orderActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    btnDetail: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
    btnDetailText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    btnPayRemain: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
    btnPayRemainText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
    btnPayRemainDisabled: { opacity: 0.6 },
    detailBlock: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
    detailRow: { marginBottom: 8 },
    detailLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
    detailValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
    detailValueGreen: { color: COLORS.primary, fontWeight: '600' },
    messageWrap: { marginBottom: 12 },
    msgSuccess: { padding: 12, backgroundColor: '#dcfce7', borderRadius: 10, borderWidth: 1, borderColor: '#86efac' },
    msgSuccessText: { fontSize: 13, color: '#166534', fontWeight: '500' },
    msgError: { padding: 12, backgroundColor: '#fee2e2', borderRadius: 10, borderWidth: 1, borderColor: '#fca5a5' },
    msgErrorText: { fontSize: 13, color: '#b91c1c', fontWeight: '500' },
    filterRow: { marginBottom: 10 },
    filterChips: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db' },
    filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterChipText: { fontSize: 13, color: '#4b5563' },
    filterChipTextActive: { color: '#fff', fontWeight: '600' },
    sortRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    sortLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
    pickerWrap: { flex: 1, minHeight: 40, justifyContent: 'center' },
    picker: { color: '#374151' },
    pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16 },
    pageBtn: { padding: 8 },
    pageBtnDisabled: { opacity: 0.5 },
    pageText: { fontSize: 14, fontWeight: '500', color: '#374151', minWidth: 100, textAlign: 'center' },
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
    emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: '600', color: '#374151' },
    emptySubtext: { marginTop: 6, fontSize: 13, color: '#6b7280', textAlign: 'center', paddingHorizontal: 24 },
});
