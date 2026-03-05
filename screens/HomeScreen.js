import React, { useEffect } from "react";
import { ScrollView, StyleSheet, View, StatusBar, TouchableOpacity, Text, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
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
import { API_BASE_URL } from "../config/apiConfig";
import { LinearGradient } from "expo-linear-gradient";
import { Platform } from "react-native";

const HomeScreen = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { isLoading: isCategoryLoading, categories, error: categoryError } = useSelector(
    (state) => state.category,
  );
  const { isLoading: isProductLoading, products, error: productError } = useSelector(
    (state) => state.product,
  );
  const apiError = categoryError || productError;

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
              text={t('home.loadingData')}
              style={styles.loadingContainer}
              color={COLORS.primary}
            />
          ) : (
            <>
              {apiError ? (
                <View style={styles.apiErrorBanner}>
                  <Text style={styles.apiErrorText}>
                    {t('home.apiError')} ({API_BASE_URL})
                  </Text>
                </View>
              ) : null}
              <CategorySection categories={categories || []} />
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => {
                    if (isAuthenticated) navigation.navigate("Vouchers");
                    else Alert.alert(t('common.loginRequired'), t('home.loginToViewVoucher'), [
                      { text: t('common.cancel'), style: "cancel" },
                      { text: t('common.login'), onPress: () => navigation.navigate("Login") },
                    ]);
                  }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary + "22" }]}>
                    <MaterialIcons name="confirmation-number" size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.quickActionLabel}>{t('home.voucher')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => {
                    if (isAuthenticated) navigation.navigate("PreOrder");
                    else Alert.alert(t('common.loginRequired'), t('home.loginToPreOrder'), [
                      { text: t('common.cancel'), style: "cancel" },
                      { text: t('common.login'), onPress: () => navigation.navigate("Login") },
                    ]);
                  }}
                >
                  <View style={[styles.quickActionIcon, { backgroundColor: COLORS.secondary + "22" }]}>
                    <MaterialIcons name="eco" size={28} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.quickActionLabel}>{t('home.preOrder')}</Text>
                </TouchableOpacity>
              </View>
              <FeaturedNewProducts products={products} title={t('home.newProducts')} />
              <FeaturedTopProducts title={t('home.topSelling')} />
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
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 4 : 6,
    paddingBottom: 16,
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
    paddingTop: 12,
    marginHorizontal: 0,
  },
  apiErrorBanner: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  apiErrorText: {
    fontSize: 13,
    color: "#92400E",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 20,
    marginBottom: 8,
  },
  quickActionBtn: {
    alignItems: "center",
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  loadingContainer: {
    marginTop: 40,
    paddingVertical: 60,
  },
});

export default HomeScreen;
