import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getFruitTypeById } from '../services/preorderService';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/formatCurrency';
import { API_BASE_URL } from '../config/apiConfig';
import { InlineLoading } from '../components/Loading';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '');
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/600x600?text=Pre-order';

const { width } = Dimensions.get('window');

function resolveImageUrl(img) {
    if (!img || typeof img !== 'string') return null;
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    return `${API_BASE_URL.replace(/\/$/, '')}${img.startsWith('/') ? img : '/' + img}`;
}

function getImagesArray(item) {
    if (!item) return [];
    if (Array.isArray(item.images) && item.images.length > 0) return item.images;
    if (item.image) return [item.image];
    return [];
}

export default function PreOrderDetailScreen({ navigation, route }) {
    const { t } = useTranslation();
    const { fruitType: initialFruitType } = route?.params || {};
    const [item, setItem] = useState(initialFruitType);
    const [loading, setLoading] = useState(!!initialFruitType?._id);
    const [err, setErr] = useState('');
    const [quantity, setQuantity] = useState(
        initialFruitType ? String(initialFruitType.minOrderKg ?? '') : ''
    );
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useEffect(() => {
        if (!initialFruitType?._id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setErr('');
        getFruitTypeById(initialFruitType._id)
            .then((data) => {
                setItem(data);
                setQuantity(String(data.minOrderKg ?? ''));
                setSelectedImageIndex(0);
            })
            .catch((e) => setErr(e.message || 'Could not load.'))
            .finally(() => setLoading(false));
    }, [initialFruitType?._id]);

    const handleProceed = () => {
        if (!item) return;
        const qtyNum = parseFloat(quantity?.replace(',', '.'), 10);
        if (isNaN(qtyNum) || qtyNum < item.minOrderKg || qtyNum > item.maxOrderKg) {
            setErr(
                t('preOrder.kgMustBeBetween', { min: item.minOrderKg, max: item.maxOrderKg })
            );
            return;
        }
        setErr('');
        navigation.navigate('PreOrderCheckout', {
            fruitType: {
                _id: item._id,
                name: item.name,
                estimatedPrice: item.estimatedPrice ?? 0,
                minOrderKg: item.minOrderKg,
                maxOrderKg: item.maxOrderKg,
            },
            quantityKg: qtyNum,
            depositPercent: 50,
        });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <InlineLoading text="Loading..." style={styles.loadWrap} color={COLORS.primary} />
            </View>
        );
    }

    if (err && !item) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={COLORS.gradient.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('nav.preOrder')}</Text>
                </LinearGradient>
                <View style={styles.errorState}>
                    <Text style={styles.errorStateText}>{err}</Text>
                    <TouchableOpacity style={styles.backToPreOrderBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backToPreOrderBtnText}>{t('preOrder.backToPreOrder')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!item) return null;

    const rawImages = getImagesArray(item);
    const imageUrls = rawImages.map(resolveImageUrl).filter(Boolean);
    const mainImage = imageUrls[selectedImageIndex] || PLACEHOLDER_IMAGE;

    const qtyNum = parseFloat(quantity?.replace(',', '.'), 10);
    const validQty = !isNaN(qtyNum) && qtyNum >= item.minOrderKg && qtyNum <= item.maxOrderKg;
    const estimatedTotal = validQty ? Math.round((item.estimatedPrice ?? 0) * qtyNum) : 0;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={COLORS.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="chevron-left" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{item.name}</Text>
            </LinearGradient>

            {/* Breadcrumb */}
            <TouchableOpacity style={styles.breadcrumb} onPress={() => navigation.goBack()}>
                <MaterialIcons name="chevron-left" size={20} color={COLORS.text.secondary} />
                <Text style={styles.breadcrumbText}>{t('preOrder.backToPreOrder')}</Text>
            </TouchableOpacity>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <View style={styles.galleryWrap}>
                    <View style={styles.mainImageWrap}>
                        <Image source={{ uri: mainImage }} style={styles.mainImage} resizeMode="cover" />
                        <View style={styles.badgeWrap}>
                            <Text style={styles.badge}>Pre-order</Text>
                        </View>
                    </View>
                    {imageUrls.length > 1 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.thumbRow}
                            contentContainerStyle={styles.thumbRowContent}
                        >
                            {imageUrls.map((uri, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.thumb, selectedImageIndex === index && styles.thumbSelected]}
                                    onPress={() => setSelectedImageIndex(index)}
                                >
                                    <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Info card - same structure as web */}
                <View style={styles.card}>
                    <Row label={`${t('preOrder.name')}:`} value={item.name} valueBold />
                    <Row label={`${t('preOrder.pricePerKg')}:`} value={`${formatCurrency(item.estimatedPrice)}/kg`} valueGreen />
                    <Row label={`${t('preOrder.orderRange')}:`} value={`${item.minOrderKg} – ${item.maxOrderKg} kg`} />
                    {item.estimatedHarvestDate ? (
                        <Row label={`${t('preOrder.estimatedHarvest')}:`} value={formatDate(item.estimatedHarvestDate)} />
                    ) : null}
                    {item.description ? (
                        <Row label={`${t('preOrder.descriptionLabel')}:`} value={item.description} multiline />
                    ) : null}
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>{t('preOrder.quantityKgLabel')}:</Text>
                        <View style={styles.quantityWrap}>
                            <TextInput
                                style={styles.input}
                                value={quantity}
                                onChangeText={(v) => { setQuantity(v); setErr(''); }}
                                keyboardType="decimal-pad"
                                placeholder={`${item.minOrderKg} - ${item.maxOrderKg}`}
                            />
                            {validQty && (
                                <Text style={styles.estTotal}>
                                    {t('preOrder.subtotalLabel')}: {formatCurrency(estimatedTotal)}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {err ? (
                    <View style={styles.errBox}>
                        <Text style={styles.errText}>{err}</Text>
                    </View>
                ) : null}

                <TouchableOpacity
                    style={[styles.proceedBtn, !validQty && styles.proceedBtnDisabled]}
                    onPress={handleProceed}
                    disabled={!validQty}
                >
                    <MaterialIcons name="shopping-cart" size={22} color="#fff" />
                    <Text style={styles.proceedBtnText}>
                        {validQty ? t('preOrder.proceedToPreOrder') : t('preOrder.enterKg')}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

function Row({ label, value, valueBold, valueGreen, multiline }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text
                style={[
                    styles.rowValue,
                    valueBold && styles.rowValueBold,
                    valueGreen && styles.rowValueGreen,
                    multiline && styles.rowValueMultiline,
                ]}
                numberOfLines={multiline ? undefined : 2}
            >
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    loadWrap: { marginTop: 60 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 14,
    },
    backBtn: { padding: 8, marginRight: 8 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
    breadcrumb: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.light,
    },
    breadcrumbText: { fontSize: 14, color: COLORS.text.secondary, fontWeight: '500', marginLeft: 4 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    galleryWrap: { marginBottom: 24 },
    mainImageWrap: {
        width: '100%',
        aspectRatio: 1,
        maxHeight: width - 32,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: COLORS.border.light,
        position: 'relative',
    },
    mainImage: { width: '100%', height: '100%' },
    badgeWrap: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badge: { fontSize: 12, fontWeight: '600', color: '#fff' },
    thumbRow: { marginTop: 16 },
    thumbRowContent: { flexDirection: 'row', gap: 8, paddingRight: 16 },
    thumb: {
        width: 64,
        height: 64,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: COLORS.border.light,
    },
    thumbSelected: { borderColor: COLORS.primary },
    thumbImage: { width: '100%', height: '100%' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border.light,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    rowLabel: { fontSize: 14, color: COLORS.text.secondary, fontWeight: '500', minWidth: 120 },
    rowValue: { flex: 1, fontSize: 14, color: COLORS.text.primary },
    rowValueBold: { fontWeight: '600', fontSize: 16 },
    rowValueGreen: { color: COLORS.primary, fontWeight: '700', fontSize: 18 },
    rowValueMultiline: { lineHeight: 22 },
    quantityWrap: { flex: 1 },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border.dark,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 8,
    },
    estTotal: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
    errBox: {
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    errText: { color: '#b91c1c', fontSize: 14 },
    proceedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
    },
    proceedBtnDisabled: { backgroundColor: COLORS.border.dark },
    proceedBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    errorState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    errorStateText: { fontSize: 16, color: COLORS.text.secondary, marginBottom: 16, textAlign: 'center' },
    backToPreOrderBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    backToPreOrderBtnText: { color: '#fff', fontWeight: '600' },
});
