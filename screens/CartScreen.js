import React, { useEffect, useState, useRef } from "react";
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
} from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCartByUser,
  updateCartItem,
  removeCartItem,
} from "../store/slices/cartSlice";
import { checkoutHold } from "../store/slices/checkoutSlice";
import { InlineLoading } from "../components/Loading";
import { formatCurrency } from "../utils/formatCurrency";
import { COLORS } from "../constants/colors";
// import BottomNavigation from "../components/BottomNavigation";
import Toast from "react-native-toast-message";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
const CartScreen = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { cart, isLoading, error, items } = useSelector((state) => state.cart);
const checkout = useSelector((state) => state.checkout || {});
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
    if (items) {
      const transformedItems = items.map((item) => ({
        id: item.product_id,
        name: item.name,
        price: item.price, // Giữ nguyên giá VND
        image: item.image,
        quantity: item.quantity,
        color: "Default",
        subtotal: item.subtotal,
        in_stock: item.in_stock,
        is_available: item.is_available,
        status: item.status,
        expired : item.isExpired ?? false,
        warning : item?.warning,
        originalPrice : item.originalPrice ?? item.product?.originalPrice ?? null,
        isNearExpiry : item.isNearExpiry ?? item.product?.isNearExpiry ?? false,            
      }));
      setCartItems(transformedItems);

      // Chỉ auto select những items có thể mua được
      const availableItems = transformedItems.filter(
        (item) => item.in_stock > 0 && item.status !== false,
      );
      const availableItemIds = availableItems.map((item) => item.id);
      setSelectedItems(availableItemIds);
      setSelectAll(availableItemIds.length === transformedItems.length);
    }
  }, [items]);

  const toggleItemSelection = (itemId) => {
    const item = cartItems.find((item) => item.id === itemId);
    if (!item || item.in_stock === 0 || item.status === false) {
      return; // Không cho phép select items không khả dụng
    }

    setSelectedItems((prev) => {
      const isSelected = prev.includes(itemId);
      let newSelected;

      if (isSelected) {
        newSelected = prev.filter((id) => id !== itemId);
      } else {
        newSelected = [...prev, itemId];
      }

      // Update select all state - chỉ tính những items có thể mua
      const availableItems = cartItems.filter(
        (item) => item.in_stock > 0 && item.status !== false,
      );
      setSelectAll(newSelected.length === availableItems.length);

      return newSelected;
    });
  };

  const toggleSelectAll = () => {
    const availableItems = cartItems.filter(
      (item) => item.in_stock > 0 && item.status !== false,
    );

    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      const availableItemIds = availableItems.map((item) => item.id);
      setSelectedItems(availableItemIds);
      setSelectAll(true);
    }
  };

  const updateQuantity = async (product_id, newQuantity) => {
    const quantity = parseInt(newQuantity);

    if (quantity > 0) {
      setIsUpdating((prev) => ({ ...prev, [product_id]: true }));
      try {
        await dispatch(
          updateCartItem({
            product_id,
            quantity,
          }),
        ).unwrap();

        // Refresh cart after successful update to keep UI in sync
      //  await dispatch(fetchCartByUser()); 
      } catch (error) {
        // Nếu lỗi liên quan kho hàng, show toast
        Toast.show({
          type: "error",
          text1: t("cart.updateError"),
          text2: error?.toString() || t("cart.updateErrorDetail"),
          position: "top",
          visibilityTime: 2500,
        });
      } finally {
        setIsUpdating((prev) => {
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
    const numericText = text.replace(/[^0-9]/g, "");

    // Cập nhật state ngay lập tức mà không có điều kiện length
    // Điều này đảm bảo keyboard không bị đóng
    setEditingQuantity((prev) => ({
      ...prev,
      [product_id]: numericText,
    }));
  };

  const handleQuantitySubmit = async (product_id) => {
    const newQuantityText = editingQuantity[product_id];

    // Nếu không có giá trị trong editing state, không làm gì
    if (newQuantityText === undefined) {
      return;
    }

    // Nếu input trống, reset về quantity hiện tại
    if (!newQuantityText || newQuantityText.trim() === "") {
      setEditingQuantity((prev) => {
        const newState = { ...prev };
        delete newState[product_id];
        return newState;
      });
      return;
    }

    const newQuantity = parseInt(newQuantityText);

    // Kiểm tra quantity hợp lệ (1-1000)
    if (isNaN(newQuantity) || newQuantity < 1) {
      Alert.alert(
        t("cart.deleteProduct"),
        t("cart.quantityZeroConfirm"),
        [
          {
            text: t("cart.cancel"),
            style: "cancel",
            onPress: () => {
              // Reset về giá trị cũ
              setEditingQuantity((prev) => {
                const newState = { ...prev };
                delete newState[product_id];
                return newState;
              });
            },
          },
          {
            text: t("cart.delete"),
            style: "destructive",
            onPress: () => {
              setEditingQuantity((prev) => {
                const newState = { ...prev };
                delete newState[product_id];
                return newState;
              });
              removeItem(product_id);
            },
          },
        ],
      );
      return;
    }

    if (newQuantity > 1000) {
      Alert.alert(t("cart.invalidQuantity"), t("cart.maxQuantity"), [
        {
          text: t("cart.ok"),
          onPress: () => {
            // Reset về giá trị hợp lệ (1000)
            setEditingQuantity((prev) => ({
              ...prev,
              [product_id]: "1000",
            }));
          },
        },
      ]);
      return;
    }

    const currentItem = cartItems.find((item) => item.id === product_id);

    // Nếu quantity không thay đổi, chỉ clear editing state
    if (currentItem && newQuantity === currentItem.quantity) {
      setEditingQuantity((prev) => {
        const newState = { ...prev };
        delete newState[product_id];
        return newState;
      });
      return;
    }

    // Set updating state
    setIsUpdating((prev) => ({ ...prev, [product_id]: true }));

    try {
      await dispatch(
        updateCartItem({
          product_id,
          quantity: newQuantity,
        }),
      ).unwrap();

      // Refresh cart after successful update
      // await dispatch(fetchCartByUser());

      setEditingQuantity((prev) => {
        const newState = { ...prev };
        delete newState[product_id];
        return newState;
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Unable to update",
        text2: error?.toString() || "An error occurred while updating the quantity.",
        position: "top",
        visibilityTime: 2500,
      });
      setEditingQuantity((prev) => {
        const newState = { ...prev };
        delete newState[product_id];
        return newState;
      });
    } finally {
      setIsUpdating((prev) => {
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
    const item = cartItems.find((item) => item.id === product_id);
    Alert.alert(
      t("cart.deleteProduct"),
      t("cart.deleteProductConfirm", { name: item?.name || "" }),
      [
        {
          text: t("cart.cancel"),
          style: "cancel",
        },
        {
          text: t("cart.delete"),
          style: "destructive",
          onPress: () => removeItem(product_id),
        },
      ],
    );
  };

  // Updated removeItem function to use the proper removeCartItem Redux action
  const removeItem = async (product_id) => {
    setIsUpdating((prev) => ({ ...prev, [product_id]: true }));

    try {
      console.log("removeItem")
      await dispatch(removeCartItem(product_id)).unwrap();

      // Refresh cart after remove
      // await dispatch(fetchCartByUser());

      // Remove from selected items if it was selected
      setSelectedItems((prev) => prev.filter((id) => id !== product_id));

      // Show success message
      Alert.alert(
        t("cart.success"),
        t("cart.removedFromCart"),
        [{ text: t("cart.ok") }],
        { cancelable: true },
      );
    } catch (error) {
      console.error("Remove failed:", error);
      Alert.alert(
        t("cart.deleteFailure"),
        error || t("cart.removeError"),
        [{ text: t("cart.ok") }],
      );
    } finally {
      setIsUpdating((prev) => {
        const newState = { ...prev };
        delete newState[product_id];
        return newState;
      });
    }
  };

  // Bulk remove function - remove multiple items at once
  // Added `skipConfirm` so callers can skip the Alert and avoid nested modals
  const removeMultipleItems = async (productIds, skipConfirm = false) => {
    if (!productIds || productIds.length === 0) return;

    const performRemove = async () => {
      // Set updating state for all items
      const updatingState = {};
      productIds.forEach((id) => {
        updatingState[id] = true;
      });
      setIsUpdating((prev) => ({ ...prev, ...updatingState }));

      try {
        // Remove all items in a single request
        await dispatch(removeCartItem(productIds)).unwrap();

        // Refresh cart after bulk remove
        // await dispatch(fetchCartByUser());

        // Clear selected items
        setSelectedItems([]);
        setSelectAll(false);

        Alert.alert(
          t("cart.success"),
          t("cart.removedMultiple"),
          [{ text: t("cart.ok") }],
        );
      } catch (error) {
        Alert.alert(
          t("cart.deleteFailure"),
          error || t("cart.removeMultipleError"),
          [{ text: t("cart.ok") }],
        );
      } finally {
        // Clear updating state for all items
        setIsUpdating((prev) => {
          const newState = { ...prev };
          productIds.forEach((id) => {
            delete newState[id];
          });
          return newState;
        });
      }
    };

    if (skipConfirm) {
      await performRemove();
      return;
    }

    Alert.alert(
      t("cart.deleteProduct"),
      t("cart.deleteAllConfirm", { count: productIds.length }),
      [
        { text: t("cart.cancel"), style: "cancel" },
        {
          text: t("cart.deleteAllBtn"),
          style: "destructive",
          onPress: performRemove,
        },
      ],
    );
  };

  // Clear entire cart function
  const clearCart = () => {
    if (cartItems.length === 0) return;

    Alert.alert(
      t("cart.clearCartTitle"),
      t("cart.clearCartConfirm"),
      [
        { text: t("cart.cancel"), style: "cancel" },
        {
          text: t("cart.deleteAllBtn"),
          style: "destructive",
          onPress: () => {
            const allProductIds = cartItems.map((item) => item.id);
            // Skip inner confirmation to avoid nested modals
            removeMultipleItems(allProductIds, true);
          },
        },
      ],
    );
  };

  // Calculate totals for selected items only
  const selectedCartItems = cartItems.filter((item) =>
    selectedItems.includes(item.id),
  );
  const subtotal = selectedCartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = subtotal;

  // If user previously started a checkout, automatically go to checkout page
  useEffect(() => {
    (async () => {
      try {
        console.log("hehe")
        const existingSession = await AsyncStorage.getItem("checkout_session_id");
        if (existingSession && navigation.isFocused()) {
          navigation.navigate("Payment");
        }
      } catch (err) {
        console.warn("Failed reading checkout_session_id", err);
      }
    })();
  }, []);

  // Watch checkout reducer: when hold is successful it will populate checkout_session_id
  useEffect(() => {
    (async () => {
      try {
        if (checkout.checkout_session_id) {
          await AsyncStorage.setItem("checkout_session_id", checkout.checkout_session_id);
          navigation.navigate("Payment");
        } else if (checkout.message) {
          const existing = await AsyncStorage.getItem("checkout_session_id");
          if (existing) {
            await AsyncStorage.removeItem("checkout_session_id");
          }
        }
      } catch (err) {
        console.warn("Checkout session handling error", err);
      }
    })();
  }, [checkout.checkout_session_id, checkout.message, navigation]);

  const handleCheckout = async () => {
    if (!selectedItems?.length) {
      Alert.alert(
        t("cart.noProductsSelected"),
        t("cart.selectOneToCheckout"),
      );
      return;
    }

    const selectedProducts = cartItems.filter((item) =>
      selectedItems.includes(item.id),
    );

    const unavailableSelectedItems = selectedProducts.filter(
      (item) => item.in_stock === 0 || item.status === false,
    );

    if (unavailableSelectedItems.length) {
      Alert.alert(
        t("cart.productUnavailable"),
        t("cart.someUnavailable"),
      );
      return;
    }

    const selected_product_ids = selectedProducts.map((item) => item.id);
    const sessionId = `cs_${uuidv4()}`;

    try {
      Toast.show({ type: "info", text1: t("cart.itemsReserved") });
      const result = await dispatch(
        checkoutHold({ selected_product_ids, checkout_session_id: sessionId }),
      ).unwrap();

      // Prefer session id returned by the thunk, fallback to generated id
      const checkoutSessionId = result?.checkout_session_id || sessionId;
      try {
        await AsyncStorage.setItem("checkout_session_id", checkoutSessionId);
      } catch (e) {
        console.warn("Failed to persist checkout_session_id", e);
      }

      navigation.navigate("Payment");
    } catch (err) {
      Toast.show({
        type: "error",
        text1: t("cart.paymentFailed"),
        text2: err?.toString() || t("cart.unableCreateSession"),
      });
    }
  };

  const CartItem = React.memo(({ item }) => {
    const itemIsUpdating = isUpdating[item.id];
    const isSelected = selectedItems.includes(item.id);
    const isOutOfStock = item.in_stock === 0;
    const isDiscontinued = item.status === false;
    const isUnavailable = isOutOfStock || isDiscontinued;
    const isNearExpiry = item.isNearExpiry;
    const isExpired = item.expired;
    const originalPrice = item.originalPrice;

    return (
      <View style={[styles.cartItem, isUnavailable && styles.unavailableItem]}>
        {/* Selection Checkbox - disabled nếu hết hàng hoặc ngừng bán */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleItemSelection(item.id)}
          disabled={itemIsUpdating || isUnavailable}
        >
          <View
            style={[
              styles.checkbox,
              isSelected && !isUnavailable && styles.checkboxSelected,
              (itemIsUpdating || isUnavailable) && styles.checkboxDisabled,
            ]}
          >
            {isSelected && !isUnavailable && (
              <Icon name="check" size={16} color="#ffffff" />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={[styles.itemImage, isUnavailable && styles.unavailableImage]}
            resizeMode="contain"
          />
          {/* Overlay cho hình ảnh khi hết hàng */}
          {isUnavailable && (
            <View style={styles.imageOverlay}>
              <Text style={styles.overlayText}>
                {isOutOfStock ? t("cart.outOfStock") : t("cart.soldOut")}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <View style={styles.itemNameContainer}>
              <Text
                style={[
                  styles.itemName,
                  !isSelected && styles.itemNameUnselected,
                  isUnavailable && styles.unavailableText,
                ]}
              >
                {item.name}
              </Text>
              {/* Status badges */}
              {isOutOfStock && (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{t("cart.outOfStock")}</Text>
                </View>
              )}
              {isDiscontinued && (
                <View style={[styles.statusBadge, styles.discontinuedBadge]}>
                  <Text style={styles.statusBadgeText}>{t("cart.soldOut")}</Text>
                </View>
              )}

              {isNearExpiry && !isUnavailable && (
                <View style={[styles.statusBadge, styles.nearExpiryBadge]}>
                  <Text style={styles.statusBadgeText}>{t("cart.nearExpiry")}</Text>
                </View>
              )}

              {isExpired && (
                <View style={[styles.statusBadge, styles.expiredBadge]}>
                  <Text style={styles.statusBadgeText}>{t("cart.expired")}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => showRemoveConfirmation(item.id)}
              disabled={itemIsUpdating}
              style={styles.deleteButton}
            >
              <Icon
                name="delete-outline"
                size={20}
                color={itemIsUpdating ? "#d1d5db" : "#ef4444"}
              />
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.itemSpecs, isUnavailable && styles.unavailableText]}
          >
            {item.size ? `Size: ${item.size}` : ""}
            {item.size && item.in_stock !== undefined ? " | " : ""}
              {item.in_stock !== undefined
              ? t("cart.stockQuantity", { count: item.in_stock })
              : ""}
          </Text>

          <View style={styles.itemFooter}>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={[
                  styles.itemPrice,
                  !isSelected && styles.itemPriceUnselected,
                  isUnavailable && styles.unavailableText,
                ]}
              >
                {formatCurrency(item.price)}
              </Text>

              {originalPrice && originalPrice > item.price && (
                <Text style={styles.originalPriceText}>
                  {formatCurrency(originalPrice)}
                </Text>
              )}
            </View>

            {/* Quantity controls - disabled nếu hết hàng hoặc ngừng bán */}
            <View
              style={[
                styles.quantityContainer,
                isUnavailable && styles.disabledQuantityContainer,
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  (itemIsUpdating || isUnavailable) && styles.disabledButton,
                ]}
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={itemIsUpdating || isUnavailable}
              >
                <Icon
                  name="remove"
                  size={16}
                  color={
                    itemIsUpdating || isUnavailable ? "#d1d5db" : "#6b7280"
                  }
                />
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.quantityInput,
                  (itemIsUpdating || isUnavailable) && styles.disabledInput,
                ]}
                value={
                  typeof editingQuantity[item.id] === "string"
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
                  (itemIsUpdating || isUnavailable) && styles.disabledButton,
                ]}
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={itemIsUpdating || isUnavailable}
              >
                <Icon
                  name="add"
                  size={16}
                  color={
                    itemIsUpdating || isUnavailable ? "#d1d5db" : "#6b7280"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {item.warning ? (
            <Text style={styles.itemWarningText}>{item.warning}</Text>
          ) : null}

          {itemIsUpdating && (
            <Text style={styles.updatingText}>
              {t("cart.updating")}
            </Text>
          )}

          {isUnavailable && (
            <Text style={styles.unavailableWarning}>
              {isOutOfStock
                ? t("cart.outOfStockWarning")
                : t("cart.discontinuedWarning")}
            </Text>
          )}
        </View>
      </View>
    );
  });
  // Show loading state
  if (isLoading && cartItems.length === 0 && checkout.loading) {
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
                onPress={() => navigation.navigate("HomePage")}
              >
                <Icon name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t("cart.shoppingCart")}</Text>
              <View style={styles.headerSpacer} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <InlineLoading
          text={t("cart.loadingCart")}
          style={styles.loadingContainer}
        />
        {/* <BottomNavigation /> */}
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
              <Text style={styles.headerTitle}>{t("cart.shoppingCart")}</Text>
              <View style={styles.headerSpacer} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t("cart.errorLoading", { error })}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => dispatch(fetchCartByUser())}
          >
            <Text style={styles.retryButtonText}>{t("cart.retry")}</Text>
          </TouchableOpacity>
        </View>
        {/* <BottomNavigation /> */}
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
              {t("cart.shoppingCart")} ({cart?.item_count || cartItems.length})
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
              <View
                style={[styles.checkbox, selectAll && styles.checkboxSelected]}
              >
                {selectAll && <Icon name="check" size={16} color="#ffffff" />}
              </View>
              <Text style={styles.selectAllText}>
                {t("cart.selectAll", { selected: selectedItems.length, total: cartItems.length })}
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
                {index < cartItems.length - 1 && (
                  <View style={styles.itemDivider} />
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCartContainer}>
            <Icon name="shopping-cart" size={64} color="#d1d5db" />
            <Text style={styles.emptyCartText}>
              {t("cart.empty")}
            </Text>
            <Text style={styles.emptyCartSubtext}>
              {t("cart.emptySubtext")}
            </Text>
            <TouchableOpacity
              style={styles.continueShoppingButton}
              onPress={() => navigation.navigate("AllProducts")}
            >
              <Text style={styles.continueShoppingText}>{t("cart.continueShopping")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Order Summary - Only show for selected items */}
        {selectedItems.length > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>
                {t("cart.orderSummary", { count: selectedItems.length })}
              </Text>
              {cartItems.length > 1 && (
                <TouchableOpacity
                  onPress={clearCart}
                  disabled={isLoading}
                  style={styles.clearAllButton}
                >
                  <Text style={styles.clearAllText}>{t("cart.deleteAll")}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t("cart.estimate")}</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(subtotal)}
                </Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>{t("cart.total")}</Text>
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
              (isLoading || selectedItems.length === 0) &&
                styles.disabledButton,
            ]}
            onPress={handleCheckout}
            disabled={isLoading || selectedItems.length === 0}
          >
            <Text style={styles.checkoutButtonText}>
              {isLoading
                ? t("cart.updating")
                : selectedItems.length === 0
                  ? t("cart.selectProductsToPay")
                  : t("cart.proceedPayment", { count: selectedItems.length })}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {/* <BottomNavigation /> */}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerSpacer: {
    width: 44,
    height: 44,
    // Invisible spacer for header balance
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
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
    paddingBottom: 180, 
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text.primary,
    textAlign: "center",
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
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledInput: {
    opacity: 0.6,
    backgroundColor: "#f3f4f6",
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyCartText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
    marginTop: 16,
  },
  emptyCartSubtext: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  continueShoppingButton: {
    backgroundColor: "#0d364c",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueShoppingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  cartItemsContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cartItem: {
    flexDirection: "row",
    padding: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0d364c",
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  itemSpecs: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0d364c",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
  },
  quantityButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityInput: {
    width: 32,
    height: 28,
    textAlign: "center",
    fontSize: 14,
    color: "#0d364c",
    fontWeight: "500",
    borderWidth: 0,
    padding: 0,
    margin: 0,
    backgroundColor: "transparent",
  },
  updatingText: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 4,
    textAlign: "right",
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 16,
  },
  summaryContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#0d364c",
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  clearAllText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "500",
  },
  summaryContent: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: "#6b7280",
    fontSize: 14,
  },
  summaryValue: {
    color: "#0d364c",
    fontSize: 14,
  },
  totalDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 8,
  },
  totalRow: {
    marginBottom: 0,
  },
  totalLabel: {
    fontWeight: "500",
    color: "#0d364c",
    fontSize: 16,
  },
  totalValue: {
    fontWeight: "500",
    color: "#0d364c",
    fontSize: 18,
  },
  checkoutContainer: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  checkoutButton: {
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#ffffff",
    fontWeight: "500",
    fontSize: 16,
  },
  // Select All Section Styles
  selectAllContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 3,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectAllText: {
    fontSize: 16,
    color: "#0d364c",
    marginLeft: 12,
    fontWeight: "500",
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
    borderColor: "#d1d5db",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  checkboxSelected: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  checkboxDisabled: {
    opacity: 0.5,
    backgroundColor: "#f3f4f6",
  },

  // Unselected Item Styles
  itemNameUnselected: {
    opacity: 0.6,
    color: "#9ca3af",
  },
  itemPriceUnselected: {
    opacity: 0.6,
    color: "#9ca3af",
  },
  unavailableItem: {
    opacity: 0.7,
    backgroundColor: "#fafafa",
  },

  unavailableText: {
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },

  unavailableImage: {
    opacity: 0.5,
  },

  imageContainer: {
    position: "relative",
  },

  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },

  overlayText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },

  itemNameContainer: {
    flex: 1,
    marginRight: 8,
  },

  statusBadge: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },

  discontinuedBadge: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#ef4444",
    textTransform: "uppercase",
  },

  nearExpiryBadge: {
    backgroundColor: "#fff7ed",
    borderColor: "#fcd34d",
  },

  expiredBadge: {
    backgroundColor: "#fff1f2",
    borderColor: "#fb7185",
  },

  originalPriceText: {
    fontSize: 12,
    color: "#9ca3af",
    textDecorationLine: "line-through",
    marginTop: 2,
  },

  itemWarningText: {
    fontSize: 12,
    color: "#b45309",
    backgroundColor: "#fffbeb",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },

  disabledQuantityContainer: {
    opacity: 0.4,
    backgroundColor: "#f9fafb",
  },

  unavailableWarning: {
    fontSize: 12,
    color: "#ef4444",
    fontStyle: "italic",
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#fef2f2",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
});

export default CartScreen;
