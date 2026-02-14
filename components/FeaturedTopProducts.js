import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import ProductCard from './ProductCard';
import { COLORS } from '../constants/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { fetchProductReviewsByProductId } from '../store/slices/reviewSlice';
import { fetchTopSoldProductsAsync } from '../store/slices/productSlice';
import { MinimalLoading } from './Loading';

const FeaturedTopProducts = ({ title }) => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { topSoldProducts, isLoadingTopSold } = useSelector((state) => state.product);

    useEffect(() => {
        // Fetch top sold products only once when component mounts
        if (!topSoldProducts || topSoldProducts.length === 0) {
            dispatch(fetchTopSoldProductsAsync({ page: 1, limit: 6 }));
        }
    }, [dispatch]); // Remove topSoldProducts from dependencies to prevent infinite loop

    useEffect(() => {
        // Fetch reviews for all top sold products
        if (topSoldProducts && topSoldProducts.length > 0) {
            topSoldProducts.forEach(product => {
                if (product._id) {
                    dispatch(fetchProductReviewsByProductId(product._id));
                }
            });
        }
    }, [dispatch]);

    if (isLoadingTopSold) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{title}</Text>
                        <View style={styles.titleUnderline} />
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <MinimalLoading color={COLORS.primary} />
                </View>
            </View>
        );
    }

    if (!topSoldProducts || topSoldProducts.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{title}</Text>
                        <View style={styles.titleUnderline} />
                    </View>
                </View>
                <Text style={styles.errorText}>Không có sản phẩm bán chạy nào.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <View style={styles.titleUnderline} />
                </View>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={200}
                snapToAlignment="center"
            >
                {topSoldProducts.slice(0, 3).map((product) => (
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
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});

export default FeaturedTopProducts; 