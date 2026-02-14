import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

const CategorySection = ({ categories }) => {
    const navigation = useNavigation();

    if (!categories || categories.length === 0) {
        return <Text style={styles.errorText}>No categories available.</Text>;
    }

    // Component level filtering: Chỉ hiển thị active categories (status = true)
    const activeCategories = categories.filter(category => category.status === true);

    if (activeCategories.length === 0) {
        return <Text style={styles.errorText}>No active categories available.</Text>;
    }

    const handleCategoryPress = (category) => {



        navigation.navigate('AllProducts', {
            categoryId: category._id,
            categoryName: category.name
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Categories</Text>
            <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollView}
            >
                {activeCategories.map((category) => (
                    <TouchableOpacity
                        key={category._id}
                        style={styles.categoryItem}
                        onPress={() => handleCategoryPress(category)}
                    >
                        <LinearGradient
                            colors={[COLORS.primary, COLORS.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.categoryGradient}
                        >
                            <View style={styles.categoryImageContainer}>
                                <Image source={{ uri: category.image }} style={styles.categoryImage} />
                            </View>
                            <Text style={styles.categoryName}>{truncateText(category.name, 10)}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    scrollView: {
        marginHorizontal: -16,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    categoryItem: {
        width: 90,
        height: 100,
        marginRight: 12,
    },
    categoryGradient: {
        flex: 1,
        borderRadius: 16,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: COLORS.shadow.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    categoryImageContainer: {
        width: 50,
        height: 50,
        backgroundColor: COLORS.white,
        borderRadius: 25,
        padding: 6,
        marginBottom: 6,
        elevation: 2,
        shadowColor: COLORS.shadow.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    categoryImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
        borderRadius: 19,
    },
    categoryName: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.white,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        marginHorizontal: 2,
    },
    errorText: {
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});

export default CategorySection;
