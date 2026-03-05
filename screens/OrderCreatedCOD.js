import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOrderDetailByUser,
  clearOrderDetail,
} from "../store/slices/orderSlice";

export default function OrderCreatedCOD({ navigation, route }) {
  const dispatch = useDispatch();
  const { orderDetail, detailLoading } = useSelector((state) => state.order);
  const orderId = route?.params?.orderId;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (orderId) dispatch(fetchOrderDetailByUser(orderId));
    return () => dispatch(clearOrderDetail());
  }, [orderId]);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation on icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const order = orderDetail?.order;

  const infoRows = order
    ? [
        {
          icon: "receipt-outline",
          label: "Order code",
          value: `#${order._id?.slice(-8).toUpperCase()}`,
        },
        {
          icon: "cash-outline",
          label: "Total amount",
          value: `${order.total_price?.toLocaleString()} VND`,
          highlight: true,
        },
        {
          icon: "cube-outline",
          label: "Status",
          value: order.order_status?.name,
        },
        {
          icon: "wallet-outline",
          label: "Pay",
          value: orderDetail.payment?.status,
        },
      ]
    : [];

  return (
    <LinearGradient colors={["#0a0a14", "#0f1220", "#0d1628"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.iconWrapper,
            { transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] },
          ]}
        >
          <LinearGradient
            colors={["#059669", "#10b981", "#34d399"]}
            style={styles.iconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="checkmark" size={44} color="#fff" />
          </LinearGradient>
          {/* Glow ring */}
          <View style={styles.glowRing} />
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>Order placed successfully!</Text>
          <Text style={styles.subtitle}>
            Thank you for your purchase. Your order is being processed.
          </Text>
        </Animated.View>

        {/* COD Badge */}
        <Animated.View style={[styles.codBadge, { opacity: fadeAnim }]}>
          <Ionicons name="bicycle-outline" size={16} color="#fbbf24" />
          <Text style={styles.codText}>Cash on delivery (COD)</Text>
        </Animated.View>

        {/* Order Info Card */}
        {detailLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading application information...</Text>
          </View>
        ) : (
          order && (
            <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text-outline" size={18} color="#10b981" />
                <Text style={styles.cardTitle}>Order details</Text>
              </View>

              <View style={styles.divider} />

              {infoRows.map((row, index) => (
                <View key={index} style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <View style={styles.rowIconWrap}>
                      <Ionicons name={row.icon} size={15} color="#6ee7b7" />
                    </View>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                  </View>
                  <Text style={[styles.infoValue, row.highlight && styles.infoHighlight]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )
        )}

        {/* Buttons */}
        <Animated.View style={[styles.btnGroup, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("HomePage")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#059669", "#10b981"]}
              style={styles.primaryBtnInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="home-outline" size={18} color="#fff" />
              <Text style={styles.primaryText}>Back to homepage</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("OrderHistory")}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={18} color="#10b981" />
            <Text style={styles.secondaryText}>View order history</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    paddingVertical: 48,
  },

  // Icon
  iconWrapper: {
    marginBottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  glowRing: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1.5,
    borderColor: "rgba(16,185,129,0.25)",
  },

  // Text
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#f0fdf4",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 12,
  },

  // COD Badge
  codBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(251,191,36,0.1)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 24,
  },
  codText: {
    color: "#fbbf24",
    fontSize: 13,
    fontWeight: "600",
  },

  // Card
  card: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(16,185,129,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    color: "#9ca3af",
    fontSize: 13,
  },
  infoValue: {
    color: "#e5e7eb",
    fontSize: 13,
    fontWeight: "600",
    maxWidth: "50%",
    textAlign: "right",
  },
  infoHighlight: {
    color: "#34d399",
    fontSize: 15,
    fontWeight: "700",
  },

  // Loading
  loadingBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
    marginBottom: 28,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 13,
  },

  // Buttons
  btnGroup: {
    width: "100%",
    gap: 12,
  },
  primaryBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
    backgroundColor: "rgba(16,185,129,0.05)",
  },
  secondaryText: {
    color: "#10b981",
    fontWeight: "600",
    fontSize: 15,
  },
});