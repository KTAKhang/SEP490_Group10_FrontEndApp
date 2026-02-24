import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const OrderHistorySection = ({ orderHistory, onViewAll, onOrderPress }) => {

    const simplifiedOrders = orderHistory.map(order => ({
        order_id: order.order_id,
        createdAt: order.createdAt,
        total_price: order.total_price,
        order_status_name: order.order_status.name
    })).slice(0, 3);


    const formatCurrency = (amount) => {
        return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    };


    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString('vi-VN');
    };


    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING':
                return { backgroundColor: '#fffbeb', color: '#f59e0b' };
            case 'CONFIRMED':
                return { backgroundColor: '#f3e8ff', color: '#8b5cf6' };
            case 'SHIPPED':
                return { backgroundColor: '#eff6ff', color: '#3b82f6' };
            case 'DELIVERED':
                return { backgroundColor: '#ecfdf5', color: '#10b981' };
            case 'CANCELLED':
                return { backgroundColor: '#f3f4f6', color: '#6b7280' };
            case 'RETURNED':
                return { backgroundColor: '#fef2f2', color: '#ef4444' };
            default:
                return { backgroundColor: '#e5e7eb', color: '#6b7280' };
        }
    };

    return (
        <>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Lịch sử đơn hàng</Text>
                    <TouchableOpacity onPress={onViewAll}>
                        <Text style={styles.viewAllText}>Xem đơn hàng</Text>
                    </TouchableOpacity>
                </View>
                {
                    Array.isArray(orderHistory) && orderHistory.length > 0 ? (
                        simplifiedOrders.map((order, index) => {
                            const { backgroundColor, color } = getStatusStyle(order.order_status_name);
                            return (
                                <View
                                    key={order.order_id}
                                    style={[
                                        styles.orderItem,
                                        index === simplifiedOrders.length - 1 && { borderBottomWidth: 0 }
                                    ]}
                                >
                                    <View style={styles.orderHeader}>
                                        <Text style={styles.orderId}>#{order.order_id.slice(-8).toUpperCase()}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor }]}>
                                            <Text style={[styles.statusText, { color }]}>
                                                {order.order_status_name}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.orderFooter}>
                                        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                                        <Text style={styles.orderAmount}>{formatCurrency(order.total_price)}</Text>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <Text style={{ textAlign: 'center', marginVertical: 20, color: 'gray' }}>
                            Không có đơn hàng nào.
                        </Text>
                    )
                }

            </View>
        </>

    );
};

const styles = StyleSheet.create({
    section: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151'
    },
    viewAllText: {
        color: '#13C2C2',
        fontWeight: '500',
        fontSize: 14
    },
    orderItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6'
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderId: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500'
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    orderDate: {
        fontSize: 14,
        color: '#6b7280'
    },
    orderAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151'
    },
});

export default OrderHistorySection;
