import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
    Linking,
    StatusBar,
    Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getMyPreOrders, createRemainingPayment } from '../services/preorderService';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/formatCurrency';
import BottomNavigation from '../components/BottomNavigation';
import { InlineLoading } from '../components/Loading';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

const STATUS_TO_KEY = {
    WAITING_FOR_ALLOCATION: 'statusWaitingAlloc',
    WAITING_FOR_NEXT_BATCH: 'statusWaitingBatch',
    ALLOCATED_WAITING_PAYMENT: 'statusPayRemaining',
    READY_FOR_FULFILLMENT: 'statusReady',
    COMPLETED: 'statusCompleted',
    REFUND: 'statusRefund',
    WAITING_FOR_PRODUCT: 'statusWaitingAlloc',
};

const STATUS_OPTIONS = [
    { value: '', labelKey: 'statusAll' },
    { value: 'WAITING_FOR_ALLOCATION', labelKey: 'statusWaitingAlloc' },
    { value: 'WAITING_FOR_NEXT_BATCH', labelKey: 'statusWaitingBatch' },
    { value: 'ALLOCATED_WAITING_PAYMENT', labelKey: 'statusPayRemaining' },
    { value: 'READY_FOR_FULFILLMENT', labelKey: 'statusReady' },
    { value: 'COMPLETED', labelKey: 'statusCompleted' },
    { value: 'REFUND', labelKey: 'statusRefund' },
];

function DetailRow({ label, value, valueStyle }) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
        </View>
    );
}

