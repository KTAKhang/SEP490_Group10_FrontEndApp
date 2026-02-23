import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getValidVouchers } from '../services/voucherService';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/formatCurrency';
import { InlineLoading } from '../components/Loading';
import BottomNavigation from '../components/BottomNavigation';

const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('vi-VN');
};

/** Vé voucher — thiết kế dạng thẻ vé (ticket) */
const VoucherCard = ({ voucher }) => {
    const minOrder = voucher.minOrderValue ?? 0;
    const percent = voucher.discountPercent ?? 0;
    const maxAmount = voucher.maxDiscountAmount ?? null;

    return (
        <View style={styles.ticketWrap}>
            <View style={styles.ticketLeft}>
                <View style={styles.ticketNotch} />
                <LinearGradient
                    colors={['#13C2C2', '#0D364C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ticketGradient}
                >
                    <Text style={styles.ticketPercent}>{percent}%</Text>
                    <Text style={styles.ticketOff}>GIẢM</Text>
                    {maxAmount != null && (
                        <Text style={styles.ticketMax}>Tối đa {formatCurrency(maxAmount)}</Text>
                    )}
                </LinearGradient>
            </View>
            <View style={styles.ticketRight}>
                <Text style={styles.ticketCode}>{voucher.code}</Text>
                <Text style={styles.ticketDesc} numberOfLines={2}>
                    {voucher.description || `Đơn tối thiểu ${formatCurrency(minOrder)}`}
                </Text>
                <Text style={styles.ticketDate}>
                    HSĐ: {formatDate(voucher.startDate)} - {formatDate(voucher.endDate)}
                </Text>
            </View>
        </View>
    );
};

export default function VouchersScreen({ navigation }) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const data = await getValidVouchers();
            setList(Array.isArray(data) ? data : []);
        } catch (e) {
            Alert.alert('Lỗi', e.message || 'Không tải được voucher');
            setList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={COLORS.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Voucher của tôi</Text>
            </LinearGradient>

            {loading ? (
                <InlineLoading text="Đang tải voucher..." style={styles.loadWrap} color={COLORS.primary} />
            ) : (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
                    }
                >
                    {list.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <MaterialIcons name="confirmation-number" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Chưa có voucher nào</Text>
                        </View>
                    ) : (
                        list.map((v) => <VoucherCard key={v._id} voucher={v} />)
                    )}
                </ScrollView>
            )}
            <BottomNavigation />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 14,
    },
    backBtn: { padding: 8, marginRight: 8 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
    loadWrap: { marginTop: 40 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    ticketWrap: {
        flexDirection: 'row',
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
    },
    ticketLeft: {
        width: 100,
        position: 'relative',
    },
    ticketNotch: {
        position: 'absolute',
        right: -8,
        top: '50%',
        marginTop: -12,
        width: 16,
        height: 24,
        borderRadius: 8,
        backgroundColor: COLORS.background,
        zIndex: 1,
    },
    ticketGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    ticketPercent: { fontSize: 22, fontWeight: '800', color: '#fff' },
    ticketOff: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
    ticketMax: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    ticketRight: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 14,
        justifyContent: 'center',
    },
    ticketCode: { fontSize: 16, fontWeight: '700', color: COLORS.secondary, marginBottom: 4 },
    ticketDesc: { fontSize: 13, color: COLORS.text.secondary, marginBottom: 4 },
    ticketDate: { fontSize: 11, color: COLORS.text.light },
    emptyWrap: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { marginTop: 12, fontSize: 15, color: COLORS.text.light },
});
