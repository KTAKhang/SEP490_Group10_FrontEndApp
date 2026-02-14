import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Text,
    FlatList,
    Image,
    Modal,
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { searchCategories } from '../services/categoryService';
import { searchProducts } from '../services/productService';
import { COLORS } from '../constants/colors';

const SearchBar = () => {
    const navigation = useNavigation();
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchTimeout = useRef(null);

    // Debounced search function
    const performSearch = async (query) => {
        if (!query || query.trim().length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsLoading(true);
        try {
            // Search both categories and products
            const [categoriesResponse, productsResponse] = await Promise.all([
                searchCategories({ search: query, limit: 5 }),
                searchProducts({ search: query, limit: 10 })
            ]);

            // Filter only active items (status = true)
            const activeCategories = categoriesResponse.data.categories
                .filter(category => category.status === true)
                .map(category => ({
                    ...category,
                    type: 'category'
                }));

            const activeProducts = productsResponse.data.products
                .filter(product => product.status === true)
                .map(product => ({
                    ...product,
                    type: 'product'
                }));

            // Combine results
            const combinedResults = [...activeCategories, ...activeProducts];
            setSearchResults(combinedResults);
            setShowResults(combinedResults.length > 0);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
            setShowResults(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Clear previous timeout
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        // Set new timeout for debounced search
        searchTimeout.current = setTimeout(() => {
            performSearch(searchText);
        }, 500);

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchText]);

    const handleItemPress = (item) => {
        setShowResults(false);
        setSearchText('');

        if (item.type === 'category') {
            navigation.navigate('AllProducts', {
                categoryId: item._id,
                categoryName: item.name
            });
        } else if (item.type === 'product') {
            navigation.navigate('ProductDetail', {
                productId: item._id
            });
        }
    };

    const renderSearchItem = ({ item }) => (
        <TouchableOpacity
            style={styles.searchItem}
            onPress={() => handleItemPress(item)}
        >
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemTypeContainer}>
                    <Icon
                        name={item.type === 'category' ? 'category' : 'shopping-cart'}
                        size={14}
                        color={item.type === 'category' ? '#10B981' : '#3B82F6'}
                    />
                    <Text style={[
                        styles.itemType,
                        { color: item.type === 'category' ? '#10B981' : '#3B82F6' }
                    ]}>
                        {item.type === 'category' ? 'Danh mục' : 'Sản phẩm'}
                    </Text>
                </View>
            </View>
            <Icon name="arrow-forward-ios" size={16} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Tìm kiếm sản phẩm hoặc danh mục..."
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholderTextColor="#9CA3AF"
                />
                {isLoading && (
                    <ActivityIndicator size="small" color={COLORS.primary} style={styles.loadingIcon} />
                )}
                {searchText.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            setSearchText('');
                            setShowResults(false);
                        }}
                    >
                        <Icon name="clear" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Search Results Modal */}
            <Modal
                visible={showResults}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowResults(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowResults(false)}
                >
                    <View style={styles.resultsContainer}>
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>
                                Kết quả tìm kiếm ({searchResults.length})
                            </Text>
                            <TouchableOpacity onPress={() => setShowResults(false)}>
                                <Icon name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={searchResults}
                            renderItem={renderSearchItem}
                            keyExtractor={(item) => `${item.type}-${item._id}`}
                            style={styles.resultsList}
                            showsVerticalScrollIndicator={false}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <Icon name="search-off" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
                                    <Text style={styles.emptySubText}>
                                        Thử tìm kiếm với từ khóa khác
                                    </Text>
                                </View>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
    },
    loadingIcon: {
        marginLeft: 8,
    },
    clearButton: {
        padding: 4,
        marginLeft: 8,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        paddingTop: 100,
    },
    resultsContainer: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        borderRadius: 12,
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
    },
    resultsList: {
        maxHeight: 400,
    },
    // Search Item Styles
    searchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    itemImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 4,
    },
    itemTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemType: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 16,
    },
    // Empty State Styles
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#6B7280',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'center',
    },
});

export default SearchBar;