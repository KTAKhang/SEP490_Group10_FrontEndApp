import React, { useEffect } from "react";
import { ScrollView, StyleSheet, View, StatusBar } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import TopNavBar from "../components/TopNavBar";
import SearchBar from "../components/SearchBar";
import CategorySection from "../components/CategorySection";
import FeaturedNewProducts from "../components/FeaturedNewProducts";
import FeaturedTopProducts from "../components/FeaturedTopProducts";
import BottomNavigation from "../components/BottomNavigation";
import { InlineLoading } from "../components/Loading";
import { fetchCategoriesAsync } from "../store/slices/categorySlice";
import { fetchProductsAsync } from "../store/slices/productSlice";
import { COLORS } from "../constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { Platform } from 'react-native';
const HomeScreen = () => {
  const dispatch = useDispatch();
  const { isLoading: isCategoryLoading, categories } = useSelector(
    (state) => state.category,
  );
  const { isLoading: isProductLoading, products } = useSelector(
    (state) => state.product,
  );

  useEffect(() => {
    dispatch(fetchCategoriesAsync({ page: 1, limit: 20 }));
    dispatch(fetchProductsAsync({ page: 1, limit: 10 }));
  }, [dispatch]);

  const isLoading = isCategoryLoading || isProductLoading;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.secondary}
        translucent
      />
      <LinearGradient
        colors={COLORS.gradient.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TopNavBar />
        <SearchBar />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {isLoading ? (
            <InlineLoading
              text="Đang tải dữ liệu..."
              style={styles.loadingContainer}
              color={COLORS.primary}
            />
          ) : (
            <>
              <CategorySection categories={categories} />
              <FeaturedNewProducts products={products} title="Sản phẩm mới" />
              <FeaturedTopProducts title="Bán chạy nhất" />
            </>
          )}
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingTop:
    Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: COLORS.shadow.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    marginHorizontal: 0,
  },
  loadingContainer: {
    marginTop: 40,
    paddingVertical: 60,
  },
});

export default HomeScreen;