import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import ProductCard from './ProductCard';
import { COLORS } from '../constants/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchProductReviewsByProductId } from '../store/slices/reviewSlice';

const FeaturedNewProducts = ({ products, title }) => {
    const navigation = useNavigation();
    const dispatch = useDispatch();

    // Filter chỉ lấy sản phẩm có status = true (active products) và giới hạn 6 sản phẩm
    const activeProducts = products ? products.filter(product => product.status === true).slice(0, 6) : [];

    useEffect(() => {
        // Fetch reviews for all active products
        if (activeProducts && activeProducts.length > 0) {
            activeProducts.forEach(product => {
                if (product._id) {
                    dispatch(fetchProductReviewsByProductId(product._id));
                }
            });
        }
    }, [dispatch, activeProducts]);

    if (!activeProducts || activeProducts.length === 0) {
        return <Text style={styles.errorText}>Không có sản phẩm nào.</Text>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <View style={styles.titleUnderline} />
                </View>
                <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={() => navigation.navigate('AllProducts')}
                >
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                    <Icon name="arrow-forward" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={200}
                snapToAlignment="center"
            >
                {activeProducts.map((product) => (
                    <View key={product._id} style={styles.productWrapper}>
                        <ProductCard product={product} />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text.primary,
        letterSpacing: 0.5,
    },
    titleUnderline: {
        width: 40,
        height: 3,
        backgroundColor: COLORS.primary,
        marginTop: 8,
        borderRadius: 2,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        elevation: 2,
        shadowColor: COLORS.shadow.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        marginRight: 4,
    },
    scrollContent: {
        paddingRight: 16,
        paddingVertical: 8,
    },
    productWrapper: {
        width: 180,
        marginRight: 16,
    },
    errorText: {
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});

export default FeaturedNewProducts;
