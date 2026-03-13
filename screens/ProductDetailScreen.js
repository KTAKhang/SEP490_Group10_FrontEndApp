import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Modal,
    FlatList,
    Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { fetchProductByIdAsync } from '../store/slices/productSlice';
import {
    fetchProductReviewsByProductId,
    selectProductReviews,
    selectProductReviewsLoading,
    selectProductReviewsPagination,
    selectProductReviewsLoadingMore,
} from '../store/slices/reviewSlice';
import { addToCart } from '../store/slices/cartSlice';
import {
    checkFavoriteStatus,
    addFavorite,
    removeFavorite,
    selectIsFavorite,
} from '../store/slices/favoriteSlice';
import { InlineLoading, OverlayLoading } from '../components/Loading';
import { COLORS } from '../constants/colors';
import Toast from 'react-native-toast-message';

function formatPrice(amount) {
    if (amount == null || isNaN(Number(amount))) return '0 VND';
    const num = Math.round(Number(amount));
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND';
}

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ navigation, route }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [quantity, setQuantity] = useState(1);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [reviewSearch, setReviewSearch] = useState('');
    const [reviewRatingFilter, setReviewRatingFilter] = useState(''); // '' = all, 1-5 = star filter
    const [showAllReviews, setShowAllReviews] = useState(false);

    const productId = route?.params?.productId;

    // Get product and loading state from Redux
    const { product, isLoading: productLoading, error } = useSelector((state) => state.product);

    // Get cart state for badge
    const { cart } = useSelector((state) => state.cart);
    const itemCount = cart?.item_count || 0;

    // Get authentication state
    const { isAuthenticated } = useSelector((state) => state.auth);

    // Favorite state
    const isFavorite = useSelector(state => selectIsFavorite(state, productId));

    // Get reviews for this specific product ONLY (paginated)
    const reviews = useSelector(state => selectProductReviews(state, productId));
    const reviewsLoading = useSelector(state => selectProductReviewsLoading(state, productId));
    const reviewsPagination = useSelector(state => selectProductReviewsPagination(state, productId));
    const reviewsLoadingMore = useSelector(state => selectProductReviewsLoadingMore(state, productId));

    // Check if product is out of stock
    const isOutOfStock = product && product.quantity <= 0;

    useEffect(() => {
        if (productId && productId !== 'undefined') {
            dispatch(fetchProductByIdAsync(productId));
            dispatch(checkFavoriteStatus(productId));
        }
    }, [dispatch, productId]);

    useEffect(() => {
        if (!productId || productId === 'undefined') return;
        dispatch(fetchProductReviewsByProductId({
            product_id: productId,
            page: 1,
            limit: 10,
        }));
    }, [dispatch, productId]);

    useEffect(() => {
        if (product && product.quantity > 0 && quantity > product.quantity) {
            setQuantity(product.quantity);
            Toast.show({
                type: 'info',
                text1: t('product.quantityAdjusted'),
                text2: t('product.quantityAdjustedTo', { count: product.quantity }),
                position: 'top',
                visibilityTime: 2500,
            });
        }
    }, [product?.quantity, quantity]);

    useEffect(() => {
        if (product) setSelectedImageIndex(0);
    }, [product?._id]);

    const isLoading = productLoading || reviewsLoading;

    const images = product && Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : product?.featuredImage
            ? [product.featuredImage]
            : product?.image
                ? [product.image]
                : [];

    // Calculate average rating from reviews của sản phẩm hiện tại
    const averageRating = reviews && reviews.length > 0
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
        : 0;

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Icon key={i} name="star" size={16} color="#FFD700" />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <Icon key="half" name="star-half" size={16} color="#FFD700" />
            );
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <Icon key={`empty-${i}`} name="star-border" size={16} color="#FFD700" />
            );
        }

        return stars;
    };

    // Render Avatar component
    const renderUserAvatar = (user) => {
        const avatarUrl = user?.avatar;
        const userName = user?.name || user?.user_name || user?.username || 'Anonymous';

        if (avatarUrl) {
            return (
                <Image
                    source={{ uri: avatarUrl }}
                    style={styles.userAvatar}
                    onError={() => {
                        // Fallback nếu không load được avatar
                    }}
                />
            );
        } else {
            // Fallback avatar với chữ cái đầu của tên
            const firstLetter = userName.charAt(0).toUpperCase();
            return (
                <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>{firstLetter}</Text>
                </View>
            );
        }
    };

    // Render individual review item
    const renderReviewItem = ({ item: review, index }) => {
        return (
            <View key={review._id || index} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                        {renderUserAvatar(review.user)}
                        <View style={styles.reviewerDetails}>
                            <Text style={styles.reviewerName}>
                                {review.user?.name ||
                                    review.user?.user_name ||
                                    review.user?.username ||
                                    review.userName ||
                                    review.user_name ||
                                    'Anonymous'}
                            </Text>
                            <Text style={styles.reviewDate}>
                                {new Date(review.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.starsContainer}>
                        {renderStars(review.rating)}
                    </View>
                </View>
                <Text style={styles.reviewText}>{review.comment || review.content || ''}</Text>
            </View>
        );
    };

    const handleQuantityChange = (type) => {
        if (type === 'increase') {
            if (quantity >= product.quantity) {
                // Show toast notification when trying to exceed stock
                Toast.show({
                    type: 'error',
                    text1: t('product.exceedsStock'),
                    text2: t('product.exceedsStockOnly', { count: product.quantity }),
                    position: 'top',
                    visibilityTime: 2500,
                });
                return;
            }
            setQuantity(prev => prev + 1);
        } else if (type === 'decrease' && quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleAddToCart = async () => {
        if (showLoadingModal || isOutOfStock) return; // Prevent multiple clicks or out of stock

        // Check if user is authenticated
        if (!isAuthenticated) {
            Alert.alert(
                t('common.loginRequired'),
                t('product.loginToAddCart'),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('common.login'), onPress: () => navigation.navigate('Login') }
                ]
            );
            return;
        }

        // Validate quantity before adding to cart
        if (quantity > product.quantity) {
            Toast.show({
                type: 'error',
                text1: t('product.invalidQuantity'),
                text2: t('product.exceedsStockOnly', { count: product.quantity }),
                position: 'top',
                visibilityTime: 3000,
            });
            return;
        }

        setShowLoadingModal(true);
        try {
            await dispatch(addToCart({
                product_id: productId,
                quantity: quantity
            })).unwrap();

            // Hide loading and show success
            setShowLoadingModal(false);
            setShowSuccessModal(true);

            // Auto hide success modal after 2 seconds
            setTimeout(() => {
                setShowSuccessModal(false);
            }, 2000);

        } catch (error) {
            setShowLoadingModal(false);

            // Show error toast
            Toast.show({
                type: 'error',
                text1: t('product.cannotAddToCart'),
                text2: error?.toString() || t('product.addToCartError'),
                position: 'top',
                visibilityTime: 2500,
            });
        }
    };

    const handleCartPress = () => {
        if (isAuthenticated) {
            navigation.navigate('Cart');
        } else {
            Alert.alert(
                t('common.loginRequired'),
                t('product.loginToViewCart'),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('common.login'), onPress: () => navigation.navigate('Login') }
                ]
            );
        }
    };

    const handleRefresh = useCallback(() => {
        if (productId) {
            dispatch(fetchProductByIdAsync(productId));
            dispatch(checkFavoriteStatus(productId));
            dispatch(fetchProductReviewsByProductId({
                product_id: productId,
                page: 1,
                limit: 10,
                rating: reviewRatingFilter || undefined,
            }));
            Toast.show({
                type: 'success',
                text1: t('product.dataRefreshed'),
                text2: t('product.productInfoUpdated'),
                position: 'top',
                visibilityTime: 1500,
            });
        }
    }, [dispatch, productId, reviewRatingFilter]);

    const handleToggleFavorite = async () => {
        if (!productId || productId === 'undefined') return;

        if (!isAuthenticated) {
            Alert.alert(
                t('common.loginRequired'),
                t('product.loginToFavorites'),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('common.login'), onPress: () => navigation.navigate('Login') }
                ]
            );
            return;
        }

        try {
            if (isFavorite) {
                await dispatch(removeFavorite(productId)).unwrap();
                Toast.show({
                    type: 'success',
                    text1: t('product.removedFromFavorites'),
                    position: 'top',
                    visibilityTime: 2000,
                });
            } else {
                await dispatch(addFavorite(productId)).unwrap();
                Toast.show({
                    type: 'success',
                    text1: t('product.addedToFavorites'),
                    position: 'top',
                    visibilityTime: 2000,
                });
            }
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t('product.cannotUpdateFavorites'),
                text2: error?.toString() || t('product.tryAgain'),
                position: 'top',
                visibilityTime: 2500,
            });
        }
    };

    const loadMoreReviews = useCallback(() => {
        if (!productId || reviewsLoadingMore || reviewsLoading) return;
        const { page, totalPages } = reviewsPagination;
        if (page >= totalPages) return;
        dispatch(fetchProductReviewsByProductId({
            product_id: productId,
            page: page + 1,
            limit: 10,
            rating: reviewRatingFilter || undefined,
            isLoadMore: true,
        }));
    }, [dispatch, productId, reviewsPagination, reviewsLoadingMore, reviewsLoading, reviewRatingFilter]);

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('common.error')}: {error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleRefresh}
                >
                    <Text style={styles.retryText}>{t('common.retry')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>{t('product.productDetails')}</Text>

                    <View style={styles.headerRightGroup}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleToggleFavorite}
                        >
                            <Icon
                                name={isFavorite ? 'favorite' : 'favorite-border'}
                                size={24}
                                color={isFavorite ? '#ff6b6b' : 'rgba(255, 255, 255, 0.85)'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleCartPress}
                        >
                            <Icon name="shopping-cart" size={24} color="rgba(255, 255, 255, 0.85)" />
                            {itemCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{itemCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Loading Content */}
                <InlineLoading text={t('product.loadingProduct')} style={styles.loadingContainer} />
            </SafeAreaView>
        );
    }

    if (!product) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('product.productNotFound')}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.retryText}>{t('common.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Check if product is inactive (status = false)
    if (product.status === false) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>{t('product.productDetails')}</Text>

                    <View style={styles.headerRightGroup}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleToggleFavorite}
                        >
                            <Icon
                                name={isFavorite ? 'favorite' : 'favorite-border'}
                                size={24}
                                color={isFavorite ? '#ff6b6b' : 'rgba(255, 255, 255, 0.85)'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleCartPress}
                        >
                            <Icon name="shopping-cart" size={24} color="rgba(255, 255, 255, 0.85)" />
                            {itemCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{itemCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inactiveContainer}>
                    <View style={styles.inactiveWrapper}>
                        <Icon name="block" size={80} color="#ff6b6b" />
                        <Text style={styles.inactiveTitle}>{t('product.productUnavailable')}</Text>
                        <Text style={styles.inactiveText}>
                            {t('product.productUnavailableDesc')}
                        </Text>
                        <TouchableOpacity
                            style={styles.goBackButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.goBackButtonText}>{t('common.back')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const reviewsFilteredByStar = !reviews ? [] : reviewRatingFilter
        ? reviews.filter(r => Number(r.rating) === Number(reviewRatingFilter))
        : reviews;
    const displayedReviews = !reviewSearch ? reviewsFilteredByStar : reviewsFilteredByStar.filter(r =>
        (r.comment || r.content || '').toLowerCase().includes(reviewSearch.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>{t('product.productDetails')}</Text>

                <View style={styles.headerRightGroup}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleToggleFavorite}
                    >
                        <Icon
                            name={isFavorite ? 'favorite' : 'favorite-border'}
                            size={24}
                            color={isFavorite ? '#ff6b6b' : 'rgba(255, 255, 255, 0.85)'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleCartPress}
                    >
                        <Icon name="shopping-cart" size={24} color="rgba(255, 255, 255, 0.85)" />
                        {itemCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{itemCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Breadcrumb */}
                <View style={styles.breadcrumb}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.breadcrumbButton}>
                        <Icon name="arrow-back" size={20} color="#666" />
                        <Text style={styles.breadcrumbText}>{t('product.backToProducts')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Image Gallery */}
                <View style={styles.imageContainer}>
                    <View style={styles.mainImageWrapper}>
                        {images.length > 0 ? (
                            <Image
                                source={{ uri: images[selectedImageIndex] }}
                                style={styles.productImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.noImagePlaceholder}>
                                <Icon name="image" size={48} color="#ccc" />
                                <Text style={styles.noImageText}>{t('product.noImage')}</Text>
                            </View>
                        )}
                        {product.isNearExpiry && product.originalPrice != null && product.originalPrice > 0 && (
                            <View style={styles.badgeNearExpiry}>
                                <Text style={styles.badgeNearExpiryText}>
                                    {t('product.percentOff', { percent: Math.round((1 - (product.price || 0) / product.originalPrice) * 100) })}
                                </Text>
                            </View>
                        )}
                    </View>
                    {images.length > 1 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.thumbnailsRow}
                        >
                            {images.map((img, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setSelectedImageIndex(index)}
                                    style={[
                                        styles.thumbnail,
                                        selectedImageIndex === index && styles.thumbnailSelected
                                    ]}
                                >
                                    <Image source={{ uri: img }} style={styles.thumbnailImage} resizeMode="cover" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Product Info Card (giống web) */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('product.nameLabel')}:</Text>
                        <Text style={styles.infoValueName}>{product.name}</Text>
                    </View>
                    {product.category?.name && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{t('product.categoryLabel')}:</Text>
                            <Text style={styles.infoValue}>{product.category.name}</Text>
                        </View>
                    )}
                    {product.brand && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{t('product.brandLabel')}:</Text>
                            <Text style={styles.infoValue}>{product.brand}</Text>
                        </View>
                    )}
                    {product.short_desc ? (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{t('product.shortDescLabel')}:</Text>
                            <Text style={styles.infoValueDesc}>{product.short_desc}</Text>
                        </View>
                    ) : null}
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('product.price')}:</Text>
                        <View style={styles.priceRow}>
                            {product.isNearExpiry && product.originalPrice != null && product.originalPrice > 0 && (
                                <Text style={styles.originalPrice}>{formatPrice(product.originalPrice)}</Text>
                            )}
                            <Text style={styles.currentPrice}>{formatPrice(product.price)}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('product.statusLabel')}:</Text>
                        <View style={[styles.statusDot, isOutOfStock ? styles.statusOutOfStock : styles.statusInStock]} />
                        <Text style={[styles.statusText, isOutOfStock && styles.statusTextOut]}>
                            {isOutOfStock ? t('product.outOfStock') : t('product.inStock')}
                        </Text>
                    </View>
                    {(reviews?.length > 0 || (product.avgRating != null && product.avgRating > 0)) && (
                        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                            <Text style={styles.infoLabel}>{t('product.reviewsLabel')}:</Text>
                            <View style={styles.ratingRow}>
                                {renderStars(averageRating)}
                                <Text style={styles.ratingValue}>{Number(averageRating).toFixed(1)}</Text>
                                <Text style={styles.ratingCount}>({t('product.ratingCount', { count: reviews?.length ?? 0 })})</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Quantity selector (compact) */}
                {!isOutOfStock && (
                    <View style={styles.quantityRow}>
                        <Text style={styles.quantityLabel}>{t('product.quantity')}:</Text>
                        <View style={styles.quantityControls}>
                            <TouchableOpacity
                                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                                onPress={() => handleQuantityChange('decrease')}
                                disabled={quantity <= 1}
                            >
                                <Icon name="remove" size={20} color={quantity <= 1 ? '#ccc' : '#666'} />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>
                            <TouchableOpacity
                                style={[styles.quantityButton, (quantity >= product.quantity || isOutOfStock) && styles.quantityButtonDisabled]}
                                onPress={() => handleQuantityChange('increase')}
                                disabled={quantity >= product.quantity || isOutOfStock}
                            >
                                <Icon name="add" size={20} color={(quantity >= product.quantity || isOutOfStock) ? '#ccc' : '#666'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Tabs: Mô tả | Chi tiết */}
                <View style={styles.tabsCard}>
                    <View style={styles.tabsRow}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'description' && styles.tabActive]}
                            onPress={() => setActiveTab('description')}
                        >
                            <Icon name="description" size={18} color={activeTab === 'description' ? COLORS.primary : '#666'} />
                            <Text style={[styles.tabText, activeTab === 'description' && styles.tabTextActive]}>{t('product.descriptionTab')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'specs' && styles.tabActive]}
                            onPress={() => setActiveTab('specs')}
                        >
                            <Icon name="format-list-bulleted" size={18} color={activeTab === 'specs' ? COLORS.primary : '#666'} />
                            <Text style={[styles.tabText, activeTab === 'specs' && styles.tabTextActive]}>{t('product.specsTab')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.tabContent}>
                        {activeTab === 'description' && (
                            <Text style={styles.description}>
                                {(product.detail_desc || product.description) || t('product.noDescription')}
                            </Text>
                        )}
                        {activeTab === 'specs' && (
                            <View style={styles.specsGrid}>
                                {product.category?.name && (
                                    <View style={styles.specItem}>
                                        <Icon name="category" size={20} color={COLORS.primary} />
                                        <View>
                                            <Text style={styles.specLabel}>{t('product.categoryLabel')}</Text>
                                            <Text style={styles.specValue}>{product.category.name}</Text>
                                        </View>
                                    </View>
                                )}
                                {product.quantity != null && (
                                    <View style={styles.specItem}>
                                        <Icon name="inventory" size={20} color={COLORS.primary} />
                                        <View>
                                            <Text style={styles.specLabel}>{t('product.inventoryLabel')}</Text>
                                            <Text style={[styles.specValue, isOutOfStock && { color: '#ef4444' }]}>
                                                {product.quantity} kg
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                {product.expiryDateStr && (
                                    <View style={styles.specItem}>
                                        <Icon name="event" size={20} color={COLORS.primary} />
                                        <View>
                                            <Text style={styles.specLabel}>{t('product.expiryLabel')}</Text>
                                            <Text style={styles.specValue}>
                                                {product.expiryDateStr.split('-').reverse().join('/')}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                {product.warehouseEntryDateStr && (
                                    <View style={styles.specItem}>
                                        <Icon name="store" size={20} color={COLORS.primary} />
                                        <View>
                                            <Text style={styles.specLabel}>{t('product.warehouseDateLabel')}</Text>
                                            <Text style={styles.specValue}>
                                                {product.warehouseEntryDateStr.split('-').reverse().join('/')}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {/* Reviews Section (giống web: header + search/sort + list) */}
                <View style={styles.reviewsSection}>
                    <View style={styles.reviewsSectionHeader}>
                        <View style={styles.reviewsTitleBlock}>
                            <View style={styles.reviewsIconWrap}>
                                <Icon name="star" size={24} color="#f59e0b" />
                            </View>
                            <View>
                                <Text style={styles.reviewsSectionTitle}>{t('product.productReviews')}</Text>
                                <Text style={styles.reviewsSectionSub}>
                                    {t('product.reviewsSub', { count: reviewsPagination?.total ?? 0, rating: Number(averageRating).toFixed(1) })}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                            <Icon name="refresh" size={20} color={COLORS.primary} />
                            <Text style={styles.refreshText}>{t('product.refresh')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Lọc theo số sao */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewStarFilterRow}>
                        {['', 5, 4, 3, 2, 1].map((star) => (
                            <TouchableOpacity
                                key={star === '' ? 'all' : star}
                                style={[
                                    styles.reviewStarFilterChip,
                                    (reviewRatingFilter === '' && star === '') || (reviewRatingFilter === star) ? styles.reviewStarFilterChipActive : null,
                                ]}
                                onPress={() => setReviewRatingFilter(star === '' ? '' : star)}
                            >
                                <Text style={[
                                    styles.reviewStarFilterChipText,
                                    (reviewRatingFilter === '' && star === '') || (reviewRatingFilter === star) ? styles.reviewStarFilterChipTextActive : null,
                                ]}>
                                    {star === '' ? t('product.allStars') : t('product.stars', { count: star })}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.reviewFiltersRow}>
                        <View style={styles.searchInputWrap}>
                            <Icon name="search" size={18} color="#999" style={styles.searchInputIcon} />
                            <TextInput
                                style={styles.reviewSearchInput}
                                placeholder={t('product.searchInReviews')}
                                placeholderTextColor="#999"
                                value={reviewSearch}
                                onChangeText={setReviewSearch}
                            />
                        </View>
                    </View>

                    {reviewsLoading ? (
                        <Text style={styles.reviewsLoadingText}>{t('product.loadingReviews')}</Text>
                    ) : !reviews || reviews.length === 0 ? (
                        <Text style={styles.noReviewsText}>{t('product.noReviewsForProduct')}</Text>
                    ) : (
                        <View style={styles.reviewListBox}>
                            <ScrollView
                                style={styles.reviewListScroll}
                                showsVerticalScrollIndicator={true}
                                nestedScrollEnabled={true}
                            >
                                {displayedReviews.length === 0 ? (
                                    <Text style={styles.noReviewsText}>
                                        {reviewRatingFilter
                                            ? t('product.noReviewsStarFilter', { star: reviewRatingFilter })
                                            : t('product.noReviewsMatch')}
                                    </Text>
                                ) : displayedReviews.map((review, index) => (
                                    <View key={review._id || index} style={styles.reviewCard}>
                                        <View style={styles.reviewCardHeader}>
                                            <View style={styles.reviewerInfo}>
                                                <View style={styles.avatarFallback}>
                                                    <Text style={styles.avatarFallbackText}>
                                                        {(review.user?.user_name || review.user_id?.user_name || 'U').charAt(0).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.reviewerName}>
                                                        {review.user?.user_name || review.user_id?.user_name || t('product.guest')}
                                                    </Text>
                                                    <Text style={styles.reviewDate}>
                                                        {review.createdAt ? new Date(review.createdAt).toLocaleString('vi-VN') : 'N/A'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.starsContainer}>{renderStars(review.rating)}</View>
                                        </View>
                                        {(review.comment || review.content) ? (
                                            <Text style={styles.reviewText}>{review.comment || review.content}</Text>
                                        ) : null}
                                        {Array.isArray(review.images) && review.images.length > 0 && (
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImagesRow}>
                                                {review.images.map((img, idx) => (
                                                    <Image key={idx} source={{ uri: img }} style={styles.reviewImage} resizeMode="cover" />
                                                ))}
                                            </ScrollView>
                                        )}
                                    </View>
                                ))}
                                {reviewsLoadingMore ? (
                                    <View style={styles.reviewLoadMoreFooter}>
                                        <Text style={styles.reviewLoadMoreText}>{t('product.loadingMore')}</Text>
                                    </View>
                                ) : reviewsPagination.page < reviewsPagination.totalPages && reviews.length > 0 ? (
                                    <TouchableOpacity style={styles.reviewLoadMoreButton} onPress={loadMoreReviews} disabled={reviewsLoadingMore}>
                                        <Text style={styles.reviewLoadMoreButtonText}>{t('product.loadMoreReviews')}</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </ScrollView>
                        </View>
                    )}
                    {reviews && reviews.length > 0 && (
                        <TouchableOpacity style={styles.showAllButton} onPress={() => setShowAllReviews(true)}>
                            <Text style={styles.showAllButtonText}>{t('product.viewAllReviews', { count: reviews.length })}</Text>
                            <Icon name="keyboard-arrow-right" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Reviews Modal (from main) */}
            <Modal
                visible={showAllReviews}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAllReviews(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowAllReviews(false)} style={styles.modalCloseButton}>
                            <Icon name="close" size={24} color={COLORS.text?.primary || '#333'} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{t('product.allReviewsTitle', { count: reviews?.length ?? 0 })}</Text>
                        <TouchableOpacity style={styles.modalRefreshButton} onPress={handleRefresh}>
                            <Icon name="refresh" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={reviews || []}
                        renderItem={renderReviewItem}
                        keyExtractor={(item, index) => item._id || index.toString()}
                        showsVerticalScrollIndicator={true}
                        style={styles.modalFlatList}
                        contentContainerStyle={[styles.modalContent, (!reviews || reviews.length === 0) && styles.modalContentEmpty]}
                        ItemSeparatorComponent={() => <View style={styles.reviewSeparator} />}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyReviewsContainer}>
                                <Icon name="rate-review" size={48} color="#ccc" />
                                <Text style={styles.emptyReviewsText}>{t('product.noReviewsYet')}</Text>
                                <Text style={styles.emptyReviewsSubText}>{t('product.beFirstToReview')}</Text>
                            </View>
                        )}
                    />
                </SafeAreaView>
            </Modal>

            {/* Loading Modal */}
            <OverlayLoading text={t('product.addingToCart')} visible={showLoadingModal} />

            {/* Success Modal */}
            <Modal
                transparent={true}
                animationType="fade"
                visible={showSuccessModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.successModalContent}>
                        <Icon name="check-circle" size={50} color="#4CAF50" />
                        <Text style={styles.modalText}>{t('product.addToCartSuccess')}</Text>
                    </View>
                </View>
            </Modal>

            {/* Bottom Action Bar */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={[
                        styles.addToCartButtonFull,
                        isOutOfStock && styles.addToCartButtonDisabled
                    ]}
                    onPress={handleAddToCart}
                    disabled={showLoadingModal || isOutOfStock}
                >
                    <Icon
                        name={isOutOfStock ? "remove-shopping-cart" : "shopping-cart"}
                        size={20}
                        color={isOutOfStock ? "#999" : COLORS.white}
                    />
                    <Text style={[
                        styles.addToCartTextFull,
                        isOutOfStock && styles.addToCartTextDisabled
                    ]}>
                        {isOutOfStock ? t('product.outOfStock') : t('product.addToCart')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Toast Message */}
            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#ff4757',
        marginBottom: 10,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: StatusBar.currentHeight + 16,
        backgroundColor: COLORS.primary,
        elevation: 5,
    },
    headerButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        position: 'relative',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.white,
    },
    headerRightGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    content: {
        flex: 1,
    },
    breadcrumb: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    breadcrumbButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    breadcrumbText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
        fontWeight: '500',
    },
    imageContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: '#f8f9fa',
    },
    mainImageWrapper: {
        position: 'relative',
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    noImagePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
    },
    noImageText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
    badgeNearExpiry: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: '#f59e0b',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeNearExpiryText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    thumbnailsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        paddingVertical: 4,
    },
    thumbnail: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
    },
    thumbnailSelected: {
        borderColor: COLORS.primary,
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    productInfo: {
        padding: 16,
    },
    infoCard: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    infoLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
        minWidth: 90,
    },
    infoValue: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    infoValueName: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    infoValueDesc: {
        flex: 1,
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    priceRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    currentPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.primary || '#0d9488',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusInStock: {
        backgroundColor: '#22c55e',
    },
    statusOutOfStock: {
        backgroundColor: '#ef4444',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#22c55e',
    },
    statusTextOut: {
        color: '#ef4444',
    },
    ratingRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ratingValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    ratingCount: {
        fontSize: 13,
        color: '#666',
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginTop: 12,
        paddingVertical: 8,
    },
    quantityLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabsCard: {
        marginHorizontal: 16,
        marginTop: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    tabsRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary || '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.06)',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    tabTextActive: {
        color: COLORS.primary || '#0d9488',
    },
    tabContent: {
        padding: 16,
    },
    specsGrid: {
        gap: 12,
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
    },
    specLabel: {
        fontSize: 11,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    specValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    reviewsSection: {
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 100,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    reviewsSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    reviewsTitleBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reviewsIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#fef3c7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewsSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    reviewsSectionSub: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    reviewFiltersRow: {
        marginBottom: 12,
    },
    reviewStarFilterRow: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
    },
    reviewStarFilterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    reviewStarFilterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    reviewStarFilterChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6b7280',
    },
    reviewStarFilterChipTextActive: {
        color: '#fff',
    },
    reviewListBox: {
        maxHeight: 400,
        marginBottom: 16,
    },
    reviewListScroll: {
        flexGrow: 0,
    },
    reviewLoadMoreButton: {
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 12,
    },
    reviewLoadMoreButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    reviewLoadMoreFooter: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    reviewLoadMoreText: {
        fontSize: 13,
        color: '#6b7280',
    },
    reviewLoadMoreHint: {
        fontSize: 12,
        color: '#9ca3af',
    },
    searchInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    searchInputIcon: {
        marginRight: 8,
    },
    reviewSearchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        color: '#333',
    },
    reviewsLoadingText: {
        textAlign: 'center',
        paddingVertical: 24,
        fontSize: 14,
        color: '#666',
    },
    reviewCard: {
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 12,
    },
    reviewCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    reviewImagesRow: {
        marginTop: 8,
    },
    reviewImage: {
        width: 72,
        height: 72,
        borderRadius: 8,
        marginRight: 8,
    },
    productName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    starsContainer: {
        flexDirection: 'row',
    },
    ratingText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    reviewCount: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    priceQuantityContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007bff',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 32,
        height: 32,
        backgroundColor: '#f0f0f0',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '500',
        marginHorizontal: 16,
        minWidth: 24,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    refreshText: {
        fontSize: 12,
        color: COLORS.primary,
        marginLeft: 4,
        fontWeight: '500',
    },
    reviewsPreviewContainer: {
        paddingBottom: 100,  // Tăng giá trị này nếu cần khoảng cách nhiều hơn
    },
    reviewItem: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    avatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarFallbackText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    reviewerDetails: {
        flex: 1,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    reviewText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginTop: 8,
    },
    reviewDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    noReviewsText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 20,
    },
    showAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#f0f8ff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginTop: 8,
    },
    showAllButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.primary,
        marginRight: 8,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#fff',
    },
    modalCloseButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    modalRefreshButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    modalFlatList: {
        flex: 1,
    },
    modalContent: {
        padding: 16,
    },
    modalContentEmpty: {
        flexGrow: 1,
    },
    reviewSeparator: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 8,
    },
    emptyReviewsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyReviewsText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#666',
        marginTop: 16,
    },
    emptyReviewsSubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border.light,
    },
    addToCartButtonFull: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        elevation: 2,
        shadowColor: COLORS.shadow?.dark || '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    addToCartTextFull: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successModalContent: {
        backgroundColor: COLORS.white,
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        minWidth: 250,
        elevation: 5,
        shadowColor: COLORS.shadow?.dark || '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    modalText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text?.primary || '#333',
        marginTop: 15,
        textAlign: 'center',
    },
    inactiveContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 20,
    },
    inactiveWrapper: {
        backgroundColor: COLORS.white,
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: COLORS.shadow?.dark || '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        maxWidth: 300,
    },
    inactiveTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ff6b6b',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    inactiveText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    goBackButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    goBackButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    outOfStockText: {
        color: '#ff4757',
    },
    addToCartButtonDisabled: {
        backgroundColor: '#ccc',
    },
    addToCartTextDisabled: {
        color: '#999',
    },
    quantityButtonDisabled: {
        backgroundColor: '#f0f0f0',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '700',
    },
});

export default ProductDetailScreen;