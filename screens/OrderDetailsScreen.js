import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
    clearReviewState,
    getReviewsByOrderId
} from '../store/slices/reviewSlice';
import {
    clearOrderState,
    fetchOrderDetailByUser,
    clearOrderDetail,
} from '../store/slices/orderSlice';
import { formatCurrency } from '../utils/formatCurrency';

const DEFAULT_PRODUCT_IMAGE = 'https://via.placeholder.com/100?text=SP';

function getItemImage(item) {
    if (!item) return DEFAULT_PRODUCT_IMAGE;
    const uri = item.product_image ?? item.image
        ?? item.product_id?.images?.[0]
        ?? item.product_id?.featuredImage
        ?? item.product_id?.image;
    return (uri && typeof uri === 'string') ? uri : DEFAULT_PRODUCT_IMAGE;
}

const OrderDetailsScreen = ({ navigation }) => {
    const route = useRoute();
    const { orderId: paramOrderId, orderData: paramOrderData, orderDataColor, orderDataBg } = route.params || {};
    const dispatch = useDispatch();
    const reviewState = useSelector((state) => state.review);
    const { isLoading, error: reviewError, successMessage, review } = reviewState;

    const orderState = useSelector((state) => state.order);
    const {
        orderDetail,
        detailLoading,
        detailError,
        isLoading: orderLoading,
        error: orderError
    } = orderState;

    const orderIdRaw = paramOrderId ?? paramOrderData?._id ?? paramOrderData?.order_id;
    const orderId = orderIdRaw != null
        ? (typeof orderIdRaw === 'string' ? orderIdRaw : (orderIdRaw.toString?.() || String(orderIdRaw)))
        : null;
    const orderData = orderDetail?.order ?? paramOrderData;
    const orderItems = orderDetail?.details ?? orderData?.details ?? orderData?.items ?? orderData?.order_details ?? orderData?.orderDetails ?? [];

    const alertShownRef = useRef(false);

    const statusMapping = {
        'PENDING': 'Chờ xử lý',
        'PAID': 'Đã thanh toán',
        'READY-TO-SHIP': 'Đã xác nhận',
        'SHIPPING': 'Đang giao',
        'COMPLETED': 'Đã giao',
        'CANCELLED': 'Đã hủy',
        'REFUND': 'Đã trả'
    };
    const statusName = (orderData?.order_status?.name ?? orderData?.order_status_id?.name ?? '')
        .toString().trim().toUpperCase().replace(/\s+/g, '-');
    const resolvedStatusLabel = statusMapping[statusName] || statusMapping[orderData?.order_status?.name] || 'Chờ xử lý';

    const [orderStatus, setOrderStatus] = useState(resolvedStatusLabel);
    const [isRefetchingReviews, setIsRefetchingReviews] = useState(false);

    const initialReviews = {};
    const initialSubmittedReviews = {};
    const initialExistingReviews = {};

    orderItems.forEach((item) => {
        const pid = item.product_id ?? item.product_id?._id ?? item.product?._id;
        const pidStr = pid ? (typeof pid === 'string' ? pid : pid.toString?.() ?? pid) : null;
        if (pidStr) {
            initialReviews[pidStr] = '';
            initialExistingReviews[pidStr] = null;
            initialSubmittedReviews[pidStr] = false;
        }
    });

    const [reviews, setReviews] = useState(initialReviews);
    const [submittedReviews, setSubmittedReviews] = useState(initialSubmittedReviews);
    const [existingReviews, setExistingReviews] = useState(initialExistingReviews);

    useEffect(() => {
        if (!orderId) return;
        dispatch(clearOrderDetail());
        dispatch(fetchOrderDetailByUser(orderId));
        return () => dispatch(clearOrderDetail());
    }, [dispatch, orderId]);

    useEffect(() => {
        if (orderData && statusName) {
            setOrderStatus(statusMapping[statusName] || statusMapping[orderData?.order_status?.name] || 'Chờ xử lý');
        }
    }, [orderData, statusName]);

    useEffect(() => {
        if (!orderId) return;
        const fetchReviews = async () => {
            setIsRefetchingReviews(true);
            try {
                await dispatch(getReviewsByOrderId(orderId));
            } finally {
                setIsRefetchingReviews(false);
            }
        };
        fetchReviews();
    }, [dispatch, orderId]);

    useFocusEffect(
        React.useCallback(() => {
            if (!orderId) return;
            dispatch(getReviewsByOrderId(orderId));
        }, [dispatch, orderId])
    );

    useEffect(() => {
        if (!Array.isArray(review)) return;
        const items = orderDetail?.details ?? orderData?.details ?? orderData?.items ?? [];
        const newReviews = {};
        const newSubmittedReviews = {};
        const newExistingReviews = {};

        items.forEach((item) => {
            const productId = item.product_id ?? item.product_id?._id ?? item.product?._id;
            const pidStr = productId != null ? String(productId) : null;
            if (!pidStr) return;
            const existingReview = review.find(
                (r) => (r.product_id ?? r.product?._id) != null && String(r.product_id ?? r.product?._id) === pidStr
            ) || review.find((r) => r.product && String(r.product._id) === pidStr);

            newReviews[pidStr] = existingReview?.content ?? existingReview?.comment ?? '';
            newSubmittedReviews[pidStr] = !!existingReview;
            newExistingReviews[pidStr] = existingReview || null;
        });

        setReviews(newReviews);
        setSubmittedReviews(newSubmittedReviews);
        setExistingReviews(newExistingReviews);
    }, [review]);

    useEffect(() => {
        if (successMessage && !isLoading && !reviewError && !alertShownRef.current) {
            alertShownRef.current = true;
            Alert.alert(
                'Thành công',
                'Đánh giá đã được gửi thành công!',
                [{
                    text: 'OK',
                    onPress: async () => {
                        dispatch(clearReviewState());
                        alertShownRef.current = false;
                        setIsRefetchingReviews(true);
                        try {
                            await dispatch(getReviewsByOrderId(orderId));
                        } finally {
                            setIsRefetchingReviews(false);
                        }
                    }
                }]
            );
        }
        if (reviewError && !isLoading && !alertShownRef.current) {
            alertShownRef.current = true;
            Alert.alert('Lỗi', reviewError, [{
                text: 'OK',
                onPress: () => {
                    dispatch(clearReviewState());
                    alertShownRef.current = false;
                }
            }]);
        }
        if (!successMessage && !reviewError) {
            alertShownRef.current = false;
        }
    }, [successMessage, reviewError, isLoading, dispatch, orderId]);

    useEffect(() => {
        if (orderError) {
            Alert.alert('Lỗi', orderError, [{
                text: 'OK',
                onPress: () => dispatch(clearOrderState())
            }]);
        }
    }, [orderError, dispatch]);

    const canShowEditReview = (rev) => {
        if (!rev) return false;
        const editedCount = rev.editedCount ?? rev.edited_count ?? 0;
        if (editedCount >= 1) return false;
        const createdAt = rev.createdAt ?? rev.created_at;
        if (!createdAt) return true;
        const created = new Date(createdAt);
        const diffDays = Math.floor((new Date() - created) / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
    };

    const renderRatingSection = (productId) => {
        if (orderStatus !== 'Đã giao') return null;

        const hasReviewed = submittedReviews[productId];
        const existingRev = existingReviews[productId];
        const showEditButton = hasReviewed && existingRev?._id && canShowEditReview(existingRev);
        const accentColor = orderDataColor || '#1CD4D4';

        if (isRefetchingReviews) {
            return (
                <View style={styles.ratingSection}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={accentColor} />
                        <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.ratingSection}>
                {reviewError ? (
                    <View style={styles.reviewErrorBox}>
                        <Text style={styles.reviewErrorText}>{reviewError}</Text>
                        <TouchableOpacity
                            style={[styles.retryReviewBtn, { borderColor: accentColor }]}
                            onPress={() => dispatch(getReviewsByOrderId(orderData._id ?? orderData.order_id))}
                        >
                            <Icon name="refresh" size={16} color={accentColor} />
                            <Text style={[styles.retryReviewBtnText, { color: accentColor }]}>Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
                <Text style={styles.ratingTitle}>
                    {hasReviewed ? 'Đánh giá của bạn' : 'Đánh giá sản phẩm này'}
                </Text>

                {hasReviewed ? (
                    <View style={styles.reviewedContainer}>
                        <View style={styles.existingReviewContent}>
                            <Text style={styles.existingReviewText}>"{reviews[productId]}"</Text>
                        </View>
                        <View style={styles.reviewActions}>
                            <View style={styles.submittedIndicator}>
                                <Icon name="check-circle" size={16} color="#22C55E" />
                                <Text style={styles.submittedText}>Đã đánh giá</Text>
                            </View>
                            {showEditButton ? (
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => {
                                        const rev = existingReviews[productId];
                                        if (rev?._id) {
                                            navigation.navigate('EditReview', {
                                                reviewId: rev._id,
                                                review: {
                                                    ...rev,
                                                    comment: rev.comment ?? rev.content,
                                                    editedCount: rev.editedCount ?? rev.edited_count,
                                                    createdAt: rev.createdAt ?? rev.created_at,
                                                    imagePublicIds: rev.imagePublicIds ?? rev.image_public_ids,
                                                    images: rev.images ?? rev.image_urls ?? [],
                                                },
                                            });
                                        }
                                    }}
                                    disabled={isRefetchingReviews}
                                >
                                    <Icon name="edit" size={16} color={accentColor} />
                                    <Text style={[styles.editButtonText, { color: accentColor }]}>Chỉnh sửa</Text>
                                </TouchableOpacity>
                            ) : (
                                hasReviewed && existingRev && (
                                    <Text style={styles.editExpiredText}>
                                        {((existingRev.editedCount ?? existingRev.edited_count) >= 1)
                                            ? 'Đã hết lượt chỉnh sửa'
                                            : 'Đã hết hạn chỉnh sửa (3 ngày)'}
                                    </Text>
                                )
                            )}
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.openReviewScreenBtn, { borderColor: accentColor }]}
                        onPress={() => {
                            const item = orderItems.find(i => (i.product_id ?? i.product_id?._id)?.toString?.() === productId?.toString?.());
                            navigation.navigate('CreateReview', {
                                orderId: orderData._id ?? orderData.order_id,
                                productId,
                                productName: item?.product_name ?? item?.name ?? 'Sản phẩm',
                            });
                        }}
                    >
                        <Icon name="add-a-photo" size={18} color={accentColor} />
                        <Text style={[styles.openReviewScreenBtnText, { color: accentColor }]}>
                            Mở màn hình đánh giá (có thể đính kèm ảnh)
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const calculateSubtotal = () => {
        const fromApi = orderData?.subtotal_products ?? orderData?.subtotalProducts;
        if (fromApi != null && Number(fromApi) >= 0) return Number(fromApi);
        return orderItems.reduce((total, item) => total + (item.subtotal ?? item.price * (item.quantity || 0)), 0) || 0;
    };

    const accentColor = orderDataColor || '#1CD4D4';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} translucent />

            <LinearGradient
                colors={COLORS.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Icon name="arrow-back" size={24} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Một overlay loading chung: chi tiết đơn hàng hoặc đánh giá */}
            {(detailLoading || isRefetchingReviews) && (
                <View style={styles.globalLoadingOverlay}>
                    <View style={styles.globalLoadingContainer}>
                        <ActivityIndicator size="large" color={accentColor} />
                        <Text style={styles.globalLoadingText}>
                            {detailLoading ? 'Đang tải chi tiết đơn hàng...' : 'Đang cập nhật đánh giá...'}
                        </Text>
                    </View>
                </View>
            )}

            {orderId && detailError && !detailLoading ? (
                <View style={styles.detailErrorContainer}>
                    <Text style={styles.detailErrorText}>{detailError}</Text>
                    <TouchableOpacity
                        style={styles.retryDetailButton}
                        onPress={() => orderId && dispatch(fetchOrderDetailByUser(orderId))}
                    >
                        <Icon name="refresh" size={20} color="#fff" />
                        <Text style={styles.retryDetailButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : !detailLoading ? (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.orderInfo}>
                        <View style={styles.orderHeader}>
                            <View>
                                <Text style={styles.orderNumber}>{`#ORD-${(orderData?.order_id ?? orderData?._id ?? '')?.toString().slice(-8).toUpperCase()}`}</Text>
                                <Text style={styles.orderDate}>{formatDate(orderData?.createdAt)}</Text>
                            </View>
                            <View style={[
                                styles.statusBadge,
                                orderStatus === 'Đã giao' && styles.deliveredBadge,
                                { backgroundColor: orderDataBg || 'rgba(255, 184, 0, 0.1)' }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    orderStatus === 'Đã giao' && styles.deliveredText,
                                    { color: orderDataColor || '#FFB800' }
                                ]}>
                                    {orderStatus}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.addressContainer}>
                            <Text style={styles.addressTitle}>Địa chỉ giao hàng</Text>
                            <Text style={styles.customerName}>{orderData?.receiver_name}</Text>
                            <Text style={styles.address}>
                                {orderData?.receiver_address}{'\n'}
                                Điện thoại: {orderData?.receiver_phone}
                            </Text>
                        </View>

                        <View style={styles.productsContainer}>
                            <Text style={styles.productsSectionTitle}>Sản phẩm</Text>
                            {orderItems.length === 0 && orderData ? (
                                <View style={styles.emptyProductsContainer}>
                                    <Icon name="inventory-2" size={48} color="#9CA3AF" />
                                    <Text style={styles.emptyProductsText}>Chưa tải được danh sách sản phẩm</Text>
                                    <TouchableOpacity
                                        style={[styles.retryDetailButton, { alignSelf: 'center', marginTop: 12 }]}
                                        onPress={() => orderId && dispatch(fetchOrderDetailByUser(orderId))}
                                    >
                                        <Icon name="refresh" size={20} color="#fff" />
                                        <Text style={styles.retryDetailButtonText}>Thử lại</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                orderItems.map((item, index) => {
                                    const pid = item.product_id ?? item.product_id?._id ?? item.product?._id;
                                    const pidStr = typeof pid === 'string' ? pid : pid?.toString?.() ?? '';
                                    return (
                                        <View key={pidStr || index} style={styles.productCard}>
                                            <View style={styles.productInfo}>
                                                <Image source={{ uri: getItemImage(item) }} style={styles.productImage} />
                                                <View style={styles.productDetails}>
                                                    <Text style={styles.productName} numberOfLines={2}>{item.product_name ?? item.name ?? 'Sản phẩm'}</Text>
                                                    {(item.product_category_name ?? item.product_category) && (
                                                        <Text style={styles.productVariant}>{item.product_category_name ?? item.product_category}</Text>
                                                    )}
                                                    <Text style={styles.productVariant}>SL: {item.quantity ?? 0}</Text>
                                                    <View style={styles.priceRow}>
                                                        <View style={styles.priceRowLeft}>
                                                            {item.original_price != null && Number(item.original_price) > Number(item.price ?? 0) && (
                                                                <>
                                                                    <Text style={styles.originalPrice} numberOfLines={1}>{formatCurrency(item.original_price)} </Text>
                                                                    <View style={styles.discountBadge}>
                                                                        <Text style={styles.discountBadgeText}>Giảm giá</Text>
                                                                    </View>
                                                                </>
                                                            )}
                                                            <Text style={[styles.price, item.original_price != null && Number(item.original_price) > Number(item.price ?? 0) && styles.priceDiscounted]} numberOfLines={1}>
                                                                {formatCurrency(item.price)}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.quantity}>× {item.quantity ?? 0}</Text>
                                                    </View>
                                                    <Text style={[styles.subtotal, { color: orderDataColor || '#22C55E' }]}>
                                                        Tạm tính: {formatCurrency(item.subtotal ?? (item.price * (item.quantity || 0)))}
                                                    </Text>
                                                </View>
                                            </View>
                                            {renderRatingSection(pidStr || pid)}
                                        </View>
                                    );
                                })
                            )}
                        </View>

                        {(orderData?.discount_code || (orderData?.discount_amount != null && Number(orderData.discount_amount) > 0)) && (
                            <View style={styles.voucherContainer}>
                                <Icon name="local-offer" size={20} color={COLORS.primary} />
                                <View style={styles.voucherTextWrap}>
                                    <Text style={styles.voucherLabel}>Đã dùng voucher</Text>
                                    <Text style={styles.voucherValue}>
                                        {orderData.discount_code ? `${orderData.discount_code}, giảm ${formatCurrency(orderData.discount_amount ?? 0)} ` : `Giảm ${formatCurrency(orderData.discount_amount ?? 0)} `}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.summaryContainer}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Tạm tính (sản phẩm)</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(calculateSubtotal())} </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(orderData?.shipping_fee ?? 0)} </Text>
                            </View>
                            {(orderData?.discount_code || (orderData?.discount_amount != null && Number(orderData.discount_amount) > 0)) && (
                                <>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Tổng trước voucher</Text>
                                        <Text style={styles.summaryValue}>{formatCurrency((orderData?.total_price ?? 0) + (orderData?.discount_amount ?? 0))} </Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Đã dùng voucher{orderData.discount_code ? `: ${orderData.discount_code}, giảm` : ', giảm'}</Text>
                                        <Text style={styles.discountValue}>-{formatCurrency(orderData.discount_amount ?? 0)} </Text>
                                    </View>
                                </>
                            )}
                            <View style={[styles.summaryRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Tổng cộng</Text>
                                <Text style={styles.totalValue}>{formatCurrency(orderData?.total_price ?? 0)} </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            ) : null}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    headerGradient: {
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10,
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '500', color: '#FFFFFF' },
    headerSpacer: { width: 40 },
    content: { flex: 1 },
    orderInfo: { padding: 16 },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    orderNumber: { fontSize: 20, fontWeight: 'bold', color: '#000' },
    orderDate: { fontSize: 14, color: '#6B7280', marginTop: 2 },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: 'rgba(255, 184, 0, 0.1)',
        borderRadius: 20,
    },
    deliveredBadge: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
    statusText: { fontSize: 14, fontWeight: '500', color: '#FFB800' },
    deliveredText: { color: '#22C55E' },
    addressContainer: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 16, marginBottom: 24 },
    addressTitle: { fontSize: 16, fontWeight: '500', color: '#000', marginBottom: 8 },
    customerName: { fontSize: 16, color: '#4B5563', marginBottom: 4 },
    address: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
    productsContainer: { marginBottom: 24 },
    productsSectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
    emptyProductsContainer: {
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    emptyProductsText: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
    productCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },
    productInfo: { flexDirection: 'row', flexWrap: 'wrap' },
    productImage: { width: 80, height: 80, borderRadius: 8, marginRight: 16 },
    productDetails: { flex: 1, minWidth: 0 },
    productName: { fontSize: 16, fontWeight: '500', color: '#000', marginBottom: 4 },
    productVariant: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    priceRowLeft: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    price: { fontSize: 16, fontWeight: '500', color: '#000', flexShrink: 0 },
    originalPrice: { fontSize: 14, color: '#9CA3AF', textDecorationLine: 'line-through' },
    discountBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    discountBadgeText: { fontSize: 11, color: '#B45309', fontWeight: '600' },
    priceDiscounted: { color: '#16A34A' },
    quantity: { fontSize: 14, color: '#6B7280', flexShrink: 0 },
    subtotal: { fontSize: 14, fontWeight: '500', color: '#22C55E' },
    ratingSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    ratingTitle: { fontSize: 14, fontWeight: '500', color: '#000', marginBottom: 8 },
    openReviewScreenBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 2,
        marginBottom: 12,
    },
    openReviewScreenBtnText: { fontSize: 13, fontWeight: '600' },
    reviewedContainer: {
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    existingReviewContent: { marginBottom: 12 },
    existingReviewText: { fontSize: 14, color: '#374151', fontStyle: 'italic', lineHeight: 20 },
    reviewActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    submittedIndicator: { flexDirection: 'row', alignItems: 'center' },
    submittedText: { color: '#22C55E', fontSize: 12, fontWeight: '500', marginLeft: 4 },
    editButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
    editButtonText: { fontSize: 12, fontWeight: '500', marginLeft: 4 },
    editExpiredText: { fontSize: 12, color: COLORS.text.light, fontStyle: 'italic', marginLeft: 8 },
    reviewErrorBox: {
        marginBottom: 12,
        padding: 10,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#ef4444',
    },
    reviewErrorText: { fontSize: 13, color: '#B91C1C', marginBottom: 8 },
    retryReviewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    retryReviewBtnText: { fontSize: 13, fontWeight: '600' },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    loadingText: { fontSize: 14, color: '#6B7280' },
    globalLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    globalLoadingContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    globalLoadingText: { fontSize: 16, color: '#374151', fontWeight: '500' },
    detailErrorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 16,
    },
    detailErrorText: { fontSize: 15, color: '#B91C1C', textAlign: 'center' },
    retryDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryDetailButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },
    voucherContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    voucherTextWrap: { marginLeft: 10, flex: 1 },
    voucherLabel: { fontSize: 14, color: '#166534', fontWeight: '600' },
    voucherValue: { fontSize: 14, color: '#15803D', marginTop: 2 },
    summaryContainer: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { fontSize: 16, color: '#4B5563' },
    summaryValue: { fontSize: 16, color: '#000' },
    discountValue: { fontSize: 16, color: '#16A34A', fontWeight: '500' },
    totalRow: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginBottom: 0 },
    totalLabel: { fontSize: 16, fontWeight: '500', color: '#000' },
    totalValue: { fontSize: 16, fontWeight: '500', color: '#000' },
});

export default OrderDetailsScreen;
