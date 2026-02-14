import React, { useState } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { createOrderAsync } from '../store/slices/orderSlice';
import { formatCurrency } from '../utils/formatCurrency';

const BuyNowScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const { product, quantity } = route.params;
    const [selectedPayment, setSelectedPayment] = useState('cod');
    const [receiverInfo, setReceiverInfo] = useState({
        receiver_name: '',
        receiver_phone: '',
        receiver_address: '',
    });

    const subtotal = product.price * quantity;
    const shipping = 0;
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    const handlePlaceOrder = async () => {
        if (!receiverInfo.receiver_name || !receiverInfo.receiver_phone || !receiverInfo.receiver_address) {
            Alert.alert('Error', 'Please fill in all delivery information');
            return;
        }

        try {
            await dispatch(createOrderAsync({
                selected_product_ids: [product._id],
                receiverInfo
            })).unwrap();

            Alert.alert(
                'Success',
                'Order placed successfully!',
                [{ text: 'OK', onPress: () => navigation.navigate('Profile') }]
            );
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to place order');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
            <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Buy Now</Text>
                <View style={styles.placeholder} />
            </LinearGradient>

            <ScrollView style={styles.content}>
                {/* Product Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Product Summary</Text>
                    <View style={styles.productCard}>
                        <Image source={{ uri: product.image }} style={styles.productImage} />
                        <View style={styles.productInfo}>
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                            <Text style={styles.quantity}>Quantity: {quantity}</Text>
                        </View>
                    </View>
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Shipping</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(shipping)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tax (10%)</Text>
                            <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Delivery Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Information</Text>
                    <View style={styles.formContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={receiverInfo.receiver_name}
                            onChangeText={(text) => setReceiverInfo(prev => ({ ...prev, receiver_name: text }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            keyboardType="phone-pad"
                            value={receiverInfo.receiver_phone}
                            onChangeText={(text) => setReceiverInfo(prev => ({ ...prev, receiver_phone: text }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Delivery Address"
                            multiline
                            value={receiverInfo.receiver_address}
                            onChangeText={(text) => setReceiverInfo(prev => ({ ...prev, receiver_address: text }))}
                        />
                    </View>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <View style={styles.sectionContent}>
                        <TouchableOpacity
                            style={[
                                styles.paymentOption,
                                selectedPayment === 'cod' && styles.selectedPaymentOption
                            ]}
                            onPress={() => setSelectedPayment('cod')}
                        >
                            <View style={styles.paymentLeft}>
                                <View style={styles.radioButton}>
                                    {selectedPayment === 'cod' && <View style={styles.radioSelected} />}
                                </View>
                                <View style={styles.paymentInfo}>
                                    <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                                    <Text style={styles.paymentSubtitle}>Pay when you receive your order</Text>
                                </View>
                            </View>
                            <Icon name="payments" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
                <Text style={styles.placeOrderText}>Place Order</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.white,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginBottom: 16,
        elevation: 2,
        shadowColor: COLORS.shadow.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text.primary,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.light,
    },
    productCard: {
        flexDirection: 'row',
        padding: 16,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text.primary,
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 4,
    },
    quantity: {
        fontSize: 14,
        color: COLORS.text.secondary,
    },
    formContainer: {
        padding: 16,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
        fontSize: 16,
        color: COLORS.text.primary,
    },
    summaryContainer: {
        padding: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: COLORS.text.secondary,
    },
    summaryValue: {
        fontSize: 14,
        color: COLORS.text.primary,
        fontWeight: '500',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border.light,
        paddingTop: 8,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.primary,
    },
    placeOrderButton: {
        backgroundColor: COLORS.primary,
        margin: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    placeOrderText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border.light,
        borderRadius: 8,
    },
    selectedPaymentOption: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}10`,
    },
    paymentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioSelected: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentTitle: {
        fontWeight: '500',
        color: COLORS.text.primary,
        fontSize: 16,
    },
    paymentSubtitle: {
        color: COLORS.text.secondary,
        fontSize: 12,
        marginTop: 2,
    },
    sectionContent: {
        padding: 16,
    },
});

export default BuyNowScreen; 