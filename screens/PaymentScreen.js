import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  StatusBar,
} from "react-native";
import { MaterialIcons as Icon, Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { fetchCartByUser } from "../store/slices/cartSlice";
import { Picker } from "@react-native-picker/picker";
import * as Linking from "expo-linking";
import {
  createOrder,
  clearOrderState,
} from "../store/slices/orderSlice"; // Adjust path as needed
import { fetchUserProfile } from "../store/slices/userSlice";
import { OverlayLoading, MinimalLoading } from "../components/Loading";
import { formatCurrency } from "../utils/formatCurrency";
import Toast from "react-native-toast-message";
import { checkoutCancel } from "../store/slices/checkoutSlice";
import {
  getValidVouchers,
  validateVoucherCode,
} from "../services/voucherService";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants/colors";
const PaymentScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [selectedPayment, setSelectedPayment] = useState("COD");
  const [showEditModal, setShowEditModal] = useState(false);
  const [receiverInfo, setReceiverInfo] = useState({
    receiver_name: "",
    receiver_phone: "",
    receiver_address: "",
    note: "",
    ward: "",
  });

  // Temporary state for editing
  const [tempReceiverInfo, setTempReceiverInfo] = useState(receiverInfo);
  // Address helpers
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [icity, setIcity] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Voucher / discount (theo flow web)
  const [validDiscounts, setValidDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [appliedByManualCode, setAppliedByManualCode] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Clear field error when user starts typing
  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  console.log("receiverInfo",receiverInfo)
  // Validate field on blur
  const validateField = (fieldName, value) => {
    let error = null;
    switch (fieldName) {
      case "receiver_name":
        error = validateName(value);
        break;
      case "receiver_phone":
        error = validatePhone(value);
        break;
      case "receiver_address":
        error = validateAddress(value);
        break;
      default:
        break;
    }

    if (error) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: error }));
    } else {
      clearFieldError(fieldName);
    }
  };

  // Redux state
  const {
    isLoading,
    createSuccess,
    newOrderId,
    error,
    order_id,
    payment_url,
  } = useSelector((state) => state.order);
  const profile = useSelector((state) => state.user?.user || null);
  const checkout = useSelector((state) => state.checkout || {});
  const cart = useSelector((state) => state.cart || {});
  // Get data from navigation params or use default values
  const cartItems =
    checkout.items && checkout.items.length > 0
      ? checkout.items
      : cart.items || [];
  const selectedItems = cartItems;

  // Compute subtotal, shipping, and total (same logic as web)
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0,
  );
  const total = subtotal;

  const discountData =
    validationResult?.discountAmount != null && validationResult?.finalAmount != null
      ? { discountAmount: validationResult.discountAmount, finalAmount: validationResult.finalAmount }
      : selectedDiscount?.discountAmount != null && selectedDiscount?.finalAmount != null
        ? { discountAmount: selectedDiscount.discountAmount, finalAmount: selectedDiscount.finalAmount }
        : null;
  const discountAmount = discountData?.discountAmount ?? 0;
  const finalAmount = discountData?.finalAmount ?? total;

  const paymentMethods = [
    {
      id: "COD",
      title: t("payment.paymentUponDelivery"),
      subtitle: t("payment.paymentUponReceive"),
      icon: "cash-outline",
      available: true,
    },
    {
      id: "VNPAY",
      title: t("payment.vnpayTitle"),
      subtitle: t("payment.vnpaySubtitle"),
      icon: "card-outline",
      available: true,
    },
  ];


  // Handle order creation error
  useEffect(() => {
    if (error) {
      Alert.alert(t("payment.orderFailed"), error, [
        {
          text: t("common.retry"),
          onPress: () => dispatch(clearOrderState()),
        },
      ]);
    }
  }, [error, dispatch]);

  // Load profile on mount
  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  // Auto-fill receiverInfo from profile when available and fields are empty
  useEffect(() => {
    if (!profile) return;
    const hasReceiverData = !!(
      receiverInfo.receiver_name || receiverInfo.receiver_phone || receiverInfo.receiver_address
    );
    if (hasReceiverData) return; // don't overwrite if user already edited

    const name = profile.fullName || profile.user_name || "";
    const phone = profile.phone || "";
    const address = profile.address || "";

    const newReceiver = {
      ...receiverInfo,
      receiver_name: name,
      receiver_phone: phone,
      receiver_address: address,
    };
    setReceiverInfo(newReceiver);
    setTempReceiverInfo((prev) => ({ ...prev, ...newReceiver }));
  }, [profile]);

  // Load provinces on mount
  useEffect(() => {
    axios
      .get("https://provinces.open-api.vn/api/v2/p/")
      .then((res) => setProvinces(res.data))
      .catch((err) => console.error("Error loading provinces:", err));
  }, []);

  // Load wards when province changes (tempReceiverInfo.province_code)
  useEffect(() => {
    if (!tempReceiverInfo.province_code) {
      setWards([]);
      setTempReceiverInfo((prev) => ({ ...prev, ward: "" }));
      return;
    }

    axios
      .get("https://provinces.open-api.vn/api/v2/w/")
      .then((res) => {
        const filtered = res.data.filter(
          (ward) =>
            ward.province_code === Number(tempReceiverInfo.province_code),
        );
        setWards(filtered);
      })
      .catch((err) => console.error(err));
  }, [tempReceiverInfo.province_code]);

  // Update icity (province name) whenever province_code changes
  useEffect(() => {
    if (tempReceiverInfo.province_code) {
      const p = provinces.find(
        (pr) => pr.code === Number(tempReceiverInfo.province_code),
      );
      setIcity(p ? p.name : "");
    } else {
      setIcity("");
    }
  }, [tempReceiverInfo.province_code, provinces]);

  // Ensure there's an active checkout session (created by checkoutHold)
  const [checkoutSessionId, setCheckoutSessionId] = useState(null);


  const handleCancel = async () => {
    try {
      const sessionId =
        checkoutSessionId ||
        (await AsyncStorage.getItem("checkout_session_id"));
      if (!sessionId) {
        Alert.alert(t("common.error"), t("payment.noSession"));
        return;
      }

      Alert.alert(t("common.confirm"), t("payment.confirmCancel"), [
        { text: t("payment.no"), style: "cancel" },
        {
          text: t("payment.yes"),
          onPress: async () => {
            try {
              // Remove local session immediately to avoid race where Cart reads it and redirects
              await AsyncStorage.removeItem("checkout_session_id");
              setCheckoutSessionId(null);
              // dispatch expects an object payload { checkout_session_id }
              const result = await dispatch(
                checkoutCancel({ checkout_session_id: sessionId }),
              );
              if (result && result.error) {
                Toast.show({
                  type: "error",
                  text1: t("payment.cancelFailed"),
                  text2: result.error.message || result.error,
                });
              } else {
                Toast.show({ type: "success", text1: t("payment.cancelled") });
                // Navigate back to cart after a short delay to allow UI updates
                setTimeout(() => navigation.navigate("Cart"), 300);
              }
            } catch (err) {
              console.error("Cancel checkout error", err);
              Toast.show({ type: "error", text1: t("payment.cancelFailed") });
            }
          },
        },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditAddress = () => {
    // Initialize with current receiver info or empty values
    const currentInfo = {
      receiver_name: receiverInfo.receiver_name || "",
      receiver_phone: receiverInfo.receiver_phone || "",
      receiver_address: receiverInfo.receiver_address || "",
      province_code: receiverInfo.province_code || null,
      ward: receiverInfo.ward || "",
      note: receiverInfo.note || "",
    };
    setTempReceiverInfo(currentInfo);
    setFieldErrors({}); // Clear any previous errors
    setShowEditModal(true);
  };

  // Validation functions
  const validateName = (name) => {
    const nameRegex =
      /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ\s]+$/;
    if (!name.trim()) {
      return t("payment.enterName");
    }
    if (!nameRegex.test(name.trim())) {
      return t("payment.nameNoNumbers");
    }
    return null;
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^0[0-9]{8,10}$/;
    if (!phone.trim()) {
      return t("payment.enterPhone");
    }
    if (!phoneRegex.test(phone.trim())) {
      return t("payment.phoneFormat");
    }
    return null;
  };

  const validateAddress = (address) => {
    const addressRegex =
      /^[a-zA-Z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ\s,./\-]+$/;
    if (!address.trim()) {
      return t("payment.enterAddress");
    }
    if (!addressRegex.test(address.trim())) {
      return t("payment.addressNoSpecial");
    }
    return null;
  };

  const handleSaveAddress = () => {
    // Validate all fields
    const nameError = validateName(tempReceiverInfo.receiver_name);
    if (nameError) {
      Alert.alert(t("common.error"), nameError);
      return;
    }

    const phoneError = validatePhone(tempReceiverInfo.receiver_phone);
    if (phoneError) {
      Alert.alert(t("common.error"), phoneError);
      return;
    }

    const addressError = validateAddress(tempReceiverInfo.receiver_address);
    if (addressError) {
      Alert.alert(t("common.error"), addressError);
      return;
    }

    // All validations passed
    const fullAddress =
      `${tempReceiverInfo.receiver_address}, ${tempReceiverInfo.ward || ""}${icity ? ", " + icity : ""}`
        .replace(/, ,/g, ",")
        .replace(/\s+,/g, ",")
        .trim();
    setReceiverInfo({
      ...tempReceiverInfo,
      receiver_address: fullAddress,
    });
    setFieldErrors({}); // Clear any errors
    setShowEditModal(false);
  };

  const handleCancelEdit = () => {
    setTempReceiverInfo(receiverInfo);
    setFieldErrors({}); // Clear any errors
    setShowEditModal(false);
  };

  const handlePlaceOrder = () => {
    if (!selectedPayment) {
      Alert.alert(
        t("payment.selectMethod"),
        t("payment.selectMethodSub"),
        [{ text: t("common.ok") }],
      );
      return;
    }

    // Validate required data
    // selected_product_ids may come from route params; if not, build from cartItems
    const selectedIds = cartItems.map(
      (item) =>
        // support multiple item shapes
        (item.product_id && item.product_id._id) ||
        item.product_id ||
        item.productId ||
        item._id,
    );

    if (!selectedIds || selectedIds.length === 0) {
      Alert.alert(
        t("payment.noProductsSelected"),
        t("payment.selectProductsFirst"),
        [{ text: t("common.ok") }],
      );
      return;
    }

    // Validate delivery information
    const nameError = validateName(receiverInfo.receiver_name);
    if (nameError) {
      Alert.alert(
        t("payment.deliveryError"),
        nameError + "\n\n" + t("payment.correctShipping"),
      );
      return;
    }

    const phoneError = validatePhone(receiverInfo.receiver_phone);
    if (phoneError) {
      Alert.alert(
        t("payment.deliveryError"),
        phoneError + "\n\n" + t("payment.correctShipping"),
      );
      return;
    }

    const addressError = validateAddress(receiverInfo.receiver_address);
    if (addressError) {
      Alert.alert(
        t("payment.deliveryError"),
        addressError + "\n\n" + t("payment.correctShipping"),
      );
      return;
    }

    const methodTitle = paymentMethods.find((m) => m.id === selectedPayment)?.title || selectedPayment;
    const totalStr = formatCurrency(finalAmount) + (discountAmount > 0 ? ` (${t("payment.decreasedBy")} ${formatCurrency(discountAmount)})` : "");
    const confirmMsg = t("payment.confirmOrdersMessage", {
      method: methodTitle,
      total: totalStr,
      address: receiverInfo.receiver_address,
    });
    Alert.alert(
      t("payment.confirmOrders"),
      confirmMsg,
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.confirm"),
          style: "default",
          onPress: () => {
                dispatch(
              createOrder({
                selected_product_ids: selectedIds,
                receiverInfo,
                payment_method: selectedPayment,
                discount_id: selectedDiscount?.discountId || null,
              }),
            );
          },
        },
      ],
    );
  };

  // When order created or redirect url present -> clear checkout session and refresh cart
  useEffect(() => {
    if (order_id || payment_url) {
      AsyncStorage.removeItem("checkout_session_id").catch(() => {});
      dispatch(fetchCartByUser());
    }
  }, [order_id, payment_url, dispatch]);

  // If payment gateway returned a redirect URL (VNPAY), open it
  useEffect(() => {
    if (payment_url) {
      Linking.openURL(payment_url).catch((err) =>
        console.error("Failed to open payment url", err),
      );
    }
  }, [payment_url]);



  // Load mã giảm giá phù hợp đơn hàng (minOrderValue <= total)
  useEffect(() => {
    if (total > 0) {
      setDiscountLoading(true);
      getValidVouchers(total)
        .then((data) => setValidDiscounts(Array.isArray(data) ? data : []))
        .catch(() => setValidDiscounts([]))
        .finally(() => setDiscountLoading(false));
    } else {
      setValidDiscounts([]);
    }
  }, [total]);

  const handleSelectVoucher = (voucher) => {
    if (!voucher) {
      setSelectedDiscount(null);
      setValidationResult(null);
      setValidationError(null);
      setAppliedByManualCode(false);
      return;
    }
    setManualCode(""); // Chọn từ gợi ý thì không nhập mã nữa
    setAppliedByManualCode(false);
    setValidationError(null);
    setSelectedDiscount({
      discountId: voucher._id,
      code: voucher.code,
      discountPercent: voucher.discountPercent,
      minOrderValue: voucher.minOrderValue,
      maxDiscountAmount: voucher.maxDiscountAmount,
      endDate: voucher.endDate,
      description: voucher.description,
    });
    setDiscountLoading(true);
    validateVoucherCode({ code: voucher.code, orderValue: total })
      .then((data) => {
        setValidationResult({
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
        });
        setSelectedDiscount((prev) =>
          prev
            ? {
                ...prev,
                discountAmount: data.discountAmount,
                finalAmount: data.finalAmount,
              }
            : null,
        );
      })
      .catch((err) => {
        setValidationError(err.message || "Invalid discount code");
        setSelectedDiscount(null);
        setValidationResult(null);
      })
      .finally(() => setDiscountLoading(false));
  };

  const handleRemoveVoucher = () => {
    setSelectedDiscount(null);
    setValidationResult(null);
    setValidationError(null);
    setManualCode("");
    setAppliedByManualCode(false);
  };

  const handleApplyManualCode = () => {
    const code = manualCode.trim();
    if (!code || total < 1) return;
    setValidationError(null);
    setDiscountLoading(true);
    validateVoucherCode({ code, orderValue: total })
      .then((data) => {
        setValidationResult({
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
        });
        setSelectedDiscount({
          discountId: data.discountId,
          code: data.code || code,
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
        });
        setManualCode("");
        setAppliedByManualCode(true);
      })
      .catch((err) => {
        setValidationError(err.message || "Invalid discount code");
      })
      .finally(() => setDiscountLoading(false));
  };

  const renderEditAddressModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancelEdit}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={handleCancelEdit}
            style={styles.modalHeaderButton}
          >
            <Icon name="close" size={24} color="#0d364c" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit delivery information</Text>
          <TouchableOpacity
            onPress={handleSaveAddress}
            style={styles.modalHeaderButton}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Receiver Name */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Recipient's name *</Text>
            <TextInput
              style={[
                styles.textInput,
                fieldErrors.receiver_name && styles.textInputError,
              ]}
              value={tempReceiverInfo.receiver_name}
              onChangeText={(text) => {
                setTempReceiverInfo((prev) => ({
                  ...prev,
                  receiver_name: text,
                }));
                clearFieldError("receiver_name");
              }}
              onBlur={() =>
                validateField("receiver_name", tempReceiverInfo.receiver_name)
              }
              placeholder="Enter the recipient's name"
              placeholderTextColor="#9ca3af"
            />
            {fieldErrors.receiver_name && (
              <Text style={styles.errorText}>{fieldErrors.receiver_name}</Text>
            )}
          </View>

          {/* Phone Number */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Phone number *</Text>
            <TextInput
              style={[
                styles.textInput,
                fieldErrors.receiver_phone && styles.textInputError,
              ]}
              value={tempReceiverInfo.receiver_phone}
              onChangeText={(text) => {
                // Only allow numbers
                const numericText = text.replace(/[^0-9]/g, "");
                setTempReceiverInfo((prev) => ({
                  ...prev,
                  receiver_phone: numericText,
                }));
                clearFieldError("receiver_phone");
              }}
              onBlur={() =>
                validateField("receiver_phone", tempReceiverInfo.receiver_phone)
              }
              placeholder="Enter phone number"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              maxLength={10}
            />
            {fieldErrors.receiver_phone && (
              <Text style={styles.errorText}>{fieldErrors.receiver_phone}</Text>
            )}
          </View>

          {/* Address */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Delivery address *</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textAreaInput,
                fieldErrors.receiver_address && styles.textInputError,
              ]}
              value={tempReceiverInfo.receiver_address}
              onChangeText={(text) => {
                setTempReceiverInfo((prev) => ({
                  ...prev,
                  receiver_address: text,
                }));
                clearFieldError("receiver_address");
              }}
              onBlur={() =>
                validateField(
                  "receiver_address",
                  tempReceiverInfo.receiver_address,
                )
              }
              placeholder="Enter the full delivery address."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {fieldErrors.receiver_address && (
              <Text style={styles.errorText}>
                {fieldErrors.receiver_address}
              </Text>
            )}
          </View>

          {/* Province / Ward */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Province/City *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={tempReceiverInfo.province_code}
                onValueChange={(val) =>
                  setTempReceiverInfo((prev) => ({
                    ...prev,
                    province_code: val,
                  }))
                }
              >
                <Picker.Item label="Select province/city" value={null} />
                {provinces.map((p) => (
                  <Picker.Item key={p.code} label={p.name} value={p.code} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Ward/Commune *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={tempReceiverInfo.ward}
                enabled={!!tempReceiverInfo.province_code}
                onValueChange={(val) =>
                  setTempReceiverInfo((prev) => ({ ...prev, ward: val }))
                }
              >
                <Picker.Item label="Select ward/commune" value={""} />
                {wards.map((w) => (
                  <Picker.Item key={w.code} label={w.name} value={w.name} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Note */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Order notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={tempReceiverInfo.note}
              onChangeText={(text) =>
                setTempReceiverInfo((prev) => ({
                  ...prev,
                  note: text,
                }))
              }
              placeholder="Additional special instructions for delivery..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Icon name="info-outline" size={16} color="#6b7280" />
            <Text style={styles.infoNoteText}>
              Please ensure the shipping information is accurate to avoid shipping problems.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading Overlay */}
      {/* <OverlayLoading text="Đang tải đơn hàng của bạn..." visible={isLoading} /> */}

      {/* Header */}
      <LinearGradient
        colors={COLORS.gradient.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.headerButton} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="receipt" size={20} color="#0d364c" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimate</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(subtotal)}
              </Text>
            </View>
            
            {selectedDiscount && discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Discount ({selectedDiscount.code})
                </Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  - {formatCurrency(discountAmount)}
                </Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(finalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Mã giảm giá — gợi ý + nhập tay + áp dụng */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="local-offer" size={20} color="#0d364c" />
            <Text style={styles.sectionTitle}>Discount code</Text>
            {selectedDiscount && (
              <TouchableOpacity
                style={styles.changeButton}
                onPress={handleRemoveVoucher}
              >
                <Text style={styles.removeVoucherText}>Remove code</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.voucherInputRow}>
              <TextInput
                style={[
                  styles.voucherInput,
                  (selectedDiscount || appliedByManualCode) && styles.voucherInputDisabled,
                ]}
                value={manualCode}
                onChangeText={(t) => setManualCode(t.toUpperCase())}
                placeholder="Enter the code (e.g., YOURVOUCHER)"
                placeholderTextColor="#9ca3af"
                editable={!selectedDiscount}
              />
              <TouchableOpacity
                style={[
                  styles.applyVoucherBtn,
                  (discountLoading ||
                    !manualCode.trim() ||
                    total < 1 ||
                    (!!selectedDiscount && !appliedByManualCode)) &&
                    styles.applyVoucherBtnDisabled,
                ]}
                onPress={handleApplyManualCode}
                disabled={
                  discountLoading ||
                  !manualCode.trim() ||
                  total < 1 ||
                  (!!selectedDiscount && !appliedByManualCode)
                }
              >
                <Text style={styles.applyVoucherBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
            {selectedDiscount && !appliedByManualCode ? (
              <Text style={styles.voucherNote}>
                A code has been selected from the suggestions. Click "Remove code" if you want to enter a different code.
              </Text>
            ) : null}
            {validationError ? (
              <Text style={styles.voucherError}>{validationError}</Text>
            ) : null}
            <Text style={styles.voucherSuggestLabel}>
              Suggest a suitable code for your order.
            </Text>
            {appliedByManualCode ? (
              <Text style={styles.voucherNote}>
              You have manually entered the code. Click "Remove code" to choose a suggested code. Only one code can be used per order.
              </Text>
            ) : discountLoading && validDiscounts.length === 0 ? (
              <View style={styles.voucherLoadingWrap}>
                <MinimalLoading size="small" color="#0d364c" />
              </View>
            ) : !validDiscounts.length ? (
              <Text style={styles.voucherEmpty}>
                {total < 1
                  ? "Add products to see discount codes."
                  : "There is no code hint. You can still enter the code above."}
              </Text>
            ) : (
              <ScrollView
                style={[
                  styles.voucherListWrap,
                  appliedByManualCode && styles.voucherListDisabled,
                ]}
                contentContainerStyle={styles.voucherListContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {validDiscounts.map((v) => {
                  const isSelected =
                    selectedDiscount?.discountId === v._id;
                  return (
                    <TouchableOpacity
                      key={v._id}
                      style={[
                        styles.voucherSuggestionCard,
                        isSelected && styles.voucherSuggestionCardSelected,
                      ]}
                      onPress={() =>
                        appliedByManualCode
                          ? undefined
                          : handleSelectVoucher(isSelected ? null : v)
                      }
                      disabled={appliedByManualCode}
                    >
                      <View style={styles.voucherSuggestionLeft}>
                        <Text style={styles.voucherSuggestionCode}>
                          {v.code}
                        </Text>
                        <Text style={styles.voucherSuggestionMeta}>
                          Maximum {formatCurrency(v.maxDiscountAmount)} · Minimum Order {formatCurrency(v.minOrderValue)}
                        </Text>
                      </View>
                      <View style={styles.voucherSuggestionRight}>
                        {isSelected ? (
                          <Icon
                            name="check-circle"
                            size={22}
                            color="#059669"
                          />
                        ) : (
                          <Text style={styles.voucherApplyLabel}>Apply</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            {selectedDiscount && discountData && (
              <View style={styles.discountSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Estimated (original)</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(total)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.discountLabel}>
                    Reduce ({selectedDiscount.code})
                  </Text>
                  <Text style={styles.discountValue}>
                    - {formatCurrency(discountAmount)}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Pay</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(finalAmount)}
                  </Text>
                </View>
              </View>
            )}

          </View>
        </View>

        {/* Selected Items Summary */}
        {selectedItems && selectedItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="shopping-cart" size={20} color="#0d364c" />
              <Text style={styles.sectionTitle}>
                Product ({selectedItems.length})
              </Text>
            </View>
            <View style={styles.sectionContent}>
              {selectedItems.slice(0, 3).map((item, index) => {
                const key =
                  item.id ??
                  item._id ??
                  (typeof item.product_id === "string"
                    ? item.product_id
                    : item.product_id && item.product_id._id) ??
                  index;
                return (
                  <View key={key} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </View>
                );
              })}
              {selectedItems.length > 3 && (
                <Text style={styles.moreItemsText}>
                  {t('payment.moreProducts', { count: selectedItems.length - 3 })}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="location-on" size={20} color="#0d364c" />
            <Text style={styles.sectionTitle}>Delivery address</Text>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={handleEditAddress}
            >
              <Text style={styles.changeButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressTypeContainer}>
                  {/* <Icon name="home" size={16} color="#0d364c" /> */}
                  <Text style={styles.addressType}></Text>
                </View>
              </View>
              {receiverInfo.receiver_name &&
              receiverInfo.receiver_address &&
              receiverInfo.receiver_phone ? (
                <>
                  <Text style={styles.addressText}>
                    {receiverInfo.receiver_name}
                    {"\n"}
                    {receiverInfo.receiver_address}
                  </Text>
                  <Text style={styles.phoneText}>
                    {receiverInfo.receiver_phone}
                  </Text>
                </>
              ) : (
                <Text style={styles.emptyAddressText}>
                Please edit to add delivery information.
                </Text>
              )}
              {receiverInfo.note && (
                <View style={styles.noteContainer}>
                  <Icon name="note" size={14} color="#6b7280" />
                  <Text style={styles.notePreview}>
                  Note: {receiverInfo.note}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="payment" size={20} color="#0d364c" />
            <Text style={styles.sectionTitle}>Payment methods</Text>
          </View>
          <View style={styles.sectionContent}>
            {paymentMethods.map((method, index) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  selectedPayment === method.id && styles.selectedPaymentOption,
                  !method.available && styles.disabledPaymentOption,
                  index < paymentMethods.length - 1 &&
                    styles.paymentOptionBorder,
                ]}
                onPress={() =>
                  method.available && setSelectedPayment(method.id)
                }
                disabled={!method.available}
              >
                <View style={styles.paymentLeft}>
                  <View
                    style={[
                      styles.radioButton,
                      selectedPayment === method.id &&
                        styles.radioButtonSelected,
                      !method.available && styles.radioButtonDisabled,
                    ]}
                  >
                    {selectedPayment === method.id && (
                      <View style={styles.radioSelected} />
                    )}
                  </View>
                  <View style={styles.paymentIconContainer}>
                    <Ionicons
                      name={method.icon}
                      size={24}
                      color={method.available ? "#0d364c" : "#d1d5db"}
                    />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text
                      style={[
                        styles.paymentTitle,
                        !method.available && styles.disabledText,
                      ]}
                    >
                      {method.title}
                    </Text>
                    <Text
                      style={[
                        styles.paymentSubtitle,
                        !method.available && styles.disabledText,
                      ]}
                    >
                      {method.subtitle}
                    </Text>
                  </View>
                </View>
                {!method.available && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Coming soon</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="note" size={20} color="#0d364c" />
            <Text style={styles.sectionTitle}>Order notes</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.noteCard}>
              <Icon name="info-outline" size={16} color="#6b7280" />
              <Text style={styles.noteText}>
                Your order will be carefully packaged and delivered within 2-3 business days. Payment will be collected upon delivery.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.placeOrderContainer}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!selectedPayment || isLoading) && styles.disabledButton,
          ]}
          onPress={handlePlaceOrder}
          disabled={!selectedPayment || isLoading}
        >
          <View style={styles.placeOrderContent}>
            {isLoading ? (
              <MinimalLoading size="small" color="#ffffff" />
            ) : (
              <Icon name="shopping-bag" size={20} color="#ffffff" />
            )}
            <Text style={styles.placeOrderButtonText}>
              {isLoading
                ? "Processing..."
                : `Order • ${formatCurrency(finalAmount)}`}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelCheckoutButton]}
          onPress={handleCancel}
        >
          <Text style={styles.cancelCheckoutButtonText}>Cancel payment</Text>
        </TouchableOpacity>
        {checkoutSessionId && (
          <TouchableOpacity
            style={[styles.cancelCheckoutButton]}
            onPress={handleCancel}
          >
            <Text style={styles.cancelCheckoutButtonText}>Cancel payment</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Edit Address Modal */}
      {renderEditAddressModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  headerGradient: {
    paddingTop: StatusBar.currentHeight + 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: "rgba(13, 54, 76, 0.15)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 150,
  },
  loadingText: {
    marginTop: 12,
    color: "#0d364c",
    fontSize: 16,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop:25,
    
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop:25,
  },
  content: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0d364c",
    marginLeft: 8,
    flex: 1,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f0fdfd",
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  changeButtonText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "500",
  },
  sectionContent: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    color: "#6b7280",
    fontSize: 14,
    flexShrink: 0,
  },
  summaryValue: {
    color: "#0d364c",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  freeShipping: {
    color: "#10b981",
    fontWeight: "600",
  },
  totalDivider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 12,
  },
  totalRow: {
    marginBottom: 0,
  },
  totalLabel: {
    fontWeight: "600",
    color: "#0d364c",
    fontSize: 16,
    flexShrink: 0,
  },
  totalValue: {
    fontWeight: "700",
    color: "#0d364c",
    fontSize: 20,
    marginLeft: 8,
  },
  discountValue: {
    color: "#059669",
    fontWeight: "600",
  },
  removeVoucherText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
  },
  voucherInputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  voucherInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0d364c",
  },
  voucherInputDisabled: {
    backgroundColor: "#f3f4f6",
    color: "#9ca3af",
  },
  applyVoucherBtn: {
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
  },
  applyVoucherBtnDisabled: {
    backgroundColor: "#9ca3af",
    opacity: 0.7,
  },
  applyVoucherBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  voucherError: {
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 8,
  },
  voucherSuggestLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  voucherNote: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  voucherLoadingWrap: {
    paddingVertical: 16,
    alignItems: "center",
  },
  voucherEmpty: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    paddingVertical: 12,
  },
  voucherListWrap: {
    maxHeight: 220,
    marginBottom: 0,
  },
  voucherListContent: {
    paddingBottom: 8,
  },
  voucherListDisabled: {
    opacity: 0.6,
  },
  voucherSuggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#f3f4f6",
    backgroundColor: "#fafafa",
  },
  voucherSuggestionCardSelected: {
    borderColor: "#059669",
    backgroundColor: "#ecfdf5",
  },
  voucherSuggestionLeft: { flex: 1 },
  voucherSuggestionCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 4,
  },
  voucherSuggestionMeta: {
    fontSize: 12,
    color: "#6b7280",
  },
  voucherSuggestionRight: {
    marginLeft: 8,
  },
  voucherApplyLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  discountSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  discountLabel: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "500",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    color: "#0d364c",
    fontSize: 14,
    fontWeight: "500",
  },
  itemQuantity: {
    color: "#6b7280",
    fontSize: 14,
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: "center",
  },
  itemPrice: {
    color: "#0d364c",
    fontSize: 14,
    fontWeight: "600",
    minWidth: 60,
    textAlign: "right",
  },
  moreItemsText: {
    color: "#6b7280",
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },
  addressCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addressTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressType: {
    fontWeight: "600",
    color: "#0d364c",
    marginLeft: 6,
  },
  defaultBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: "#1d4ed8",
    fontSize: 10,
    fontWeight: "500",
  },
  addressText: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  phoneText: {
    color: "#0d364c",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyAddressText: {
    color: "#9ca3af",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  notePreview: {
    color: "#6b7280",
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
    fontStyle: "italic",
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  paymentOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  selectedPaymentOption: {
    backgroundColor: "#f0fdfd",
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledPaymentOption: {
    opacity: 0.6,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: "#13c2c2",
  },
  radioButtonDisabled: {
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
  },
  paymentIconContainer: {
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontWeight: "600",
    color: "#0d364c",
    fontSize: 16,
    marginBottom: 2,
  },
  paymentSubtitle: {
    color: "#6b7280",
    fontSize: 12,
  },
  disabledText: {
    color: "#d1d5db",
  },
  comingSoonBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    color: "#d97706",
    fontSize: 10,
    fontWeight: "500",
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#22c55e",
  },
  noteText: {
    color: "#0f172a",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 32,
  },
  placeOrderContainer: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  placeOrderButton: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelCheckoutButton: {
    marginTop: 10,
    backgroundColor: "#fff7f7",
    borderWidth: 1,
    borderColor: "#fee2e2",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelCheckoutButtonText: {
    color: "#dc2626",
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#d1d5db",
    shadowOpacity: 0,
    elevation: 0,
  },
  placeOrderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  placeOrderButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
    marginTop: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalHeaderButton: {
    width: 50,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0d364c",
    flex: 1,
    textAlign: "center",
  },
  saveButtonText: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0d364c",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0d364c",
    backgroundColor: "#ffffff",
  },
  textInputError: {
    borderColor: "#ef4444",
    borderWidth: 2,
  },
  textAreaInput: {
    height: 80,
    paddingTop: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#0ea5e9",
    marginTop: 20,
  },
  infoNoteText: {
    color: "#0f172a",
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});
export default PaymentScreen;