export default function PreOrderHistoryScreen({ navigation, route }) {
    const { t } = useTranslation();
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [err, setErr] = useState('');
    const [msg, setMsg] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [detailId, setDetailId] = useState(null);
    const [payingRemainingId, setPayingRemainingId] = useState(null);

    const loadOrders = useCallback(async (page = 1, showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        setErr('');
        try {
            const res = await getMyPreOrders({
                page,
                limit: 10,
                sortBy,
                sortOrder,
                status: statusFilter || undefined,
            });
            setList(res.list || []);
            setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
        } catch (e) {
            setErr(e.message || t('preOrder.cannotLoadList'));
            setList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter, sortBy, sortOrder]);

    useEffect(() => {
        loadOrders(1);
    }, [loadOrders]);

    useEffect(() => {
        const remaining = route.params?.remaining;
        if (remaining === 'success') {
            setMsg(t('preOrder.payRemainingSuccess'));
            loadOrders(pagination.page || 1);
            navigation.setParams?.({ remaining: undefined });
        } else if (remaining === 'failed') {
            setErr(t('preOrder.payRemainingFailed'));
            navigation.setParams?.({ remaining: undefined });
        }
    }, [route.params?.remaining]);

    const handlePayRemaining = async (order) => {
        setPayingRemainingId(order._id);
        setErr('');
        try {
            const res = await createRemainingPayment(order._id);
            if (res.payUrl) await Linking.openURL(res.payUrl);
            else Alert.alert(t('common.error'), t('preOrder.payRemaining'));
        } catch (e) {
            Alert.alert(t('common.error'), e.message || t('preOrder.payRemaining'));
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

    const displayList = list.filter((po) => po.status !== 'CANCELLED');
    const totalPages = pagination?.totalPages || Math.ceil((pagination?.total || 0) / (pagination?.limit || 10)) || 1;
    const currentPage = pagination?.page || 1;
    const headerPaddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12;

    if (loading && list.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
                <LinearGradient colors={COLORS.gradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: headerPaddingTop }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('preOrder.title')}</Text>
                </LinearGradient>
                <InlineLoading text={t('order.loadingOrders')} style={styles.loadWrap} color={COLORS.primary} />
                <BottomNavigation />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
            <LinearGradient colors={COLORS.gradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.header, { paddingTop: headerPaddingTop }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('preOrder.title')}</Text>
            </LinearGradient>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(1, true)} colors={[COLORS.primary]} tintColor={COLORS.primary} />
                }
            >
                {(msg || err) ? (
                    <View style={styles.messageWrap}>
                        {msg ? <View style={styles.msgSuccess}><Text style={styles.msgSuccessText}>{msg}</Text></View> : null}
                        {err ? <View style={styles.msgError}><Text style={styles.msgErrorText}>{err}</Text></View> : null}
                    </View>
                ) : null}

                <View style={styles.sortRow}>
                    <Text style={styles.sortLabel}>{t('preOrder.status')}:</Text>
                    <View style={styles.pickerWrap}>
                        <Picker
                            selectedValue={statusFilter}
                            onValueChange={(v) => setStatusFilter(v ?? '')}
                            style={styles.picker}
                            mode="dropdown"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <Picker.Item key={opt.value || 'all'} label={t('preOrder.' + opt.labelKey)} value={opt.value} />
                            ))}
                        </Picker>
                    </View>
                </View>
                <View style={styles.sortRow}>
                    <Text style={styles.sortLabel}>{t('preOrder.sort')}:</Text>
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
                            <Picker.Item label={t('order.sortNewest')} value="createdAt:desc" />
                            <Picker.Item label={t('order.sortOldest')} value="createdAt:asc" />
                            <Picker.Item label="Total high → low" value="totalAmount:desc" />
                            <Picker.Item label="Total low → high" value="totalAmount:asc" />
                        </Picker>
                    </View>
                </View>

                {displayList.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <MaterialIcons name="receipt-long" size={64} color="#ccc" />
                        <Text style={styles.emptyTitle}>{t('preOrder.noPreOrders')}</Text>
                        <Text style={styles.emptySubtext}>{t('preOrder.viewPreOrders')}</Text>
                    </View>
                ) : (
                    <>
                        {displayList.map((po) => {
                            const ft = po.fruitTypeId;
                            const isDetailOpen = detailId === po._id;
                            const statusLabel = STATUS_TO_KEY[po.status] ? t('preOrder.' + STATUS_TO_KEY[po.status]) : (po.status || '—');
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
                                                <Text style={styles.remainingText}>{t('preOrder.remainingToPay')}: {formatCurrency(po.remainingAmount)}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.orderFooter}>
                                        <View>
                                            <Text style={styles.orderTotal}>{formatCurrency(po.totalAmount)}</Text>
                                            <Text style={styles.orderDeposit}>
                                                {t('preOrder.depositPaid')}: {formatCurrency(po.depositPaid)}
                                                {(po.remainingAmount || 0) > 0 && ` · ${t('preOrder.remaining')}: ${formatCurrency(po.remainingAmount)}`}
                                            </Text>
                                        </View>
                                        <View style={styles.orderActions}>
                                            <TouchableOpacity style={styles.btnDetail} onPress={() => setDetailId((prev) => (prev === po._id ? null : po._id))}>
                                                <Text style={styles.btnDetailText}>{isDetailOpen ? t('preOrder.hideDetail') : t('preOrder.viewDetail')}</Text>
                                            </TouchableOpacity>
                                            {po.canPayRemaining && (
                                                <TouchableOpacity
                                                    style={[styles.btnPayRemain, payingRemainingId === po._id && styles.btnPayRemainDisabled]}
                                                    onPress={() => handlePayRemaining(po)}
                                                    disabled={payingRemainingId === po._id}
                                                >
                                                    <Text style={styles.btnPayRemainText}>{payingRemainingId === po._id ? t('preOrder.processing') : t('preOrder.payRemaining')}</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                    {isDetailOpen && (
                                        <View style={styles.detailBlock}>
                                            <DetailRow label={t('preOrder.receiverName')} value={po.receiver_name || '—'} />
                                            <DetailRow label={t('preOrder.receiverPhone')} value={po.receiver_phone || '—'} />
                                            <DetailRow label={t('preOrder.receiverAddress')} value={po.receiver_address || '—'} />
                                            <DetailRow label={t('preOrder.totalAmount')} value={formatCurrency(po.totalAmount)} />
                                            <DetailRow label={t('preOrder.depositPaid')} value={formatCurrency(po.depositPaid)} />
                                            {(po.remainingAmount || 0) > 0 && <DetailRow label={t('preOrder.remaining')} value={formatCurrency(po.remainingAmount)} valueStyle={styles.detailValueGreen} />}
                                            {po.remainingPaidAt && <DetailRow label={t('preOrder.remainingPaidAt')} value={formatDate(po.remainingPaidAt)} />}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                        {totalPages > 1 && (
                            <View style={styles.pagination}>
                                <TouchableOpacity style={[styles.pageBtn, currentPage <= 1 && styles.pageBtnDisabled]} onPress={() => loadOrders(currentPage - 1)} disabled={currentPage <= 1}>
                                    <MaterialIcons name="chevron-left" size={24} color={currentPage <= 1 ? '#9ca3af' : '#374151'} />
                                </TouchableOpacity>
                                <Text style={styles.pageText}>{t('preOrder.pageOf', { current: currentPage, total: totalPages })}</Text>
                                <TouchableOpacity style={[styles.pageBtn, currentPage >= totalPages && styles.pageBtnDisabled]} onPress={() => loadOrders(currentPage + 1)} disabled={currentPage >= totalPages}>
                                    <MaterialIcons name="chevron-right" size={24} color={currentPage >= totalPages ? '#9ca3af' : '#374151'} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
            <BottomNavigation />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
    backBtn: { padding: 8, marginRight: 8 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
    loadWrap: { marginTop: 40 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 180 },
    sortRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    sortLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
    pickerWrap: { flex: 1, minHeight: 40, justifyContent: 'center' },
    picker: { color: '#374151' },
    orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
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
    pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16 },
    pageBtn: { padding: 8 },
    pageBtnDisabled: { opacity: 0.5 },
    pageText: { fontSize: 14, fontWeight: '500', color: '#374151', minWidth: 100, textAlign: 'center' },
    emptyWrap: { alignItems: 'center', paddingVertical: 48 },
    emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: '600', color: '#374151' },
    emptySubtext: { marginTop: 6, fontSize: 13, color: '#6b7280', textAlign: 'center', paddingHorizontal: 24 },
});
