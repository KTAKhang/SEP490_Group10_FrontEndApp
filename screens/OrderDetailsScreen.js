import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
    createReview,
    updateReview,
    clearReviewState,
    getReviewsByOrderId
} from '../store/slices/reviewSlice';
import {
    cancelOrder,
    returnOrder,
    clearOrderState
} from '../store/slices/orderSlice';
import { formatCurrency } from '../utils/formatCurrency';

const OrderDetailsScreen = ({ navigation }) => {
    const route = useRoute();
    const { orderData, orderDataColor, orderDataBg } = route.params;

    const dispatch = useDispatch();
    const reviewState = useSelector((state) => state.review);
    const { isLoading, error, successMessage, review } = reviewState;

    const orderState = useSelector((state) => state.order);
    const {
        isLoading: orderLoading,
        cancelSuccess,
        cancelMessage,
        returnSuccess,
        returnMessage,
        error: orderError
    } = orderState;

    const alertShownRef = useRef(false); // Dùng useRef để tránh lặp alert

    // Map order status names to display format
    const statusMapping = {
        'PENDING': 'Chờ xử lý',
        'CONFIRMED': 'Đã xác nhận',
        'SHIPPED': 'Đang giao',
        'DELIVERED': 'Đã giao',
        'CANCELLED': 'Đã hủy',
        'RETURNED': 'Đã trả'
    };

    const [orderStatus, setOrderStatus] = useState(
        statusMapping[orderData?.order_status?.name] || 'Chờ xử lý'
    );
    const [isRefetchingReviews, setIsRefetchingReviews] = useState(false);

    const initialRatings = {};
    const initialReviews = {};
    const initialSubmittedReviews = {};
    const initialExistingReviews = {};

    orderData?.items?.forEach((item) => {
        initialRatings[item.product_id] = 0;
        initialReviews[item.product_id] = '';
        initialExistingReviews[item.product_id] = null;
        initialSubmittedReviews[item.product_id] = false;
    });

    const [ratings, setRatings] = useState(initialRatings);
    const [reviews, setReviews] = useState(initialReviews);
    const [submittedReviews, setSubmittedReviews] = useState(initialSubmittedReviews);
    const [existingReviews, setExistingReviews] = useState(initialExistingReviews);
    const [editingReviews, setEditingReviews] = useState({});

    useEffect(() => {
        const fetchReviews = async () => {
            setIsRefetchingReviews(true);
            try {
                await dispatch(getReviewsByOrderId(orderData.order_id));
            } finally {
                setIsRefetchingReviews(false);
            }
        };
        fetchReviews();
    }, [dispatch]);

    useEffect(() => {
        if (Array.isArray(review)) {
            const newRatings = {};
            const newReviews = {};
            const newSubmittedReviews = {};
            const newExistingReviews = {};

            orderData?.items?.forEach((item) => {
                const productId = item.product_id;
                const existingReview = review.find(r => r.product && r.product._id === productId);

                newRatings[productId] = existingReview?.rating || 0;
                newReviews[productId] = existingReview?.content || '';
                newSubmittedReviews[productId] = !!existingReview;
                newExistingReviews[productId] = existingReview || null;
            });

            setRatings(newRatings);
            setReviews(newReviews);
            setSubmittedReviews(newSubmittedReviews);
            setExistingReviews(newExistingReviews);
        }
    }, [review, orderData?.items]);

    useEffect(() => {
        if (successMessage && !isLoading && !error && !alertShownRef.current) {
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
                            await dispatch(getReviewsByOrderId(orderData.order_id));
                        } finally {
                            setIsRefetchingReviews(false);
                        }
                    }
                }]
            );
        }

        if (error && !isLoading && !alertShownRef.current) {
            alertShownRef.current = true;

            Alert.alert(
                'Lỗi',
                error,
                [{
                    text: 'OK',
                    onPress: () => {
                        dispatch(clearReviewState());
                        alertShownRef.current = false;
                    }
                }]
            );
        }

        if (!successMessage && !error) {
            alertShownRef.current = false;
        }
    }, [successMessage, error, isLoading, dispatch, orderData.order_id]);

    // Handle order actions success/error
    useEffect(() => {
        if (cancelSuccess && cancelMessage) {
            Alert.alert(
                'Thành công',
                cancelMessage,
                [{
                    text: 'OK',
                    onPress: () => {
                        dispatch(clearOrderState());
                        setOrderStatus('Đã hủy');
                        navigation.goBack();
                    }
                }]
            );
        }

        if (returnSuccess && returnMessage) {
            Alert.alert(
                'Thành công',
                returnMessage,
                [{
                    text: 'OK',
                    onPress: () => {
                        dispatch(clearOrderState());
                        setOrderStatus('Đã trả');
                        navigation.goBack();
                    }
                }]
            );
        }

        if (orderError) {
            Alert.alert(
                'Lỗi',
                orderError,
                [{
                    text: 'OK',
                    onPress: () => dispatch(clearOrderState())
                }]
            );
        }
    }, [cancelSuccess, cancelMessage, returnSuccess, returnMessage, orderError, dispatch, navigation]);

    // Handle cancel order
    const handleCancelOrder = () => {
        Alert.alert(
            'Hủy đơn hàng',
            'Bạn có chắc chắn muốn hủy đơn hàng này không?',
            [
                {
                    text: 'Không',
                    style: 'cancel'
                },
                {
                    text: 'Có, Hủy đơn',
                    style: 'destructive',
                    onPress: () => {
                        dispatch(cancelOrder(orderData.order_id));
                    }
                }
            ]
        );
    };

    // Handle return order
    const handleReturnOrder = () => {
        Alert.alert(
            'Trả hàng',
            'Bạn có chắc chắn muốn trả hàng cho đơn hàng này không?',
            [
                {
                    text: 'Không',
                    style: 'cancel'
                },
                {
                    text: 'Có, Trả hàng',
                    style: 'destructive',
                    onPress: () => {
                        dispatch(returnOrder(orderData.order_id));
                    }
                }
            ]
        );
    };

    const handleStarPress = (productId, starIndex) => {
        const hasReviewed = submittedReviews[productId];
        const isEditing = editingReviews[productId];

        // Allow rating changes if order is delivered and either:
        // 1. No review exists yet, or
        // 2. Review exists but is in edit mode
        if (orderStatus === 'Đã giao' && (!hasReviewed || isEditing)) {
            setRatings(prev => ({
                ...prev,
                [productId]: starIndex + 1,
            }));
        }
    };

    const handleEditReview = (productId) => {
        setEditingReviews(prev => ({
            ...prev,
            [productId]: true,
        }));
    };

    const handleCancelEdit = (productId) => {
        // Reset to original values
        const existingReview = existingReviews[productId];
        if (existingReview) {
            setRatings(prev => ({
                ...prev,
                [productId]: existingReview.rating,
            }));
            setReviews(prev => ({
                ...prev,
                [productId]: existingReview.content,
            }));
        }

        setEditingReviews(prev => ({
            ...prev,
            [productId]: false,
        }));
    };

    const handleSubmitReview = async (productId) => {
        const rating = ratings[productId];
        const reviewContent = reviews[productId].trim();

        // Validation
        if (rating === 0) {
            Alert.alert('Lỗi', 'Vui lòng chọn mức đánh giá');
            return;
        }

        if (!reviewContent) {
            Alert.alert('Lỗi', 'Vui lòng viết đánh giá');
            return;
        }

        // Find the item to get order_details_id and existing review info
        const item = orderData?.items?.find(item => item.product_id === productId);
        if (!item) {
            Alert.alert('Lỗi', 'Không tìm thấy sản phẩm');
            return;
        }

        const existingReview = existingReviews[productId];
        const isEditing = editingReviews[productId];

        try {
            let result;

            if (existingReview && isEditing) {
                // Update existing review using the _id from the review object
                result = await dispatch(updateReview({
                    review_id: existingReview._id,
                    rating: rating,
                    review_content: reviewContent,
                }));
            } else {
                // Create new review
                if (!item.order_details_id) {
                    Alert.alert('Lỗi', 'Không tìm thấy ID chi tiết đơn hàng');
                    return;
                }

                result = await dispatch(createReview({
                    product_id: productId,
                    order_detail_id: item.order_details_id,
                    rating: rating,
                    review_content: reviewContent,
                }));
            }

            // If successful, refresh the review data from server
            if (createReview.fulfilled.match(result) || updateReview.fulfilled.match(result)) {
                // Exit edit mode immediately
                setEditingReviews(prev => ({
                    ...prev,
                    [productId]: false,
                }));

                // Note: Success message will be handled by the useEffect above
                // No need to manually refresh here since it's handled in the alert callback
            }
        } catch (error) {
            console.error('Submit review error:', error);
        }
    };

    const renderStars = (productId) => {
        const currentRating = ratings[productId];
        const hasReviewed = submittedReviews[productId];
        const isEditing = editingReviews[productId];

        return (
            <View style={styles.starsContainer}>
                {[...Array(5)].map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handleStarPress(productId, index)}
                        disabled={orderStatus !== 'Đã giao' || (hasReviewed && !isEditing) || isRefetchingReviews}
                    >
                        <Icon
                            name={index < currentRating ? 'star' : 'star-border'}
                            size={24}
                            color={index < currentRating ? (orderDataColor || '#FFB800') : '#D1D5DB'}
                            style={[
                                styles.star,
                                (orderStatus !== 'Đã giao' || (hasReviewed && !isEditing) || isRefetchingReviews) && styles.disabledStar
                            ]}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderRatingSection = (productId) => {
        if (orderStatus !== 'Đã giao') return null;

        const hasReviewed = submittedReviews[productId];
        const isEditing = editingReviews[productId];

        // Show loading state when refetching reviews
        if (isRefetchingReviews) {
            return (
                <View style={styles.ratingSection}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={orderDataColor || '#1CD4D4'} />
                        <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.ratingSection}>
                <Text style={styles.ratingTitle}>
                    {hasReviewed && !isEditing ? 'Đánh giá của bạn' :
                        hasReviewed && isEditing ? 'Chỉnh sửa đánh giá' :
                            'Đánh giá sản phẩm này'}
                </Text>
                {renderStars(productId)}

                {hasReviewed && !isEditing ? (
                    // Display existing review with edit option
                    <View style={styles.reviewedContainer}>
                        <View style={styles.existingReviewContent}>
                            <Text style={styles.existingReviewText}>
                                "{reviews[productId]}"
                            </Text>
                        </View>
                        <View style={styles.reviewActions}>
                            <View style={styles.submittedIndicator}>
                                <Icon name="check-circle" size={16} color="#22C55E" />
                                <Text style={styles.submittedText}>Đã đánh giá</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => handleEditReview(productId)}
                                disabled={isRefetchingReviews}
                            >
                                <Icon name="edit" size={16} color={orderDataColor || '#1CD4D4'} />
                                <Text style={[styles.editButtonText, { color: orderDataColor || '#1CD4D4' }]}>
                                    Chỉnh sửa
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    // Show form for new review or editing existing review
                    <>
                        <TextInput
                            style={[
                                styles.reviewInput,
                                { borderColor: orderDataColor || '#D1D5DB' }
                            ]}
                            placeholder="Viết đánh giá của bạn ở đây..."
                            multiline
                            numberOfLines={3}
                            value={reviews[productId]}
                            onChangeText={(text) => {
                                setReviews(prev => ({
                                    ...prev,
                                    [productId]: text,
                                }));
                            }}
                            editable={!isRefetchingReviews}
                        />
                        <View style={styles.reviewButtonsContainer}>
                            {isEditing && (
                                <TouchableOpacity
                                    style={[styles.cancelButton]}
                                    onPress={() => handleCancelEdit(productId)}
                                    disabled={isLoading || isRefetchingReviews}
                                >
                                    <Text style={styles.cancelButtonText}>Hủy</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[
                                    styles.submitReviewButton,
                                    { backgroundColor: orderDataColor || '#1CD4D4' },
                                    (isLoading || isRefetchingReviews) && styles.disabledButton,
                                    isEditing && styles.submitButtonSmall
                                ]}
                                onPress={() => handleSubmitReview(productId)}
                                disabled={isLoading || isRefetchingReviews}
                            >
                                {(isLoading || isRefetchingReviews) ? (
                                    <View style={styles.loadingButtonContent}>
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                        <Text style={styles.submitReviewText}>
                                            {isLoading ? 'Đang gửi...' : 'Đang tải...'}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.submitReviewText}>
                                        {isEditing ? 'Cập nhật' : 'Gửi đánh giá'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        );
    };



    // Format ngày
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Tính tổng tiền items
    const calculateSubtotal = () => {
        return orderData?.items?.reduce((total, item) => total + item.subtotal, 0) || 0;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={COLORS.secondary}
                translucent
            />

            {/* Header */}
            <LinearGradient
                colors={COLORS.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-back" size={24} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </SafeAreaView>
            </LinearGradient>
            {/* Global Loading Overlay */}
            {isRefetchingReviews && (
                <View style={styles.globalLoadingOverlay}>
                    <View style={styles.globalLoadingContainer}>
                        <ActivityIndicator size="large" color={orderDataColor || '#1CD4D4'} />
                        <Text style={styles.globalLoadingText}>Đang cập nhật đánh giá...</Text>
                    </View>
                </View>
            )}

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Order Info */}
                <View style={styles.orderInfo}>
                    <View style={styles.orderHeader}>
                        <View>
                            <Text style={styles.orderNumber}>{`#ORD-${orderData?.order_id?.slice(-4).toUpperCase()}`}</Text>
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

                    {/* Delivery Address */}
                    <View style={styles.addressContainer}>
                        <Text style={styles.addressTitle}>Địa chỉ giao hàng</Text>
                        <Text style={styles.customerName}>{orderData?.receiver_name}</Text>
                        <Text style={styles.address}>
                            {orderData?.receiver_address}{'\n'}
                            Điện thoại: {orderData?.receiver_phone}
                        </Text>
                    </View>

                    {/* Products */}
                    <View style={styles.productsContainer}>
                        {orderData?.items?.map((item, index) => (
                            <View key={item.product_id} style={styles.productCard}>
                                <View style={styles.productInfo}>
                                    <Image
                                        source={{ uri: item.image }}
                                        style={styles.productImage}
                                    />
                                    <View style={styles.productDetails}>
                                        <Text style={styles.productName}>{item.name}</Text>
                                        <Text style={styles.productVariant}>ID: {item.product_id.slice(-8)}</Text>
                                        <View style={styles.priceRow}>
                                            <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                                            <Text style={styles.quantity}>SL: {item.quantity}</Text>
                                        </View>
                                        <Text style={[
                                            styles.subtotal,
                                            { color: orderDataColor || '#22C55E' }
                                        ]}>Tạm tính: {formatCurrency(item.subtotal)}</Text>
                                    </View>
                                </View>
                                {renderRatingSection(item.product_id)}
                            </View>
                        ))}
                    </View>

                    {/* Order Summary */}
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tạm tính</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(calculateSubtotal())}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                            <Text style={styles.summaryValue}>
                                {formatCurrency(Math.max(0, (orderData?.total_price || 0) - calculateSubtotal()))}
                            </Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Tổng cộng</Text>
                            <Text style={styles.totalValue}>{formatCurrency(orderData?.total_price)}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            {(orderStatus === 'Chờ xử lý' || orderStatus === 'Đã giao') && (
                <View style={styles.actionContainer}>
                    {orderStatus === 'Chờ xử lý' && (
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                styles.cancelButton,
                                orderLoading && styles.disabledButton
                            ]}
                            onPress={handleCancelOrder}
                            disabled={orderLoading}
                        >
                            {orderLoading ? (
                                <View style={styles.loadingButtonContent}>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text style={styles.actionButtonText}>Đang hủy...</Text>
                                </View>
                            ) : (
                                <Text style={styles.actionButtonText}>Hủy đơn hàng</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    {orderStatus === 'Đã giao' && (
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                styles.returnButton,
                                orderLoading && styles.disabledButton
                            ]}
                            onPress={handleReturnOrder}
                            disabled={orderLoading}
                        >
                            {orderLoading ? (
                                <View style={styles.loadingButtonContent}>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text style={styles.actionButtonText}>Đang trả hàng...</Text>
                                </View>
                            ) : (
                                <Text style={styles.actionButtonText}>Trả hàng</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    orderInfo: {
        padding: 16,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    orderNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    orderDate: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: 'rgba(255, 184, 0, 0.1)',
        borderRadius: 20,
    },
    deliveredBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFB800',
    },
    deliveredText: {
        color: '#22C55E',
    },
    addressContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
    },
    addressTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        marginBottom: 8,
    },
    customerName: {
        fontSize: 16,
        color: '#4B5563',
        marginBottom: 4,
    },
    address: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    productsContainer: {
        marginBottom: 24,
    },
    productCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        marginBottom: 16,
    },
    productInfo: {
        flexDirection: 'row',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 16,
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
        marginBottom: 4,
    },
    productVariant: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    price: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    quantity: {
        fontSize: 14,
        color: '#6B7280',
    },
    subtotal: {
        fontSize: 14,
        fontWeight: '500',
        color: '#22C55E',
    },
    ratingSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    ratingTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
        marginBottom: 8,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    star: {
        marginRight: 4,
    },
    disabledStar: {
        opacity: 0.5,
    },
    reviewInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        textAlignVertical: 'top',
        minHeight: 80,
        marginBottom: 12,
    },
    reviewButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '500',
    },
    submitReviewButton: {
        flex: 2,
        backgroundColor: '#1CD4D4',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    submitButtonSmall: {
        marginBottom: 0,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitReviewText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    loadingButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reviewedContainer: {
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    existingReviewContent: {
        marginBottom: 12,
    },
    existingReviewText: {
        fontSize: 14,
        color: '#374151',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    reviewActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    submittedIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    submittedText: {
        color: '#22C55E',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    editButtonText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        color: '#6B7280',
    },
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
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    globalLoadingText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    summaryContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#4B5563',
    },
    summaryValue: {
        fontSize: 16,
        color: '#000',
    },
    totalRow: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginBottom: 0,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    actionContainer: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    cancelButton: {
        backgroundColor: '#EF4444',
    },
    returnButton: {
        backgroundColor: '#F59E0B',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    disabledButton: {
        opacity: 0.6,
    },
});

export default OrderDetailsScreen;