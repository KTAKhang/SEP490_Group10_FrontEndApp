import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    StatusBar,
    Alert,
    RefreshControl,
    Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigation from '../components/BottomNavigation';
import { InlineLoading } from '../components/Loading';
import { fetchOrderByUser, cancelOrder, retryPayment, resetPagination } from '../store/slices/orderSlice';
import { Linking } from 'react-native';
import { formatCurrency } from '../utils/formatCurrency';

const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/100?text=SP';
function getProductImageFromItem(item) {
    if (!item) return DEFAULT_PRODUCT_IMAGE;
    const uri = item.product_image ?? item.image
        ?? item.product_id?.images?.[0]
        ?? item.product_id?.featuredImage
        ?? item.product_id?.image;
    return (uri && typeof uri === 'string') ? uri : DEFAULT_PRODUCT_IMAGE;
}

const FILTER_KEYS = ['filterAll', 'filterPending', 'filterConfirmed', 'filterShipping', 'filterDelivered', 'filterCancelled', 'filterRefunded'];
const filterToStatusMapping = {
    filterAll: '',
    filterPending: 'PENDING',
    filterConfirmed: 'READY-TO-SHIP',
    filterShipping: 'SHIPPING',
    filterDelivered: 'COMPLETED',
    filterCancelled: 'CANCELLED',
    filterRefunded: 'REFUND',
};

const OrderHistoryScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [selectedFilter, setSelectedFilter] = useState('filterAll');
    const [cancellingOrders, setCancellingOrders] = useState(new Set());
    const [refreshing, setRefreshing] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);

    const LIMIT = 10;

    const {
        orders: orderData,
        isLoading: orderLoading,
        error: orderError,
        cancelSuccess,
        cancelMessage,
        currentPage,
        totalPages,
        total
    } = useSelector((state) => state.order);

    const totalPagesComputed = totalPages >= 1 ? totalPages : Math.max(1, Math.ceil((total || 0) / LIMIT));

    const dispatch = useDispatch();

    // Get current status filter for API
    const getCurrentStatusFilter = () => {
        return filterToStatusMapping[selectedFilter] || '';
    };

    useEffect(() => {
        dispatch(fetchOrderByUser({
            page: 1,
            limit: LIMIT,
            status_names: getCurrentStatusFilter(),
            sortBy: 'createdAt',
            sortOrder: 'desc',
        }));
    }, [dispatch]);

    // Sửa lại handleFilterChange function
    const handleFilterChange = useCallback(async (filter) => {
        setSelectedFilter(filter);
        setFilterLoading(true); // Bắt đầu loading

        const statusFilter = filterToStatusMapping[filter] || '';

        try {
            dispatch(resetPagination());
            await dispatch(fetchOrderByUser({
                page: 1,
                limit: LIMIT,
                status_names: statusFilter,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            })).unwrap();
        } catch (error) {
            console.error('Error filtering orders:', error);
        } finally {
            setFilterLoading(false); // Kết thúc loading
        }
    }, [dispatch]);

    // Handle cancel success
    useEffect(() => {
        if (cancelSuccess && cancelMessage) {
            Alert.alert(t('reviews.success'), cancelMessage);
            // Refresh current filter after successful cancel
            const statusFilter = getCurrentStatusFilter();
            dispatch(resetPagination());
            dispatch(fetchOrderByUser({
                page: 1,
                limit: LIMIT,
                status_names: statusFilter,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            }));
        }
    }, [cancelSuccess, cancelMessage, selectedFilter, dispatch]);

    // Refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        dispatch(resetPagination());
        const statusFilter = getCurrentStatusFilter();
        await dispatch(fetchOrderByUser({
            page: 1,
            limit: LIMIT,
            status_names: statusFilter,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        }));
        setRefreshing(false);
    }, [dispatch, selectedFilter]);

    // Chuyển đến trang cụ thể (phân trang kiểu Trang 1, 2, 3...)
    const goToPage = useCallback((page) => {
        if (page < 1 || page > totalPagesComputed) return;
        const statusFilter = getCurrentStatusFilter();
        dispatch(fetchOrderByUser({
            page,
            limit: LIMIT,
            status_names: statusFilter,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        }));
    }, [dispatch, totalPagesComputed, selectedFilter]);

    // Transform API data to match UI format
    const transformOrderData = (apiOrders) => {
        if (!apiOrders || !Array.isArray(apiOrders)) return [];

        const statusToKey = {
            'PENDING': 'filterPending',
            'PAID': 'filterConfirmed',
            'READY-TO-SHIP': 'filterConfirmed',
            'SHIPPING': 'filterShipping',
            'COMPLETED': 'filterDelivered',
            'CANCELLED': 'filterCancelled',
            'REFUND': 'filterRefunded',
        };
        const statusColorsByKey = {
            filterPending: { color: '#f59e0b', bg: '#fffbeb' },
            filterConfirmed: { color: '#8b5cf6', bg: '#f3e8ff' },
            filterShipping: { color: '#3b82f6', bg: '#eff6ff' },
            filterDelivered: { color: '#10b981', bg: '#ecfdf5' },
            filterCancelled: { color: '#6b7280', bg: '#f3f4f6' },
            filterRefunded: { color: '#ef4444', bg: '#fef2f2' },
        };

        return apiOrders.map((order, index) => {
            const statusName = (order.order_status?.name ?? order.order_status_id?.name ?? '').toString().trim().toUpperCase().replace(/\s+/g, '-');
            const statusKey = statusToKey[statusName] || statusToKey[order.order_status?.name] || 'filterPending';
            const statusColor = statusColorsByKey[statusKey] || statusColorsByKey.filterPending;

            // Format date
            const formatDate = (dateString) => {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            };

            // Tên/ảnh sản phẩm trên list cần backend GET /order/my-orders trả details (xem docs/BACKEND_ORDER_LIST_ADD_DETAILS.md)
            const items = order.details ?? order.order_details ?? order.items ?? order.orderDetails ?? [];
            const firstItem = items.length > 0 ? items[0] : null;
            const orderIdStr = typeof order.order_id === 'string' ? order.order_id : (order.order_id ?? order._id)?.toString?.() ?? '';
            const shortId = `#ORD-${orderIdStr.slice(-8).toUpperCase()}`;

            const paymentStatus = (order.payment?.status ?? order.payment_status ?? '').toString().toUpperCase();
            const paymentStatusKeyMap = { PENDING: 'paymentPending', SUCCESS: 'paymentSuccess', UNPAID: 'paymentUnpaid', CANCELLED: 'filterCancelled', FAILED: 'paymentFailed' };
            const paymentStatusColors = {
                PENDING: { bg: '#fef3c7', color: '#b45309' },
                SUCCESS: { bg: '#dbeafe', color: '#1d4ed8' },
                UNPAID: { bg: '#f3f4f6', color: '#4b5563' },
                CANCELLED: { bg: '#fef3c7', color: '#b45309' },
                FAILED: { bg: '#fee2e2', color: '#b91c1c' },
            };
            const paymentStatusLabelKey = paymentStatusKeyMap[paymentStatus] || 'paymentUnpaid';
            const paymentStatusStyle = paymentStatusColors[paymentStatus] || paymentStatusColors.UNPAID;

            const receiverName = order.receiver_name ?? order.receiverName ?? '-';
            const receiverPhone = order.receiver_phone ?? order.receiverPhone ?? '';
            const fullDate = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '';

            return {
                id: shortId,
                fullOrderId: (order._id ?? order.order_id)?.toString?.() ?? '',
                orderId: order._id ?? order.order_id,
                date: formatDate(order.createdAt),
                fullDate,
                items: items.length || 1,
                total: order.total_price,
                statusKey,
                statusColor: statusColor.color,
                statusBg: statusColor.bg,
                paymentStatus,
                paymentStatusLabelKey,
                paymentStatusBg: paymentStatusStyle.bg,
                paymentStatusColor: paymentStatusStyle.color,
                paymentMethod: order.payment_method || order.paymentMethod || 'N/A',
                discountCode: order.discount_code,
                discountAmount: order.discount_amount,
                receiverName,
                receiverPhone,
                receiverAddress: order.receiver_address ?? order.receiverAddress ?? '',
                product: {
                    name: firstItem?.product_name ?? firstItem?.name ?? shortId,
                    details: receiverPhone ? `${t('order.receiverLabel')}: ${receiverName} · ${receiverPhone}` : `${t('order.receiverLabel')}: ${receiverName}`,
                    price: firstItem?.price ?? order.total_price,
                    image: getProductImageFromItem(firstItem),
                },
                originalOrder: order,
            };
        });
    };

    const orders = transformOrderData(orderData);

    const canCancelOrder = (order) => {
        if (order.statusKey !== 'filterPending') return false;
        const method = (order.paymentMethod ?? order.originalOrder?.payment_method ?? '').toString().toUpperCase();
        return method === 'COD';
    };

    const handleRePaymentOrder = async (order) => {
        Alert.alert(
            t('order.retryPayment'),
            t('order.retryPaymentConfirm'),
            [
                { text: t('order.noCancel'), style: 'cancel' },
                {
                    text: t('order.yes'),
                    onPress: async () => {
                        try {
                            dispatch(retryPayment(order.orderId)).unwrap();
                        } catch (error) {
                            Alert.alert(t('common.error'), error || t('order.retryPayment'));
                        }
                    },
                },
            ]
        );
    };

    // Handle cancel order
    const handleCancelOrder = (order) => {
        Alert.alert(
            t('order.cancelOrder'),
            `${t('order.cancelOrderConfirm')} (${order.id})`,
            [
                { text: t('order.noCancel'), style: 'cancel' },
                {
                    text: t('order.yesCancel'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setCancellingOrders(prev => new Set([...prev, order.orderId]));
                            await dispatch(cancelOrder(order.orderId)).unwrap();
                        } catch (error) {
                            Alert.alert(t('common.error'), error || t('order.cancelOrder'));
                        } finally {
                            setCancellingOrders(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(order.orderId);
                                return newSet;
                            });
                        }
                    }
                }
            ]
        );
    };

    const OrderItem = ({ order }) => {
        const isCancelling = cancellingOrders.has(order.orderId);
        const hasVoucher = !!(order.discountCode || (order.discountAmount != null && order.discountAmount > 0));

        return (
            <View style={styles.orderCard}>
                <View style={styles.cardRow}>
                    {/* Trái: Order ID + Order badge + Payment badge */}
                    <View style={styles.cardLeft}>
                        <Text style={styles.orderIdMono} numberOfLines={1}>{order.fullOrderId || order.id}</Text>
                        <View style={styles.badgeBlock}>
                            <Text style={styles.badgeLabel}>Order</Text>
                            <View style={[styles.statusBadge, { backgroundColor: order.statusBg }]}>
                                <Text style={[styles.statusBadgeText, { color: order.statusColor }]}>{t('order.' + order.statusKey)}</Text>
                            </View>
                        </View>
                        <View style={styles.badgeBlock}>
                            <Text style={styles.badgeLabel}>Payment</Text>
                            <View style={[styles.paymentBadge, { backgroundColor: order.paymentStatusBg }]}>
                                <Text style={[styles.paymentBadgeText, { color: order.paymentStatusColor }]}>{t('order.' + order.paymentStatusLabelKey)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Giữa: Ngày, Người nhận, Địa chỉ */}
                    <View style={styles.cardCenter}>
                        <View style={styles.infoRow}>
                            <MaterialIcons name="event" size={18} color="#6b7280" style={styles.infoIcon} />
                            <Text style={styles.infoText}>{order.fullDate || order.date}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialIcons name="person" size={18} color="#6b7280" style={styles.infoIcon} />
                            <Text style={styles.infoText} numberOfLines={1}>
                                {order.receiverName} <Text style={styles.infoMuted}>·</Text> {order.receiverPhone}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <MaterialIcons name="place" size={18} color="#6b7280" style={styles.infoIcon} />
                            <Text style={styles.infoText} numberOfLines={2}>{order.receiverAddress}</Text>
                        </View>
                        {order.paymentStatus === 'PENDING' && order.originalOrder?.payment_method === 'VNPAY' && (
                            <View style={styles.alertBox}>
                                <MaterialIcons name="info" size={20} color="#b91c1c" />
                                <Text style={styles.alertText}>{t('order.paymentAlertUnfinished')}</Text>
                            </View>
                        )}
                        {order.paymentStatus === 'FAILED' && (
                            <View style={styles.alertBox}>
                                <MaterialIcons name="warning" size={20} color="#b91c1c" />
                                <Text style={styles.alertText}>{t('order.paymentAlertFailed')}</Text>
                            </View>
                        )}
                    </View>

                    {/* Phải: Tổng, voucher, phương thức, nút */}
                    <View style={styles.cardRight}>
                        <View style={styles.rightSummary}>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalMain}>{formatCurrency(order.total)}</Text>
                                <Text style={styles.totalUnit}></Text>
                            </View>
                            {hasVoucher && (
                                <Text style={styles.voucherText}>
                                    {order.discountCode ? t('order.voucherWithCode', { code: order.discountCode, amount: formatCurrency(order.discountAmount) }) : t('order.discountAmount', { amount: formatCurrency(order.discountAmount) })}
                                </Text>
                            )}
                            <View style={styles.paymentMethodRow}>
                                <MaterialIcons name="credit-card" size={14} color="#6b7280" />
                                <Text style={styles.paymentMethodText}>{order.paymentMethod}</Text>
                            </View>
                        </View>
                        <View style={styles.rightActions}>
                            <TouchableOpacity
                                style={[styles.btnViewDetails, styles.actionBtnFirst]}
                                onPress={() => navigation.navigate('OrderDetails', {
                                    orderId: order.orderId,
                                    orderData: order.originalOrder,
                                    orderDataColor: order.statusColor,
                                    orderDataBg: order.statusBg
                                })}
                            >
                                <Text style={styles.btnViewDetailsText}>{t('order.viewDetails')}</Text>
                            </TouchableOpacity>
                            {canCancelOrder(order) && (
                                <TouchableOpacity
                                    style={[styles.btnCancel, styles.actionBtnNext, isCancelling && styles.disabledButton]}
                                    onPress={() => handleCancelOrder(order)}
                                    disabled={isCancelling}
                                >
                                    {isCancelling ? (
                                        <ActivityIndicator size="small" color="#dc2626" />
                                    ) : (
                                        <Text style={styles.btnCancelText}>{t('order.cancelOrder')}</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                            {order.paymentStatus === 'FAILED' && (
                                <TouchableOpacity
                                    style={[styles.btnRepay, styles.actionBtnNext]}
                                    onPress={() => handleRePaymentOrder(order)}
                                >
                                    <Text style={styles.btnRepayText}>{t('order.retryPayment')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    // Sinh danh sách số trang hiển thị (ví dụ: 1, 2, 3 hoặc 1 ... 4 5 6 ... 10)
    const getPageNumbers = () => {
        const total = totalPagesComputed;
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        const cur = currentPage;
        const pages = [];
        if (cur <= 4) {
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push('ellipsis');
            pages.push(total);
        } else if (cur >= total - 3) {
            pages.push(1);
            pages.push('ellipsis');
            for (let i = total - 4; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('ellipsis');
            for (let i = cur - 1; i <= cur + 1; i++) pages.push(i);
            pages.push('ellipsis');
            pages.push(total);
        }
        return pages;
    };

    const PaginationBar = () => {
        if (totalPagesComputed <= 1 && orders.length === 0) return null;
        const pages = getPageNumbers();
        return (
            <View style={styles.paginationBar}>
                <TouchableOpacity
                    style={[styles.pageBtn, styles.pagePrevNext, currentPage <= 1 && styles.pageBtnDisabled]}
                    onPress={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1 || orderLoading}
                >
                    <Text style={styles.pagePrevNextText}>{t('order.prev')}</Text>
                </TouchableOpacity>
                <View style={styles.pageNumbersRow}>
                    {pages.map((p, idx) =>
                        p === 'ellipsis' ? (
                            <Text key={`ellipsis-${idx}`} style={styles.pageEllipsis}>...</Text>
                        ) : (
                            <TouchableOpacity
                                key={p}
                                style={[
                                    styles.pageBtn,
                                    styles.pageNum,
                                    currentPage === p && styles.pageNumActive,
                                ]}
                                onPress={() => goToPage(p)}
                                disabled={orderLoading}
                            >
                                <Text style={[
                                    styles.pageNumText,
                                    currentPage === p && styles.pageNumTextActive,
                                ]}>{p}</Text>
                            </TouchableOpacity>
                        )
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.pageBtn, styles.pagePrevNext, (currentPage >= totalPagesComputed) && styles.pageBtnDisabled]}
                    onPress={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPagesComputed || orderLoading}
                >
                    <Text style={styles.pagePrevNextText}>{t('order.next')}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // Initial loading state
    if ((orderLoading && !orderData.length) || filterLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
                <LinearGradient
                    colors={COLORS.gradient.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t('order.title')}</Text>
                    </View>
                </LinearGradient>
                <InlineLoading text={t('order.loadingOrders')} style={styles.loadingContainer} />
                <BottomNavigation />
            </SafeAreaView>
        );
    }

    // Error state
    if (orderError && !orderData.length) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
                <LinearGradient
                    colors={COLORS.gradient.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t('order.title')}</Text>
                    </View>
                </LinearGradient>
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={64} color={COLORS.error} />
                    <Text style={styles.errorTitle}>{t('order.cannotLoadOrders')}</Text>
                    <Text style={styles.errorSubtitle}>{orderError}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => dispatch(fetchOrderByUser({
                            page: 1,
                            limit: LIMIT,
                            status_names: getCurrentStatusFilter(),
                            sortBy: 'createdAt',
                            sortOrder: 'desc',
                        }))}
                    >
                        <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                    </TouchableOpacity>
                </View>
                <BottomNavigation />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
            <LinearGradient
                colors={COLORS.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{t('order.title')}</Text>
                    </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 180 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterContainer}
                >
                    {FILTER_KEYS.map((filterKey) => (
                        <TouchableOpacity
                            key={filterKey}
                            style={[
                                styles.filterButton,
                                selectedFilter === filterKey && styles.selectedFilterButton,
                            ]}
                            onPress={() => handleFilterChange(filterKey)}
                        >
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    selectedFilter === filterKey && styles.selectedFilterButtonText,
                                ]}
                            >
                                {t('order.' + filterKey)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.ordersContainer}>
                    {orders.length > 0 ? (
                        <>
                            {orders.map((order) => (
                                <OrderItem key={order.id} order={order} />
                            ))}
                            {total > 0 && (
                                <View style={styles.paginationSummary}>
                                    <Text style={styles.paginationSummaryText}>
                                        {t('order.pageSummary', { total, page: currentPage, totalPages: totalPagesComputed })}
                                    </Text>
                                </View>
                            )}
                            <PaginationBar />
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="shopping-bag" size={64} color="#d1d5db" />
                            <Text style={styles.emptyStateTitle}>{t('order.noOrdersFound')}</Text>
                            <Text style={styles.emptyStateSubtitle}>
                                {selectedFilter === 'filterAll'
                                    ? t('order.noOrdersHint')
                                    : t('order.noOrdersFilterHint', { filter: t('order.' + selectedFilter) })
                                }
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
            <BottomNavigation />
        </SafeAreaView>
    );
};

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
        elevation: 5,
        shadowColor: COLORS.shadow.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.white,
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        marginTop: -20,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.text.secondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        backgroundColor: COLORS.background,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginTop: 16,
        marginBottom: 8,
    },
    errorSubtitle: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    filterContainer: {
        marginBottom: 16,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border.light,
        backgroundColor: COLORS.white,
    },
    selectedFilterButton: {
        backgroundColor: `${COLORS.primary}10`,
        borderColor: COLORS.primary,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.text.secondary,
    },
    selectedFilterButtonText: {
        color: COLORS.primary,
    },
    ordersContainer: {
        paddingBottom: 20,
    },
    orderCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    cardLeft: {
        width: 100,
        paddingVertical: 12,
        paddingLeft: 12,
        paddingRight: 8,
        borderRightWidth: 1,
        borderRightColor: '#f3f4f6',
        justifyContent: 'center',
    },
    orderIdMono: {
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        color: '#6b7280',
        marginBottom: 8,
    },
    badgeBlock: {
        marginBottom: 6,
    },
    badgeLabel: {
        fontSize: 10,
        color: '#9ca3af',
        marginBottom: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    paymentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    paymentBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cardCenter: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 12,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoIcon: {
        marginRight: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    infoMuted: {
        color: '#9ca3af',
    },
    alertBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
        gap: 8,
    },
    alertText: {
        flex: 1,
        fontSize: 12,
        color: '#b91c1c',
    },
    cardRight: {
        width: 120,
        paddingVertical: 12,
        paddingHorizontal: 10,
        backgroundColor: '#f9fafb',
        borderLeftWidth: 1,
        borderLeftColor: '#f3f4f6',
        justifyContent: 'space-between',
    },
    rightSummary: {
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    totalMain: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    totalUnit: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '400',
        marginLeft: 2,
    },
    voucherText: {
        fontSize: 10,
        color: '#059669',
        marginTop: 4,
        textAlign: 'right',
    },
    paymentMethodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
        gap: 4,
    },
    paymentMethodText: {
        fontSize: 11,
        color: '#6b7280',
    },
    rightActions: {
        marginTop: 8,
    },
    actionBtnFirst: {
        marginBottom: 6,
    },
    actionBtnNext: {
        marginTop: 6,
    },
    btnViewDetails: {
        backgroundColor: '#059669',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnViewDetailsText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    btnCancel: {
        borderWidth: 1,
        borderColor: '#fecaca',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnCancelText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#dc2626',
    },
    btnRepay: {
        borderWidth: 1,
        borderColor: '#86efac',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    btnRepayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#059669',
    },
    disabledButton: {
        opacity: 0.6,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
    loadingFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        marginTop: 10,
    },
    loadingFooterText: {
        fontSize: 14,
        color: COLORS.text.secondary,
        marginLeft: 8,
    },
    noMoreFooter: {
        alignItems: 'center',
        paddingVertical: 20,
        marginTop: 10,
    },
    noMoreText: {
        fontSize: 14,
        color: COLORS.text.secondary,
        marginBottom: 4,
    },
    totalOrdersText: {
        fontSize: 12,
        color: COLORS.text.secondary,
        fontStyle: 'italic',
    },
    paginationSummary: {
        alignItems: 'center',
        paddingVertical: 8,
        marginTop: 8,
    },
    paginationSummaryText: {
        fontSize: 13,
        color: COLORS.text.secondary,
    },
    paginationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        paddingVertical: 16,
        paddingHorizontal: 8,
        gap: 8,
    },
    pageBtn: {
        minWidth: 36,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pagePrevNext: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border.light,
    },
    pagePrevNextText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    pageBtnDisabled: {
        opacity: 0.5,
    },
    pageNumbersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    pageNum: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border.light,
    },
    pageNumActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    pageNumText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    pageNumTextActive: {
        color: COLORS.white,
    },
    pageEllipsis: {
        fontSize: 14,
        color: COLORS.text.secondary,
        paddingHorizontal: 4,
    },
});

export default OrderHistoryScreen;