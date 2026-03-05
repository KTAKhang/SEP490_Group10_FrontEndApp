import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Alert,
    Image,
    StatusBar,
    Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getFruitTypes } from '../services/preorderService';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/formatCurrency';
import { getProductImageUrl } from '../utils/productImage';
import { InlineLoading } from '../components/Loading';

const NUM_COLUMNS = 2;

export default function PreOrderScreen({ navigation }) {
    const { t } = useTranslation();
    const [fruitTypes, setFruitTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadFruitTypes = useCallback(async () => {
        try {
            const res = await getFruitTypes({ limit: 50 });
            setFruitTypes(res.list || []);
        } catch (e) {
            Alert.alert(t('common.error'), e.message || t('preOrder.cannotLoadList'));
        }
    }, []);

    const load = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        setLoading(true);
        try {
            await loadFruitTypes();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [loadFruitTypes]);

    useEffect(() => {
        setLoading(true);
        loadFruitTypes()
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [loadFruitTypes]);

    const headerPaddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
            <LinearGradient
                colors={COLORS.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: headerPaddingTop }]}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('preOrder.title')}</Text>
            </LinearGradient>

            {loading ? (
                <InlineLoading text={t('preOrder.loading')} style={styles.loadWrap} color={COLORS.primary} />
            ) : (
                <FlatList
                    data={fruitTypes}
                    keyExtractor={(item) => item._id}
                    numColumns={NUM_COLUMNS}
                    contentContainerStyle={styles.gridContent}
                    columnWrapperStyle={styles.gridRow}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <MaterialIcons name="eco" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>{t('preOrder.noProductsPreOrder')}</Text>
                        </View>
                    }
                    renderItem={({ item: ft }) => (
                        <View style={styles.productContainer}>
                            <TouchableOpacity
                                style={styles.productCardWrapper}
                                activeOpacity={0.85}
                                onPress={() => navigation.navigate('PreOrderDetail', { fruitType: ft })}
                            >
                                <View style={styles.cardImageWrap}>
                                    {getProductImageUrl(ft) ? (
                                        <Image source={{ uri: getProductImageUrl(ft) }} style={styles.cardImage} resizeMode="cover" />
                                    ) : (
                                        <View style={styles.cardImagePlaceholder}>
                                            <MaterialIcons name="eco" size={48} color="#ccc" />
                                        </View>
                                    )}
                                    <View style={styles.preOrderBadge}>
                                        <Text style={styles.preOrderBadgeText}>Pre-order</Text>
                                    </View>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardName} numberOfLines={2}>{ft.name}</Text>
                                    <Text style={styles.cardPrice}>{formatCurrency(ft.estimatedPrice)}/kg</Text>
                                    <Text style={styles.cardRange}>
                                        {ft.minOrderKg}-{ft.maxOrderKg} kg
                                    </Text>
                                    <View style={styles.orderBtn}>
                                        <Text style={styles.orderBtnText}>{t('preOrder.preOrderBtn')}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                />
            )}

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
    gridContent: { padding: 16, paddingBottom: 100 },
    gridRow: { paddingVertical: 8 },
    productContainer: {
        flex: 1,
        paddingHorizontal: 6,
        paddingVertical: 8,
    },
    productCardWrapper: {
        borderRadius: 20,
        backgroundColor: COLORS.white,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: COLORS.shadow.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    cardImageWrap: {
        width: '100%',
        height: 160,
        backgroundColor: COLORS.border.light,
        position: 'relative',
    },
    cardImage: { width: '100%', height: '100%' },
    cardImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    preOrderBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    preOrderBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    cardInfo: { padding: 12 },
    cardName: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary, marginBottom: 6, height: 40 },
    cardPrice: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
    cardRange: { fontSize: 12, color: COLORS.text.light, marginBottom: 8 },
    orderBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
    },
    orderBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    emptyWrap: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { marginTop: 12, fontSize: 15, color: COLORS.text.light },
});
