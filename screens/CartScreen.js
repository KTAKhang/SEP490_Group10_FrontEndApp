import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    SafeAreaView,
    TextInput,
    Alert,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCartByUser, updateCartItem, removeCartItem } from '../store/slices/cartSlice';
import { InlineLoading } from '../components/Loading';
import { formatCurrency } from '../utils/formatCurrency';
import { COLORS } from '../constants/colors';
import BottomNavigation from '../components/BottomNavigation';
import Toast from 'react-native-toast-message';

const CartScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { cart, isLoading, error } = useSelector((state) => state.cart);


    // Transform cart data to match UI expectations
    const [cartItems, setCartItems] = useState([]);
    const [editingQuantity, setEditingQuantity] = useState({}); // Track which items are being edited
    const [isUpdating, setIsUpdating] = useState({}); // Track updating state for individual items
    const [selectedItems, setSelectedItems] = useState([]); // Track selected items for checkout
    const [selectAll, setSelectAll] = useState(false); // Track select all state

    useEffect(() => {
        dispatch(fetchCartByUser());
    }, [dispatch]);


    useEffect(() => {
        if (cart && cart.items) {
            const transformedItems = cart.items.map(item => ({
                id: item.product_id,
                name: item.name,
                price: item.price, // Giữ nguyên giá VND
                image: item.image,
                quantity: item.quantity,
                color: 'Default',
                subtotal: item.subtotal,
                in_stock: item.in_stock,
                is_available: item.is_available,
                status: item.status
            }));
            setCartItems(transformedItems);

            // Chỉ auto select những items có thể mua được
            const availableItems = transformedItems.filter(item =>
                item.in_stock > 0 && item.status !== false
            );
            const availableItemIds = availableItems.map(item => item.id);
            setSelectedItems(availableItemIds);
            setSelectAll(availableItemIds.length === transformedItems.length);
        }
    }, [cart]);

    const toggleItemSelection = (itemId) => {
        const item = cartItems.find(item => item.id === itemId);
        if (!item || item.in_stock === 0 || item.status === false) {
            return; // Không cho phép select items không khả dụng
        }

        setSelectedItems(prev => {
            const isSelected = prev.includes(itemId);
            let newSelected;

            if (isSelected) {
                newSelected = prev.filter(id => id !== itemId);
            } else {
                newSelected = [...prev, itemId];
            }

            // Update select all state - chỉ tính những items có thể mua
            const availableItems = cartItems.filter(item =>
                item.in_stock > 0 && item.status !== false
            );
            setSelectAll(newSelected.length === availableItems.length);

            return newSelected;
        });
    };


    const toggleSelectAll = () => {
        const availableItems = cartItems.filter(item =>
            item.in_stock > 0 && item.status !== false
        );

        if (selectAll) {
            setSelectedItems([]);
            setSelectAll(false);
        } else {
            const availableItemIds = availableItems.map(item => item.id);
            setSelectedItems(availableItemIds);
            setSelectAll(true);
        }
    };

    const updateQuantity = async (product_id, newQuantity) => {
        const quantity = parseInt(newQuantity);

        if (quantity > 0) {
            setIsUpdating(prev => ({ ...prev, [product_id]: true }));
            try {
                await dispatch(updateCartItem({
                    product_id,
                    quantity
                })).unwrap();
            } catch (error) {
                // Nếu lỗi liên quan kho hàng, show toast
                Toast.show({
                    type: 'error',
                    text1: 'Không thể cập nhật',
                    text2: error?.toString() || 'Có lỗi xảy ra khi cập nhật số lượng',
                    position: 'top',
                    visibilityTime: 2500,
                });
            } finally {
                setIsUpdating(prev => {
                    const newState = { ...prev };
                    delete newState[product_id];
                    return newState;
                });
            }
        } else {
            showRemoveConfirmation(product_id);
        }
    };
    const handleQuantityChange = (product_id, text) => {
        // Chỉ cho phép nhập số và không giới hạn độ dài ở đây
        const numericText = text.replace(/[^0-9]/g, '');

        // Cập nhật state ngay lập tức mà không có điều kiện length
        // Điều này đảm bảo keyboard không bị đóng
        setEditingQuantity(prev => ({
            ...prev,
            [product_id]: numericText
        }));
    };

    const handleQuantitySubmit = async (product_id) => {
        const newQuantityText = editingQuantity[product_id];

        // Nếu không có giá trị trong editing state, không làm gì
        if (newQuantityText === undefined) {
            return;
        }

        // Nếu input trống, reset về quantity hiện tại
        if (!newQuantityText || newQuantityText.trim() === '') {
            setEditingQuantity(prev => {
                const newState = { ...prev };
                delete newState[product_id];
                return newState;
            });
            return;
        }

        const newQuantity = parseInt(newQuantityText);

        // Kiểm tra quantity hợp lệ (1-99)
        if (isNaN(newQuantity) || newQuantity < 1) {
            Alert.alert(
                'Xóa sản phẩm',
                'Số lượng không thể bằng 0. Bạn có muốn xóa sản phẩm này khỏi giỏ hàng không?',
                [
                    {
                        text: 'Hủy',
                        style: 'cancel',
                        onPress: () => {
                            // Reset về giá trị cũ
                            setEditingQuantity(prev => {
                                const newState = { ...prev };
                                delete newState[product_id];
                                return newState;
                            });
                        }
                    },
                    {
                        text: 'Xóa',
                        style: 'destructive',
                        onPress: () => {
                            setEditingQuantity(prev => {
                                const newState = { ...prev };
                                delete newState[product_id];
                                return newState;
                            });
                            removeItem(product_id);
                        }
                    }
                ]
            );
            return;
        }

        if (newQuantity > 99) {
            Alert.alert(
                'Số lượng không hợp lệ',
                'Số lượng tối đa cho phép là 99.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Reset về giá trị hợp lệ (99)
                            setEditingQuantity(prev => ({
                                ...prev,
                                [product_id]: '99'
                            }));
                        }
                    }
                ]
            );
            return;
        }

        const currentItem = cartItems.find(item => item.id === product_id);

        // Nếu quantity không thay đổi, chỉ clear editing state
        if (currentItem && newQuantity === currentItem.quantity) {
            setEditingQuantity(prev => {
                const newState = { ...prev };
                delete newState[product_id];
                return newState;
            });
            return;
        }

        // Set updating state
        setIsUpdating(prev => ({ ...prev, [product_id]: true }));

        try {
            await dispatch(updateCartItem({
                product_id,
                quantity: newQuantity
            })).unwrap();
            setEditingQuantity(prev => {
                const newState = { ...prev };
                delete newState[product_id];
                return newState;
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Không thể cập nhật',
                text2: error?.toString() || 'Có lỗi xảy ra khi cập nhật số lượng',
                position: 'top',
                visibilityTime: 2500,
            });
            setEditingQuantity(prev => {
                const newState = { ...prev };
                delete newState[product_id];
                return newState;
            });
        } finally {
            setIsUpdating(prev => {
                const newState = { ...prev };
                delete newState[product_id];
                return newState;
            });
        }
    };


    const handleQuantityBlur = (product_id) => {
        // Delay một chút để tránh conflict với onSubmitEditing
        setTimeout(() => {
            handleQuantitySubmit(product_id);
        }, 100);
    };

    // Show confirmation dialog for removing items
    const showRemoveConfirmation = (product_id) => {
        const item = cartItems.find(item => item.id === product_id);
        Alert.alert(
            'Xóa sản phẩm',
            `Bạn có chắc chắn muốn xóa "${item?.name}" khỏi giỏ hàng của bạn không?`,
            [
                {
                    text: 'Hủy',
                    style: 'cancel'
                },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => removeItem(product_id)
                }
            ]
        );
    };

    // Updated removeItem function to use the proper removeCartItem Redux action
    const removeItem = async (product_id) => {
        setIsUpdating(prev => ({ ...prev, [product_id]: true }));

        try {
            await dispatch(removeCartItem(product_id)).unwrap();


            // Remove from selected items if it was selected
            setSelectedItems(prev => prev.filter(id => id !== product_id));

            // Show success message
            Alert.alert(
                'Thành công',
                'Đã xóa sản phẩm khỏi giỏ hàng thành công',
                [{ text: 'OK' }],
                { cancelable: true }
            );
        } catch (error) {
            console.error('Remove failed:', error);
            Alert.alert(
                'Xóa thất bại',
                error || 'Không thể xóa sản phẩm khỏi giỏ hàng',
                [{ text: 'OK' }]
            );
        } finally {
            setIsUpdating(prev => {
                const newState = { ...prev };
                delete newState[product_id];
                return newState;
            });
        }
    };

    // Bulk remove function - remove multiple items at once
    const removeMultipleItems = async (productIds) => {
        if (!productIds || productIds.length === 0) return;

        Alert.alert(
            'Xóa sản phẩm',
            `Bạn có chắc chắn muốn xóa ${productIds.length} sản phẩm khỏi giỏ hàng của bạn không?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa tất cả',
                    style: 'destructive',
                    onPress: async () => {
                        // Set updating state for all items
                        const updatingState = {};
                        productIds.forEach(id => {
                            updatingState[id] = true;
                        });
                        setIsUpdating(prev => ({ ...prev, ...updatingState }));

                        try {
                            // Remove items one by one
                            for (const productId of productIds) {
                                await dispatch(removeCartItem(productId)).unwrap();
                            }

                            // Clear selected items
                            setSelectedItems([]);
                            setSelectAll(false);

                            Alert.alert(
                                'Thành công',
                                'Đã xóa các sản phẩm khỏi giỏ hàng thành công',
                                [{ text: 'OK' }]
                            );
                        } catch (error) {
                            Alert.alert(
                                'Xóa thất bại',
                                error || 'Không thể xóa một số sản phẩm khỏi giỏ hàng',
                                [{ text: 'OK' }]
                            );
                        } finally {
                            // Clear updating state for all items
                            setIsUpdating(prev => {
                                const newState = { ...prev };
                                productIds.forEach(id => {
                                    delete newState[id];
                                });
                                return newState;
                            });
                        }
                    }
                }
            ]
        );
    };

    // Clear entire cart function
    const clearCart = () => {
        if (cartItems.length === 0) return;

        Alert.alert(
            'Xóa toàn bộ giỏ hàng',
            'Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng của bạn không?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa tất cả',
                    style: 'destructive',
                    onPress: () => {
                        const allProductIds = cartItems.map(item => item.id);
                        removeMultipleItems(allProductIds);
                    }
                }
            ]
        );
    };

    // Calculate totals for selected items only
    const selectedCartItems = cartItems.filter(item => selectedItems.includes(item.id));
    const subtotal = selectedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = selectedCartItems.length > 0 ? 0 : 0; // Free shipping
    const total = subtotal + shipping;

    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            Alert.alert(
                'Chưa chọn sản phẩm nào',
                'Vui lòng chọn ít nhất một sản phẩm có sẵn để tiến hành thanh toán.',
                [{ text: 'OK' }]
            );
            return;
        }

        // Kiểm tra xem có items unavailable trong selected không
        const selectedProducts = cartItems.filter(item => selectedItems.includes(item.id));
        const unavailableSelectedItems = selectedProducts.filter(item =>
            item.in_stock === 0 || item.status === false
        );

        if (unavailableSelectedItems.length > 0) {
            Alert.alert(
                'Sản phẩm không khả dụng',
                'Một số sản phẩm đã chọn đã hết hàng hoặc ngừng bán. Vui lòng bỏ chọn chúng.',
                [{ text: 'OK' }]
            );
            return;
        }

        const selected_product_ids = selectedProducts.map(item => item.id);


        navigation.navigate('Payment', {
            selectedItems: selectedProducts,
            orderSummary: {
                subtotal,
                shipping,
                total
            },
            selected_product_ids: selected_product_ids
        });
    };

    const CartItem = React.memo(({ item }) => {
        const itemIsUpdating = isUpdating[item.id];
        const isSelected = selectedItems.includes(item.id);
        const isOutOfStock = item.in_stock === 0;
        const isDiscontinued = item.status === false;
        const isUnavailable = isOutOfStock || isDiscontinued;

        return (
            <View style={[styles.cartItem, isUnavailable && styles.unavailableItem]}>
                {/* Selection Checkbox - disabled nếu hết hàng hoặc ngừng bán */}
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => toggleItemSelection(item.id)}
                    disabled={itemIsUpdating || isUnavailable}
                >
                    <View style={[
                        styles.checkbox,
                        isSelected && !isUnavailable && styles.checkboxSelected,
                        (itemIsUpdating || isUnavailable) && styles.checkboxDisabled
                    ]}>
                        {isSelected && !isUnavailable && (
                            <Icon name="check" size={16} color="#ffffff" />
                        )}
                    </View>
                </TouchableOpacity>

                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: item.image }}
                        style={[
                            styles.itemImage,
                            isUnavailable && styles.unavailableImage
                        ]}
                        resizeMode="contain"
                    />
                    {/* Overlay cho hình ảnh khi hết hàng */}
                    {isUnavailable && (
                        <View style={styles.imageOverlay}>
                            <Text style={styles.overlayText}>
                                {isOutOfStock ? 'HẾT HÀNG' : 'NGỪNG BÁN'}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.itemDetails}>
                    <View style={styles.itemHeader}>
                        <View style={styles.itemNameContainer}>
                            <Text style={[
                                styles.itemName,
                                !isSelected && styles.itemNameUnselected,
                                isUnavailable && styles.unavailableText
                            ]}>
                                {item.name}
                            </Text>
                            {/* Status badges */}
                            {isOutOfStock && (
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusBadgeText}>Hết hàng</Text>
                                </View>
                            )}
                            {isDiscontinued && (
                                <View style={[styles.statusBadge, styles.discontinuedBadge]}>
                                    <Text style={styles.statusBadgeText}>Ngừng bán</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity
                            onPress={() => showRemoveConfirmation(item.id)}
                            disabled={itemIsUpdating}
                            style={styles.deleteButton}
                        >
                            <Icon name="delete-outline" size={20} color={itemIsUpdating ? "#d1d5db" : "#ef4444"} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.itemSpecs, isUnavailable && styles.unavailableText]}>
                        {item.size ? `Kích thước: ${item.size}` : ''}
                        {item.size && item.in_stock !== undefined ? ' | ' : ''}
                        {item.in_stock !== undefined ? `Số lượng sản phẩm tồn kho: ${item.in_stock}` : ''}
                    </Text>

                    <View style={styles.itemFooter}>
                        <Text style={[
                            styles.itemPrice,
                            !isSelected && styles.itemPriceUnselected,
                            isUnavailable && styles.unavailableText
                        ]}>
                            {formatCurrency(item.price)}
                        </Text>

                        {/* Quantity controls - disabled nếu hết hàng hoặc ngừng bán */}
                        <View style={[
                            styles.quantityContainer,
                            isUnavailable && styles.disabledQuantityContainer
                        ]}>
                            <TouchableOpacity
                                style={[
                                    styles.quantityButton,
                                    (itemIsUpdating || isUnavailable) && styles.disabledButton
                                ]}
                                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={itemIsUpdating || isUnavailable}
                            >
                                <Icon name="remove" size={16} color={(itemIsUpdating || isUnavailable) ? "#d1d5db" : "#6b7280"} />
                            </TouchableOpacity>

                            <TextInput
                                style={[
                                    styles.quantityInput,
                                    (itemIsUpdating || isUnavailable) && styles.disabledInput
                                ]}
                                value={
                                    typeof editingQuantity[item.id] === 'string'
                                        ? editingQuantity[item.id]
                                        : item.quantity.toString()
                                }

                                onChangeText={(text) => handleQuantityChange(item.id, text)}
                                onSubmitEditing={() => handleQuantitySubmit(item.id)}
                                onBlur={() => handleQuantityBlur(item.id)}
                                autoFocus={editingQuantity[item.id] !== undefined}
                                keyboardType="numeric"
                                textAlign="center"
                                maxLength={3}
                                selectTextOnFocus={true}
                                editable={!itemIsUpdating && !isUnavailable}
                                returnKeyType="done"
                            />

                            <TouchableOpacity
                                style={[
                                    styles.quantityButton,
                                    (itemIsUpdating || isUnavailable) && styles.disabledButton
                                ]}
                                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={itemIsUpdating || isUnavailable}
                            >
                                <Icon name="add" size={16} color={(itemIsUpdating || isUnavailable) ? "#d1d5db" : "#6b7280"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {itemIsUpdating && (
                        <Text style={styles.updatingText}>
                            {Object.keys(isUpdating).some(key => key === item.id.toString()) ? 'Đang Cập Nhật...' : 'Đang cập nhật...'}
                        </Text>
                    )}

                    {/* Warning message cho sản phẩm không khả dụng */}
                    {isUnavailable && (
                        <Text style={styles.unavailableWarning}>
                            {isOutOfStock
                                ? 'Sản phẩm này hiện đang hết hàng và không thể mua.'
                                : 'Sản phẩm này đã ngừng bán và không còn có sẵn.'
                            }
                        </Text>
                    )}
                </View>
            </View>
        );
    });
    // Show loading state
    if (isLoading && !cart) {
        return (
            <View style={styles.container}>
                <StatusBar
                    barStyle="light-content"
                    backgroundColor={COLORS.secondary}
                    translucent
                />
                <LinearGradient
                    colors={COLORS.gradient.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <SafeAreaView>
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Icon name="arrow-back" size={24} color="#ffffff" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Shopping Cart</Text>
                            <View style={styles.headerSpacer} />
                        </View>
                    </SafeAreaView>
                </LinearGradient>
                <InlineLoading text="Đang tải giỏ hàng..." style={styles.loadingContainer} />
                <BottomNavigation />
            </View>
        );
    }

    // Show error state
    if (error && !cart) {
        return (
            <View style={styles.container}>
                <StatusBar
                    barStyle="light-content"
                    backgroundColor={COLORS.secondary}
                    translucent
                />
                <LinearGradient
                    colors={COLORS.gradient.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <SafeAreaView>
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.headerButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Icon name="arrow-back" size={24} color="#ffffff" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Shopping Cart</Text>
                            <View style={styles.headerSpacer} />
                        </View>
                    </SafeAreaView>
                </LinearGradient>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Lỗi khi tải giỏ hàng: {error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => dispatch(fetchCartByUser())}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
                <BottomNavigation />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={COLORS.secondary}
                translucent
            />
            <LinearGradient
                colors={COLORS.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-back" size={24} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>
                            Giỏ hàng ({cart?.item_count || cartItems.length})
                        </Text>
                        {/* Empty space for header balance - invisible */}
                        <View style={styles.headerSpacer} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Select All Section */}
                {cartItems.length > 0 && (
                    <View style={styles.selectAllContainer}>
                        <TouchableOpacity
                            style={styles.selectAllButton}
                            onPress={toggleSelectAll}
                        >
                            <View style={[
                                styles.checkbox,
                                selectAll && styles.checkboxSelected
                            ]}>
                                {selectAll && (
                                    <Icon name="check" size={16} color="#ffffff" />
                                )}
                            </View>
                            <Text style={styles.selectAllText}>
                                Chọn tất cả ({selectedItems.length}/{cartItems.length})
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Cart Items */}
                {cartItems.length > 0 ? (
                    <View style={styles.cartItemsContainer}>
                        {cartItems.map((item, index) => (
                            <View key={item.id}>
                                <CartItem item={item} />
                                {index < cartItems.length - 1 && <View style={styles.itemDivider} />}
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyCartContainer}>
                        <Icon name="shopping-cart" size={64} color="#d1d5db" />
                        <Text style={styles.emptyCartText}>Giỏ hàng của bạn đang trống</Text>
                        <Text style={styles.emptyCartSubtext}>Thêm một số sản phẩm để bắt đầu</Text>
                        <TouchableOpacity
                            style={styles.continueShoppingButton}
                            onPress={() => navigation.navigate('AllProducts')}
                        >
                            <Text style={styles.continueShoppingText}>Tiếp tục mua sắm</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Order Summary - Only show for selected items */}
                {selectedItems.length > 0 && (
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryHeader}>
                            <Text style={styles.summaryTitle}>
                                Tổng kết đơn hàng ({selectedItems.length} sản phẩm)
                            </Text>
                            {cartItems.length > 1 && (
                                <TouchableOpacity
                                    onPress={clearCart}
                                    disabled={isLoading}
                                    style={styles.clearAllButton}
                                >
                                    <Text style={styles.clearAllText}>Xóa tất cả</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.summaryContent}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Tạm tính</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(shipping)}</Text>
                            </View>
                            <View style={styles.totalDivider} />
                            <View style={[styles.summaryRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Tổng cộng</Text>
                                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Checkout Button */}
            {cartItems.length > 0 && (
                <View style={styles.checkoutContainer}>
                    <TouchableOpacity
                        style={[
                            styles.checkoutButton,
                            (isLoading || selectedItems.length === 0) && styles.disabledButton
                        ]}
                        onPress={handleCheckout}
                        disabled={isLoading || selectedItems.length === 0}
                    >
                        <Text style={styles.checkoutButtonText}>
                            {isLoading
                                ? 'Đang cập nhật...'
                                : selectedItems.length === 0
                                    ? 'Chọn sản phẩm để thanh toán'
                                    : `Tiến hành thanh toán (${selectedItems.length} sản phẩm)`
                            }
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            <BottomNavigation />
        </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerSpacer: {
        width: 44,
        height: 44,
        // Invisible spacer for header balance
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.5,
        flex: 1,
        marginHorizontal: 12,
    },
    content: {
        flex: 1,
        marginTop: -20,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 30,
        paddingBottom: 180, // Space for checkout button + BottomNavigation
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.text.primary,
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
    disabledInput: {
        opacity: 0.6,
        backgroundColor: '#f3f4f6',
    },
    emptyCartContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyCartText: {
        fontSize: 20,
        fontWeight: '500',
        color: '#374151',
        textAlign: 'center',
        marginTop: 16,
    },
    emptyCartSubtext: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    continueShoppingButton: {
        backgroundColor: '#0d364c',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    continueShoppingText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    cartItemsContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cartItem: {
        flexDirection: 'row',
        padding: 16,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
    },
    itemDetails: {
        flex: 1,
        marginLeft: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0d364c',
        flex: 1,
        marginRight: 8,
    },
    deleteButton: {
        padding: 4,
    },
    itemSpecs: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
        marginBottom: 8,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0d364c',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 20,
    },
    quantityButton: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityInput: {
        width: 32,
        height: 28,
        textAlign: 'center',
        fontSize: 14,
        color: '#0d364c',
        fontWeight: '500',
        borderWidth: 0,
        padding: 0,
        margin: 0,
        backgroundColor: 'transparent',
    },
    updatingText: {
        fontSize: 12,
        color: '#6b7280',
        fontStyle: 'italic',
        marginTop: 4,
        textAlign: 'right',
    },
    itemDivider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginHorizontal: 16,
    },
    summaryContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#0d364c',
    },
    clearAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    clearAllText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '500',
    },
    summaryContent: {
        padding: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        color: '#6b7280',
        fontSize: 14,
    },
    summaryValue: {
        color: '#0d364c',
        fontSize: 14,
    },
    totalDivider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginVertical: 8,
    },
    totalRow: {
        marginBottom: 0,
    },
    totalLabel: {
        fontWeight: '500',
        color: '#0d364c',
        fontSize: 16,
    },
    totalValue: {
        fontWeight: '500',
        color: '#0d364c',
        fontSize: 18,
    },
    checkoutContainer: {
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        padding: 16,
        marginBottom: 80, // Space for BottomNavigation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    checkoutButton: {
        backgroundColor: '#0d364c',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    checkoutButtonText: {
        color: '#ffffff',
        fontWeight: '500',
        fontSize: 16,
    },
    // Select All Section Styles
    selectAllContainer: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    selectAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectAllText: {
        fontSize: 16,
        color: '#0d364c',
        marginLeft: 12,
        fontWeight: '500',
    },

    // Checkbox Styles
    checkboxContainer: {
        marginRight: 12,
        paddingVertical: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#d1d5db',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },
    checkboxSelected: {
        backgroundColor: '#0d364c',
        borderColor: '#0d364c',
    },
    checkboxDisabled: {
        opacity: 0.5,
        backgroundColor: '#f3f4f6',
    },

    // Unselected Item Styles
    itemNameUnselected: {
        opacity: 0.6,
        color: '#9ca3af',
    },
    itemPriceUnselected: {
        opacity: 0.6,
        color: '#9ca3af',
    },
    unavailableItem: {
        opacity: 0.7,
        backgroundColor: '#fafafa',
    },

    unavailableText: {
        color: '#9ca3af',
        textDecorationLine: 'line-through',
    },

    unavailableImage: {
        opacity: 0.5,
    },

    imageContainer: {
        position: 'relative',
    },

    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },

    overlayText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    itemNameContainer: {
        flex: 1,
        marginRight: 8,
    },

    statusBadge: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        alignSelf: 'flex-start',
    },

    discontinuedBadge: {
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
    },

    statusBadgeText: {
        fontSize: 10,
        fontWeight: '500',
        color: '#ef4444',
        textTransform: 'uppercase',
    },

    disabledQuantityContainer: {
        opacity: 0.4,
        backgroundColor: '#f9fafb',
    },

    unavailableWarning: {
        fontSize: 12,
        color: '#ef4444',
        fontStyle: 'italic',
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#fef2f2',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
});

export default CartScreen;