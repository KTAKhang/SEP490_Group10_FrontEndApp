import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    StatusBar,
    Alert,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigation from '../components/BottomNavigation';
import { InlineLoading, FooterLoading } from '../components/Loading';
import { fetchOrderByUser, cancelOrder, clearOrderState, resetPagination } from '../store/slices/orderSlice';
import { formatCurrency } from '../utils/formatCurrency';

const OrderHistoryScreen = ({ navigation }) => {
    const [selectedFilter, setSelectedFilter] = useState('Tất cả đơn hàng');
    const [cancellingOrders, setCancellingOrders] = useState(new Set());
    const [refreshing, setRefreshing] = useState(false);
    const [filterLoading, setFilterLoading] = useState(false);

    const filters = ['Tất cả đơn hàng', 'Chờ xử lý', 'Đã xác nhận', 'Đang giao', 'Đã giao', 'Đã hủy', 'Đã trả'];

    // Map filter display names to API status values
    const filterToStatusMapping = {
        'Tất cả đơn hàng': '',
        'Chờ xử lý': 'PENDING',
        'Đã xác nhận': 'CONFIRMED',
        'Đang giao': 'SHIPPED',
        'Đã giao': 'DELIVERED',
        'Đã hủy': 'CANCELLED',
        'Đã trả': 'RETURNED'
    };

    const {
        orders: orderData,
        isLoading: orderLoading,
        isLoadingMore,
        error: orderError,
        cancelSuccess,
        cancelMessage,
        currentPage,
        hasMore,
        total
    } = useSelector((state) => state.order);

    const dispatch = useDispatch();

    // Get current status filter for API
    const getCurrentStatusFilter = () => {
        return filterToStatusMapping[selectedFilter] || '';
    };

    useEffect(() => {
        dispatch(fetchOrderByUser({
            page: 1,
            limit: 5,
            search: getCurrentStatusFilter()
        }));
    }, [dispatch]);

    // Sửa lại handleFilterChange function
    const handleFilterChange = useCallback(async (filter) => {
        setSelectedFilter(filter);
        setFilterLoading(true); // Bắt đầu loading

        const statusFilter = filterToStatusMapping[filter] || '';

        try {
            // Reset pagination và fetch với filter mới
            dispatch(resetPagination());
            await dispatch(fetchOrderByUser({
                page: 1,
                limit: 5,
                search: statusFilter
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
            Alert.alert('Thành công', cancelMessage);
            // Refresh current filter after successful cancel
            const statusFilter = getCurrentStatusFilter();
            dispatch(resetPagination());
            dispatch(fetchOrderByUser({
                page: 1,
                limit: 5,
                search: statusFilter
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
            limit: 5,
            search: statusFilter
        }));
        setRefreshing(false);
    }, [dispatch, selectedFilter]);

    // Load more handler
    const loadMoreOrders = useCallback(() => {
        if (!isLoadingMore && hasMore && !orderLoading) {
            const statusFilter = getCurrentStatusFilter();
            dispatch(fetchOrderByUser({
                page: currentPage + 1,
                limit: 5,
                search: statusFilter,
                isLoadMore: true
            }));
        }
    }, [dispatch, currentPage, hasMore, isLoadingMore, orderLoading, selectedFilter]);

    // Handle scroll
    const handleScroll = useCallback((event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 20;

        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMoreOrders();
        }
    }, [loadMoreOrders]);

    // Transform API data to match UI format
    const transformOrderData = (apiOrders) => {
        if (!apiOrders || !Array.isArray(apiOrders)) return [];

        return apiOrders.map((order, index) => {
            // Map order status names to display format
            const statusMapping = {
                'PENDING': 'Chờ xử lý',
                'CONFIRMED': 'Đã xác nhận',
                'SHIPPED': 'Đang giao',
                'DELIVERED': 'Đã giao',
                'CANCELLED': 'Đã hủy',
                'RETURNED': 'Đã trả'
            };

            // Map status to colors
            const statusColors = {
                'Chờ xử lý': { color: '#f59e0b', bg: '#fffbeb' },
                'Đã xác nhận': { color: '#8b5cf6', bg: '#f3e8ff' },
                'Đang giao': { color: '#3b82f6', bg: '#eff6ff' },
                'Đã giao': { color: '#10b981', bg: '#ecfdf5' },
                'Đã hủy': { color: '#6b7280', bg: '#f3f4f6' },
                'Đã trả': { color: '#ef4444', bg: '#fef2f2' }
            };

            const status = statusMapping[order.order_status?.name] || 'Chờ xử lý';
            const statusColor = statusColors[status] || statusColors['Chờ xử lý'];

            // Format date
            const formatDate = (dateString) => {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            };

            // Get first item for display
            const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;

            return {
                id: `#ORD-${order.order_id.slice(-4).toUpperCase()}`,
                orderId: order.order_id,
                date: formatDate(order.createdAt),
                items: order.items ? order.items.length : 1,
                total: order.total_price,
                status: status,
                statusColor: statusColor.color,
                statusBg: statusColor.bg,
                product: {
                    name: firstItem?.product_name || firstItem?.name || 'Sản phẩm',
                    details: `Người nhận: ${order.receiver_name}`,
                    price: firstItem?.price || order.total_price,
                    image: firstItem?.image || 'https://res.cloudinary.com/dkbsae4kc/image/upload/v1747706328/avatars/mfwbvrkvqcsv6kgze587.png',
                },
                originalOrder: order
            };
        });
    };

    const orders = transformOrderData(orderData);

    // Handle cancel order
    const handleCancelOrder = (order) => {
        Alert.alert(
            'Hủy đơn hàng',
            `Bạn có chắc chắn muốn hủy đơn hàng ${order.id} không?`,
            [
                {
                    text: 'Không',
                    style: 'cancel'
                },
                {
                    text: 'Có, Hủy đơn',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setCancellingOrders(prev => new Set([...prev, order.orderId]));
                            await dispatch(cancelOrder(order.orderId)).unwrap();
                        } catch (error) {
                            Alert.alert('Lỗi', error || 'Không thể hủy đơn hàng');
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

    const handleActionPress = (order) => {
        switch (order.status) {
            case 'Chờ xử lý':
                handleCancelOrder(order);
                break;
            case 'Đã giao':
                navigation.navigate('OrderDetails', {
                    orderData: order.originalOrder,
                    orderDataColor: order.statusColor,
                    orderDataBg: order.statusBg
                });
                break;
            default:
                navigation.navigate('OrderDetails', {
                    orderData: order.originalOrder,
                    orderDataColor: order.statusColor,
                    orderDataBg: order.statusBg
                });
                break;
        }
    };

    const OrderItem = ({ order }) => {
        const isCancelling = cancellingOrders.has(order.orderId);

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetails', {
                    orderData: order.originalOrder,
                    orderDataColor: order.statusColor,
                    orderDataBg: order.statusBg
                })}
            >
                <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderId}>{order.id}</Text>
                        <Text style={styles.orderDate}>{order.date}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: order.statusBg }]}>
                        <Text style={[styles.statusText, { color: order.statusColor }]}>
                            {order.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.productContainer}>
                    <Image source={{ uri: order.product.image }} style={styles.productImage} />
                    <View style={styles.productInfo}>
                        <Text style={styles.productName}>{order.product.name}</Text>
                        <Text style={styles.productDetails}>{order.product.details}</Text>
                        <View style={styles.productPricing}>
                            <Text style={styles.productPrice}>{formatCurrency(order.product.price)}</Text>
                            {order.items > 1 && (
                                <Text style={styles.itemCount}>+{order.items - 1} sản phẩm khác</Text>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.orderFooter}>
                    <View style={styles.orderTotal}>
                        <Text style={styles.totalLabel}>Tổng cộng: </Text>
                        <Text style={styles.totalAmount}>{formatCurrency(order.total)}</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            order.status === 'Chờ xử lý' && styles.cancelButton,
                            isCancelling && styles.disabledButton
                        ]}
                        onPress={() => handleActionPress(order)}
                        disabled={isCancelling}
                    >
                        {isCancelling ? (
                            <View style={styles.cancellingContainer}>
                                <ActivityIndicator size="small" color="white" />
                                <Text style={[styles.actionButtonText, { marginLeft: 8 }]}>
                                    Đang hủy...
                                </Text>
                            </View>
                        ) : (
                            <Text style={[
                                styles.actionButtonText,
                                order.status === 'Chờ xử lý' && styles.cancelButtonText
                            ]}>
                                {order.status === 'Đã giao' ? 'Đánh giá' :
                                    order.status === 'Chờ xử lý' ? 'Hủy đơn hàng' :
                                        order.status === 'Đã trả' ? 'Xem chi tiết' :
                                            'Xem chi tiết'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    // Loading footer component
    const LoadingFooter = () => {
        if (!isLoadingMore) return null;

        return <FooterLoading text="Đang tải thêm đơn hàng..." />;
    };

    // No more items footer
    const NoMoreFooter = () => {
        if (hasMore || orders.length === 0) return null;

        return (
            <View style={styles.noMoreFooter}>
                <Text style={styles.noMoreText}>Không còn đơn hàng nào để tải</Text>
                <Text style={styles.totalOrdersText}>Tổng cộng: {total} đơn hàng</Text>
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
                        <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
                    </View>
                </LinearGradient>
                <InlineLoading text="Đang tải đơn hàng..." style={styles.loadingContainer} />
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
                        <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
                    </View>
                </LinearGradient>
                <View style={styles.errorContainer}>
                    <Icon name="error-outline" size={64} color={COLORS.error} />
                    <Text style={styles.errorTitle}>Không thể tải đơn hàng</Text>
                    <Text style={styles.errorSubtitle}>{orderError}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => dispatch(fetchOrderByUser({
                            page: 1,
                            limit: 5,
                            search: getCurrentStatusFilter()
                        }))}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
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
                    <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 180 }]}
                onScroll={handleScroll}
                scrollEventThrottle={400}
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
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterButton,
                                selectedFilter === filter && styles.selectedFilterButton,
                            ]}
                            onPress={() => handleFilterChange(filter)}
                        >
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    selectedFilter === filter && styles.selectedFilterButtonText,
                                ]}
                            >
                                {filter}
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
                            <LoadingFooter />
                            <NoMoreFooter />
                        </>
                    ) : (
                        <View style={styles.emptyState}>
                            <Icon name="shopping-bag" size={64} color="#d1d5db" />
                            <Text style={styles.emptyStateTitle}>Không tìm thấy đơn hàng</Text>
                            <Text style={styles.emptyStateSubtitle}>
                                {selectedFilter === 'Tất cả đơn hàng'
                                    ? "Bạn chưa đặt đơn hàng nào"
                                    : `Không có đơn hàng nào có trạng thái "${selectedFilter}"`
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
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: COLORS.shadow.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orderInfo: {
        flex: 1,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 14,
        color: '#6b7280',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    productContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    productImage: {
        width: 64,
        height: 64,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        marginRight: 12,
    },
    productInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 4,
    },
    productDetails: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    productPricing: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginRight: 8,
    },
    itemCount: {
        fontSize: 14,
        color: '#6b7280',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    orderTotal: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        color: '#6b7280',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    actionButton: {
        backgroundColor: '#13c2c2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    cancelButton: {
        backgroundColor: '#ef4444',
    },
    disabledButton: {
        opacity: 0.6,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    cancelButtonText: {
        color: 'white',
    },
    cancellingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
});

export default OrderHistoryScreen;