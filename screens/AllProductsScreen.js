import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions,
    TextInput,
    Modal,
    ScrollView,
    Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductsAsync, fetchProductsByCategoryAsync, resetAllProducts } from '../store/slices/productSlice';
import ProductCard from '../components/ProductCard';
import CategorySection from '../components/CategorySection';
import { InlineLoading } from '../components/Loading';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 6;
const MAX_PAGE_BUTTONS = 5;

const AllProductsScreen = ({ navigation, route }) => {
    const dispatch = useDispatch();
    const { allProducts, isLoading, pagination } = useSelector((state) => state.product);
    const { categories } = useSelector((state) => state.category);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [currentSearch, setCurrentSearch] = useState('');

    // Backend lọc theo category bằng ObjectId
    const categoryId = route.params?.categoryId;
    const categoryName = route.params?.categoryName;

    useEffect(() => {
        if (categoryId) {
            dispatch(fetchProductsByCategoryAsync({
                categoryId,
                page: 1,
                limit: ITEMS_PER_PAGE,
            }));
        } else {
            dispatch(fetchProductsAsync({
                page: 1,
                limit: ITEMS_PER_PAGE,
                isAllProducts: true,
                search: null,
            }));
        }
        return () => {
            dispatch(resetAllProducts());
        };
    }, [dispatch, categoryId]);



    // No auto search - only search when user clicks search button

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        dispatch(resetAllProducts());
        if (categoryId) {
            dispatch(fetchProductsByCategoryAsync({
                categoryId,
                page: 1,
                limit: ITEMS_PER_PAGE,
                search: currentSearch || '',
            }));
        } else {
            dispatch(fetchProductsAsync({
                page: 1,
                limit: ITEMS_PER_PAGE,
                isAllProducts: true,
                search: currentSearch || null,
            }));
        }
        setRefreshing(false);
    }, [dispatch, currentSearch, categoryId]);

    const goToPage = useCallback((page) => {
        if (page < 1 || page > (pagination.totalPages || 1) || isLoading) return;
        if (categoryId) {
            dispatch(fetchProductsByCategoryAsync({
                categoryId,
                page,
                limit: ITEMS_PER_PAGE,
                search: currentSearch || '',
            }));
        } else {
            dispatch(fetchProductsAsync({
                page,
                limit: ITEMS_PER_PAGE,
                isAllProducts: true,
                search: currentSearch || null,
            }));
        }
    }, [categoryId, currentSearch, dispatch, isLoading, pagination.totalPages]);

    const handleSearchPress = () => {
        setSearchText(currentSearch || ''); // Set current search when opening modal
        setIsSearchVisible(true);
    };

    const handleSearchClose = () => {
        setIsSearchVisible(false);
        // Reset searchText to currentSearch when closing modal
        setSearchText(currentSearch || '');
    };

    const handleSearch = () => {
        const term = searchText.trim();
        if (term !== currentSearch) {
            setCurrentSearch(term);
            setSearchText(term);
            dispatch(resetAllProducts());
            setIsSearchVisible(false);
            if (categoryId) {
                dispatch(fetchProductsByCategoryAsync({
                    categoryId,
                    page: 1,
                    limit: ITEMS_PER_PAGE,
                    search: term,
                }));
            } else {
                dispatch(fetchProductsAsync({
                    page: 1,
                    limit: ITEMS_PER_PAGE,
                    isAllProducts: true,
                    search: term || null,
                }));
            }
        } else {
            setIsSearchVisible(false);
        }
    };

    const clearSearch = () => {
        setSearchText('');
        if (currentSearch !== '') {
            setCurrentSearch('');
            dispatch(resetAllProducts());

            if (categoryId) {
                dispatch(fetchProductsByCategoryAsync({
                    categoryId,
                    page: 1,
                    limit: ITEMS_PER_PAGE,
                }));
            } else {
                // Return to all products
                dispatch(fetchProductsAsync({
                    page: 1,
                    limit: ITEMS_PER_PAGE,
                    isAllProducts: true,
                    search: null
                }));
            }
        }
    };

    const renderSearchModal = () => (
        <Modal
            visible={isSearchVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleSearchClose}
        >
            <View style={styles.searchModalContainer}>
                <View style={styles.searchModalContent}>
                    <View style={styles.searchHeader}>
                        <TouchableOpacity
                            style={styles.searchCloseButton}
                            onPress={handleSearchClose}
                            activeOpacity={0.7}
                        >
                            <Icon name="arrow-back" size={24} color="#0D364C" />
                        </TouchableOpacity>
                        <Text style={styles.searchTitle}>Tìm kiếm sản phẩm</Text>
                    </View>

                    <View style={styles.searchInputContainer}>
                        <Icon name="search" size={20} color="#13C2C2" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm kiếm theo tên sản phẩm..."
                            placeholderTextColor="#A0A0A0"
                            value={searchText}
                            onChangeText={setSearchText}
                            autoFocus={true}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={clearSearch} style={styles.clearButton} activeOpacity={0.7}>
                                <Icon name="close" size={20} color="#A0A0A0" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.searchButtonContainer}>
                        <TouchableOpacity
                            style={[
                                styles.searchActionButton,
                                searchText.trim() === '' && styles.searchActionButtonDisabled
                            ]}
                            onPress={handleSearch}
                            disabled={searchText.trim() === ''}
                        >
                            <Icon name="search" size={20} color="#fff" />
                            <Text style={styles.searchActionButtonText}>Tìm kiếm</Text>
                        </TouchableOpacity>

                        {currentSearch ? (
                            <TouchableOpacity
                                style={styles.clearAllButton}
                                onPress={() => {
                                    clearSearch();
                                    setIsSearchVisible(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <Icon name="delete-sweep" size={20} color="#6b7280" />
                                <Text style={styles.clearAllButtonText}>Xóa tất cả</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {currentSearch ? (
                        <View style={styles.searchResultsContainer}>
                            <Text style={styles.searchResultsText}>
                                Tìm kiếm: &quot;{currentSearch}&quot;
                            </Text>
                            <Text style={styles.searchResultsSubText}>
                                Trang {pagination.currentPage}/{pagination.totalPages || 1} • Tổng {(pagination.total ?? allProducts.length)} sản phẩm
                            </Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </Modal>
    );

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <LinearGradient
                colors={['#13C2C2', '#0D364C', '#13C2C2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <View style={styles.backButtonInner}>
                            <Icon name="arrow-back" size={22} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>
                            {currentSearch ? 'Kết quả tìm kiếm' : (categoryName || 'Tất cả sản phẩm')}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            Trang {pagination.currentPage}/{pagination.totalPages || 1}
                            {currentSearch ? ` • "${currentSearch}"` : ''}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.searchButton}
                        activeOpacity={0.8}
                        onPress={handleSearchPress}
                    >
                        <View style={styles.searchButtonInner}>
                            <Icon name="search" size={22} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Thanh search luôn hiển thị */}
                <View style={styles.inlineSearchContainer}>
                    <Icon name="search" size={20} color="#13C2C2" style={styles.inlineSearchIcon} />
                    <TextInput
                        style={styles.inlineSearchInput}
                        placeholder="Tìm theo tên sản phẩm..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={searchText}
                        onChangeText={setSearchText}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                        editable={!isLoading}
                    />
                    {searchText.length > 0 ? (
                        <TouchableOpacity onPress={clearSearch} style={styles.inlineClearBtn} activeOpacity={0.7}>
                            <Icon name="close" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                        style={[styles.inlineSearchBtn, (!searchText.trim() || isLoading) && styles.inlineSearchBtnDisabled]}
                        onPress={handleSearch}
                        disabled={!searchText.trim() || isLoading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.inlineSearchBtnText}>Tìm</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />
                <View style={styles.decorativeCircle3} />
            </LinearGradient>
        </View>
    );

    const renderCategorySection = () => {
        // Chỉ hiển thị CategorySection khi không có search term và không có category cụ thể
        if (currentSearch || categoryName) return null;

        return (
            <View style={styles.categorySectionContainer}>
                <CategorySection categories={categories} />
            </View>
        );
    };



    const renderItem = ({ item, index }) => {
        return (
            <View style={styles.productContainer}>
                <View style={styles.productCardWrapper}>
                    <ProductCard product={item} />
                </View>
            </View>
        );
    };

    const totalPages = Math.max(1, pagination.totalPages || 1);
    const currentPage = Math.min(Math.max(1, pagination.currentPage || 1), totalPages);

    const getPageNumbers = () => {
        const pages = [];
        let start = Math.max(1, currentPage - Math.floor(MAX_PAGE_BUTTONS / 2));
        let end = Math.min(totalPages, start + MAX_PAGE_BUTTONS - 1);
        if (end - start + 1 < MAX_PAGE_BUTTONS) start = Math.max(1, end - MAX_PAGE_BUTTONS + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    const renderPagination = () => {
        if (totalPages <= 1 && allProducts.length === 0) return null;
        const pages = getPageNumbers();
        return (
            <View style={styles.paginationContainer}>
                <TouchableOpacity
                    style={[styles.pageButton, currentPage <= 1 && styles.pageButtonDisabled]}
                    onPress={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    activeOpacity={0.7}
                >
                    <Icon name="chevron-left" size={22} color={currentPage <= 1 ? '#ccc' : '#0D364C'} />
                </TouchableOpacity>
                <View style={styles.pageNumbersRow}>
                    {pages.map((p) => (
                        <TouchableOpacity
                            key={p}
                            style={[styles.pageNumberButton, p === currentPage && styles.pageNumberButtonActive]}
                            onPress={() => goToPage(p)}
                            disabled={isLoading}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.pageNumberText, p === currentPage && styles.pageNumberTextActive]}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TouchableOpacity
                    style={[styles.pageButton, currentPage >= totalPages && styles.pageButtonDisabled]}
                    onPress={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages || isLoading}
                    activeOpacity={0.7}
                >
                    <Icon name="chevron-right" size={22} color={currentPage >= totalPages ? '#ccc' : '#0D364C'} />
                </TouchableOpacity>
            </View>
        );
    };

    const isInitialLoading = isLoading && allProducts.length === 0;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D364C" />
            {renderHeader()}

            <View style={styles.content}>
                {isInitialLoading ? (
                    <InlineLoading text="Đang tải sản phẩm..." style={styles.loadingContainer} />
                ) : (
                    <FlatList
                        data={allProducts}
                        renderItem={renderItem}
                        keyExtractor={(item) => item._id}
                        numColumns={2}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}
                        onRefresh={handleRefresh}
                        refreshing={refreshing}
                        ListHeaderComponent={renderCategorySection}
                        ListFooterComponent={renderPagination}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <LinearGradient
                                    colors={['#f8f9ff', '#e8ecff']}
                                    style={styles.emptyGradient}
                                >
                                    <View style={styles.emptyIconContainer}>
                                        <Icon name={currentSearch ? 'search' : 'category'} size={80} color="#c7d2fe" />
                                    </View>
                                    <Text style={styles.emptyTitle}>
                                        {currentSearch ? 'Không có kết quả tìm kiếm' : 'Không tìm thấy sản phẩm'}
                                    </Text>
                                    <Text style={styles.emptyText}>
                                        {currentSearch
                                            ? `Không tìm thấy sản phẩm nào phù hợp với "${currentSearch}"`
                                            : categoryName
                                                ? `Không có sản phẩm nào trong danh mục ${categoryName}`
                                                : 'Hiện tại không có sản phẩm nào'
                                        }
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.retryButton}
                                        onPress={() => {
                                            dispatch(resetAllProducts());
                                            if (categoryId) {
                                                dispatch(fetchProductsByCategoryAsync({
                                                    categoryId,
                                                    page: 1,
                                                    limit: ITEMS_PER_PAGE,
                                                    search: currentSearch || '',
                                                }));
                                            } else {
                                                dispatch(fetchProductsAsync({
                                                    page: 1,
                                                    limit: ITEMS_PER_PAGE,
                                                    isAllProducts: true,
                                                    search: currentSearch || null,
                                                }));
                                            }
                                        }}
                                    >
                                        <Text style={styles.retryButtonText}>Thử lại</Text>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </View>
                        }
                    />
                )}
            </View>

            {renderSearchModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0feff',
    },
    headerContainer: {
        position: 'relative',
        zIndex: 1000,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: (Platform.OS === 'android' ? StatusBar.currentHeight : 0) + 16,
        paddingBottom: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 2,
    },
    backButton: {
        padding: 4,
    },
    backButtonInner: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
        fontWeight: '500',
    },
    searchButton: {
        padding: 4,
    },
    searchButtonInner: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    decorativeCircle1: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: -20,
        left: -40,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    decorativeCircle3: {
        position: 'absolute',
        top: 20,
        left: width * 0.7,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    inlineSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    inlineSearchIcon: {
        marginRight: 8,
    },
    inlineSearchInput: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    inlineClearBtn: {
        padding: 4,
        marginRight: 4,
    },
    inlineSearchBtn: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    inlineSearchBtnDisabled: {
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    inlineSearchBtnText: {
        color: '#0D364C',
        fontSize: 14,
        fontWeight: '600',
    },
    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
        gap: 8,
    },
    pageButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0feff',
        borderWidth: 1,
        borderColor: '#13C2C2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageButtonDisabled: {
        backgroundColor: '#f0f0f0',
        borderColor: '#ddd',
    },
    pageNumbersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pageNumberButton: {
        minWidth: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#f0feff',
        borderWidth: 1,
        borderColor: '#d1f4f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageNumberButtonActive: {
        backgroundColor: '#13C2C2',
        borderColor: '#0D364C',
    },
    pageNumberText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0D364C',
    },
    pageNumberTextActive: {
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        backgroundColor: '#f0feff',
        marginTop: -25,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        overflow: 'hidden',
    },
    listContent: {
        padding: 16,
        paddingTop: 30,
    },
    categorySectionContainer: {
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    productContainer: {
        flex: 1,
        paddingHorizontal: 6,
        paddingVertical: 8,
    },
    productCardWrapper: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#13C2C2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0feff',
    },
    // Cleaned up - using unified loading component
    noMoreFooter: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    noMoreText: {
        fontSize: 14,
        color: COLORS.text.secondary,
        fontWeight: '500',
        marginBottom: 4,
    },
    totalProductsText: {
        fontSize: 12,
        color: COLORS.text.light,
        fontWeight: '400',
    },
    emptyContainer: {
        flex: 1,
        marginTop: 60,
        marginHorizontal: 20,
    },
    emptyGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 30,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#d1f4f5',
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#13C2C2',
        shadowColor: '#13C2C2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0D364C',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#13C2C2',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#13C2C2',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
        shadowColor: '#13C2C2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Search Modal Styles
    searchModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
    },
    searchModalContent: {
        backgroundColor: '#FFFFFF',
        paddingTop: StatusBar.currentHeight + 10,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    searchCloseButton: {
        padding: 8,
        marginRight: 16,
    },
    searchTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0D364C',
        flex: 1,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9ff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 2,
        borderColor: '#13C2C2',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#0D364C',
        paddingVertical: 4,
    },
    clearButton: {
        padding: 4,
    },
    searchButtonContainer: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    searchActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#13C2C2',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#13C2C2',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    searchActionButtonDisabled: {
        backgroundColor: '#d1d5db',
        shadowColor: '#d1d5db',
    },
    searchActionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    clearAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    clearAllButtonText: {
        color: '#6b7280',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    searchResultsContainer: {
        marginTop: 16,
        paddingHorizontal: 4,
        backgroundColor: '#f0f8ff',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#13C2C2',
    },
    searchResultsText: {
        fontSize: 14,
        color: '#13C2C2',
        fontWeight: '600',
        marginBottom: 4,
    },
    searchResultsSubText: {
        fontSize: 12,
        color: '#0D364C',
        fontWeight: '400',
    },
});

export default AllProductsScreen;