import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import ProductCard from '../components/ProductCard';
import { fetchFavorites, removeFavorite } from '../store/slices/favoriteSlice';
import { InlineLoading } from '../components/Loading';
import Toast from 'react-native-toast-message';

const FavoritesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items, pagination, isLoadingList, error } = useSelector((state) => state.favorite);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFavorites({ page: 1, limit: 12 }));
    }
  }, [dispatch, isAuthenticated]);

  const handleRefresh = useCallback(() => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    dispatch(fetchFavorites({ page: 1, limit: 12 }))
      .finally(() => setRefreshing(false));
  }, [dispatch, isAuthenticated]);

  const renderHeader = () => (
    <LinearGradient
      colors={COLORS.gradient?.primary || [COLORS.primary, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <View style={styles.backButtonInner}>
            <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Sản phẩm yêu thích</Text>
          <Text style={styles.headerSubtitle}>
            {pagination?.total || items.length} sản phẩm
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>
    </LinearGradient>
  );

  const handleRemoveFavorite = useCallback(
    async (productId) => {
      if (!productId) return;
      try {
        await dispatch(removeFavorite(productId)).unwrap();
        await dispatch(fetchFavorites({ page: 1, limit: 12 }));
        Toast.show({
          type: 'success',
          text1: 'Đã bỏ khỏi danh sách yêu thích',
          position: 'top',
          visibilityTime: 2000,
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Không thể bỏ yêu thích',
          text2: error?.toString() || 'Vui lòng thử lại sau',
          position: 'top',
          visibilityTime: 2500,
        });
      }
    },
    [dispatch],
  );

  const renderItem = ({ item }) => (
    <View style={styles.productContainer}>
      <View style={styles.productCardWrapper}>
        <ProductCard
          product={item}
          onRemoveFavorite={() => handleRemoveFavorite(item._id)}
        />
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.notAuthContainer}>
        {renderHeader()}
        <View style={styles.notAuthContent}>
          <MaterialIcons name="favorite-border" size={64} color={COLORS.primary} />
          <Text style={styles.notAuthTitle}>Đăng nhập để xem sản phẩm yêu thích</Text>
          <Text style={styles.notAuthText}>
            Danh sách yêu thích được lưu theo tài khoản của bạn.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoadingList && !refreshing && (!items || items.length === 0)) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <InlineLoading text="Đang tải danh sách yêu thích..." style={styles.loadingContainer} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          numColumns={2}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="favorite-border" size={72} color="#cbd5f5" />
              <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
              <Text style={styles.emptyText}>
                Hãy thêm sản phẩm vào danh sách yêu thích từ trang chi tiết sản phẩm.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: COLORS.shadow?.dark || '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  content: {
    flex: 1,
    marginTop: -16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.background,
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text?.primary || '#0D364C',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.text?.secondary || '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  notAuthContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  notAuthContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  notAuthTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text?.primary || '#0D364C',
    textAlign: 'center',
  },
  notAuthText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.text?.secondary || '#6b7280',
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default FavoritesScreen;

