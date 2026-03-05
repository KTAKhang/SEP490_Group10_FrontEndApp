import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/formatCurrency';

const STATUS_TO_KEY = {
    WAITING_FOR_ALLOCATION: 'statusWaitingAlloc',
    WAITING_FOR_NEXT_BATCH: 'statusWaitingBatch',
    ALLOCATED_WAITING_PAYMENT: 'statusPayRemaining',
    READY_FOR_FULFILLMENT: 'statusReady',
    COMPLETED: 'statusCompleted',
    REFUND: 'statusRefund',
};

const STATUS_STYLE = {
    COMPLETED: { backgroundColor: '#dcfce7', color: '#166534' },
    READY_FOR_FULFILLMENT: { backgroundColor: '#dcfce7', color: '#166534' },
    ALLOCATED_WAITING_PAYMENT: { backgroundColor: '#f3e8ff', color: '#6b21a8' },
    WAITING_FOR_NEXT_BATCH: { backgroundColor: '#fef3c7', color: '#b45309' },
    WAITING_FOR_ALLOCATION: { backgroundColor: '#f3f4f6', color: '#4b5563' },
    REFUND: { backgroundColor: '#fee2e2', color: '#b91c1c' },
};

const PreOrderHistorySection = ({ preOrderHistory, onViewAll, onOrderPress }) => {
    const { t } = useTranslation();
    const list = Array.isArray(preOrderHistory) ? preOrderHistory.filter((po) => po.status !== 'CANCELLED') : [];
    const simplified = list.slice(0, 3);

    const formatDate = (isoString) => {
        return isoString ? new Date(isoString).toLocaleDateString('vi-VN') : '—';
    };

    const getStatusStyle = (status) => STATUS_STYLE[status] || { backgroundColor: '#f3f4f6', color: '#6b7280' };

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('preOrder.title')}</Text>
                <TouchableOpacity onPress={onViewAll}>
                    <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
                </TouchableOpacity>
            </View>
            {simplified.length > 0 ? (
                simplified.map((po, index) => {
                    const statusLabel = STATUS_TO_KEY[po.status] ? t('preOrder.' + STATUS_TO_KEY[po.status]) : (po.status || '—');
                    const { backgroundColor, color } = getStatusStyle(po.status);
                    const shortId = po._id ? `#${String(po._id).slice(-8).toUpperCase()}` : '—';
                    return (
                        <TouchableOpacity
                            key={po._id || index}
                            style={[styles.orderItem, index === simplified.length - 1 && { borderBottomWidth: 0 }]}
                            onPress={() => onOrderPress?.(po)}
                            activeOpacity={onOrderPress ? 0.7 : 1}
                        >
                            <View style={styles.orderHeader}>
                                <Text style={styles.orderId}>{shortId}</Text>
                                <View style={[styles.statusBadge, { backgroundColor }]}>
                                    <Text style={[styles.statusText, { color }]} numberOfLines={1}>{statusLabel}</Text>
                                </View>
                            </View>
                            <View style={styles.orderFooter}>
                                <Text style={styles.orderDate}>{formatDate(po.createdAt)}</Text>
                                <Text style={styles.orderAmount}>{formatCurrency(po.totalAmount || 0)}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })
            ) : (
                <Text style={styles.emptyText}>{t('preOrder.noPreOrders')}</Text>
            )}
        </View>
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
        color: '#374151',
    },
    viewAllText: {
        color: COLORS.primary,
        fontWeight: '500',
        fontSize: 14,
    },
    orderItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
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
        color: '#374151',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderDate: {
        fontSize: 14,
        color: '#6b7280',
    },
    orderAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    emptyText: {
        textAlign: 'center',
        marginVertical: 20,
        color: 'gray',
    },
});

export default PreOrderHistorySection;
