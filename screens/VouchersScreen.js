import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
    Platform,
    Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
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

/** Green 600 cho thẻ voucher (Tailwind green-600 #16a34a) */
const VOUCHER_CARD_GREEN = '#16a34a';
const VOUCHER_CARD_GREEN_DARK = '#15803d'; // green-700 cho gradient

/** Vé voucher — thiết kế dạng thẻ vé (ticket) + nút copy mã + nút xem chi tiết */
const VoucherCard = ({ voucher, onCopy, onPressDetail, t }) => {
    const minOrder = voucher.minOrderValue ?? 0;
    const percent = voucher.discountPercent ?? 0;
    const maxAmount = voucher.maxDiscountAmount ?? null;

    const handleCopy = async () => {
        try {
            await Clipboard.setStringAsync(voucher.code || '');
            if (onCopy) onCopy();
            if (Platform.OS === 'web') {
                alert(t('vouchers.copied') + ': ' + (voucher.code || ''));
            }
        } catch (e) {
            if (onCopy) onCopy(false);
        }
    };

    return (
        <View style={styles.ticketWrap}>
            <View style={styles.ticketLeft}>
                <View style={styles.ticketNotch} />
                <LinearGradient
                    colors={[VOUCHER_CARD_GREEN, VOUCHER_CARD_GREEN_DARK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ticketGradient}
                >
                    <Text style={styles.ticketPercent}>{percent}%</Text>
                    <Text style={styles.ticketOff}>{t('vouchers.off')}</Text>
                    {maxAmount != null && (
                        <Text style={styles.ticketMax}>{t('vouchers.maxDiscount', { amount: formatCurrency(maxAmount) })}</Text>
                    )}
                </LinearGradient>
            </View>
            <View style={styles.ticketRight}>
                <View style={styles.ticketCodeRow}>
                    <Text style={styles.ticketCode} numberOfLines={1}>{voucher.code}</Text>
                    <TouchableOpacity
                        style={styles.copyBtn}
                        onPress={handleCopy}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialIcons name="content-copy" size={18} color={VOUCHER_CARD_GREEN} />
                        <Text style={[styles.copyBtnText, { color: VOUCHER_CARD_GREEN }]}>{t('vouchers.copy')}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.ticketDesc} numberOfLines={2}>
                    {voucher.description || t('vouchers.minOrder', { amount: formatCurrency(minOrder) })}
                </Text>
                <Text style={styles.ticketDate}>
                    {t('vouchers.validPeriod', { start: formatDate(voucher.startDate), end: formatDate(voucher.endDate) })}
                </Text>
                <TouchableOpacity
                    style={styles.detailBtnBlock}
                    onPress={() => onPressDetail?.(voucher)}
                    activeOpacity={0.7}
                    style={[styles.detailBtnBlock, { borderColor: VOUCHER_CARD_GREEN }]}
                >
                    <MaterialIcons name="info-outline" size={18} color={VOUCHER_CARD_GREEN} />
                    <Text style={[styles.detailBtnBlockText, { color: VOUCHER_CARD_GREEN }]}>{t('vouchers.viewDetail')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function VouchersScreen({ navigation }) {
    const { t } = useTranslation();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [detailVoucher, setDetailVoucher] = useState(null);

    const load = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const data = await getValidVouchers();
            setList(Array.isArray(data) ? data : []);
        } catch (e) {
            Alert.alert(t('common.error'), e.message || t('vouchers.cannotLoad'));
            setList([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handleCopySuccess = useCallback(() => {
        if (Platform.OS !== 'web') {
            Alert.alert(t('vouchers.copied'), t('vouchers.codeCopied'));
        }
    }, []);

    const handleCopyInModal = useCallback(async () => {
        if (!detailVoucher?.code) return;
        try {
            await Clipboard.setStringAsync(detailVoucher.code);
            if (Platform.OS !== 'web') Alert.alert(t('vouchers.copied'), t('vouchers.codeCopied'));
        } catch (e) {}
    }, [detailVoucher]);

    useEffect(() => {
        load();
    }, [load]);

    const renderDetailModal = () => {
        if (!detailVoucher) return null;
        const v = detailVoucher;
        const minOrder = v.minOrderValue ?? 0;
        const percent = v.discountPercent ?? 0;
        const maxAmount = v.maxDiscountAmount ?? null;
        return (
            <Modal
                visible={!!detailVoucher}
                animationType="fade"
                transparent
                onRequestClose={() => setDetailVoucher(null)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.detailModalOverlay}
                    onPress={() => setDetailVoucher(null)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.detailModalBox}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.detailModalHeader}>
                            <Text style={styles.detailModalTitle}>{t('vouchers.detailTitle')}</Text>
                            <TouchableOpacity
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                onPress={() => setDetailVoucher(null)}
                            >
                                <MaterialIcons name="close" size={22} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.detailModalBody}>
                            <View style={styles.detailRowCompact}>
                                <Text style={styles.detailLabelCompact}>{t('vouchers.codeLabel')}</Text>
                                <Text style={styles.detailCodeCompact}>{v.code}</Text>
                            </View>
                            {(v.description || '').trim() ? (
                                <View style={styles.detailRowCompact}>
                                    <Text style={styles.detailLabelCompact}>{t('vouchers.description')}</Text>
                                    <Text style={styles.detailValueCompact}>{v.description}</Text>
                                </View>
                            ) : null}
                            <View style={styles.detailRowCompact}>
                                <Text style={styles.detailLabelCompact}>{t('vouchers.discount')}</Text>
                                <Text style={styles.detailValueCompact}>{t('vouchers.percentOrder', { percent })}</Text>
                            </View>
                            <View style={styles.detailRowCompact}>
                                <Text style={styles.detailLabelCompact}>{t('vouchers.minOrderLabel')}</Text>
                                <Text style={styles.detailValueCompact}>{formatCurrency(minOrder)}</Text>
                            </View>
                            {maxAmount != null && (
                                <View style={styles.detailRowCompact}>
                                    <Text style={styles.detailLabelCompact}>{t('vouchers.maxDiscountLabel')}</Text>
                                    <Text style={styles.detailValueCompact}>{formatCurrency(maxAmount)}</Text>
                                </View>
                            )}
                            <View style={styles.detailRowCompact}>
                                <Text style={styles.detailLabelCompact}>{t('vouchers.validity')}</Text>
                                <Text style={styles.detailValueCompact}>
                                    {formatDate(v.startDate)} – {formatDate(v.endDate)}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.detailModalCopyBtn} onPress={handleCopyInModal}>
                            <MaterialIcons name="content-copy" size={18} color="#fff" />
                            <Text style={styles.detailModalCopyBtnText}>{t('vouchers.copyCode')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.detailModalCloseBtn}
                            onPress={() => setDetailVoucher(null)}
                        >
                            <Text style={styles.detailModalCloseBtnText}>{t('common.close')}</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        );
    };

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
                <Text style={styles.headerTitle}>{t('vouchers.title')}</Text>
            </LinearGradient>

            {loading ? (
                <InlineLoading text={t('vouchers.loading')} style={styles.loadWrap} color={COLORS.primary} />
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
                            <Text style={styles.emptyText}>{t('vouchers.empty')}</Text>
                        </View>
                    ) : (
                        list.map((v) => (
                            <VoucherCard
                                key={v._id}
                                voucher={v}
                                onCopy={handleCopySuccess}
                                onPressDetail={setDetailVoucher}
                                t={t}
                            />
                        ))
                    )}
                </ScrollView>
            )}
            {renderDetailModal()}
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
    ticketCode: { fontSize: 16, fontWeight: '700', color: COLORS.secondary, flex: 1 },
    ticketCodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8 },
    copyBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
    ticketDesc: { fontSize: 13, color: COLORS.text.secondary, marginBottom: 4 },
    ticketDate: { fontSize: 11, color: COLORS.text.light, marginBottom: 10 },
    detailBtnBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: '#f0fdf4', // green-50 (phù hợp green-600)
    },
    detailBtnBlockText: { fontSize: 14, fontWeight: '600' },
    emptyWrap: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { marginTop: 12, fontSize: 15, color: COLORS.text.light },
    // Cửa sổ nhỏ chi tiết voucher (dialog)
    detailModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    detailModalBox: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 16,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    detailModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    detailModalTitle: { fontSize: 16, fontWeight: '700', color: '#0d364c' },
    detailModalBody: { marginBottom: 12 },
    detailRowCompact: { marginBottom: 8 },
    detailLabelCompact: { fontSize: 12, color: COLORS.text.light, marginBottom: 2 },
    detailValueCompact: { fontSize: 14, color: '#0d364c', fontWeight: '500' },
    detailCodeCompact: { fontSize: 16, fontWeight: '700', color: COLORS.secondary },
    detailModalCopyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    detailModalCopyBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    detailModalCloseBtn: { alignItems: 'center', paddingVertical: 6 },
    detailModalCloseBtnText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
});
