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

export default function PaymentSuccess({ navigation, route }) {
  const dispatch = useDispatch();
  const { orderDetail, detailLoading } = useSelector((state) => state.order);
  const orderId = route?.params?.orderId;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0.8)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (orderId) dispatch(fetchOrderDetailByUser(orderId));
    return () => dispatch(clearOrderDetail());
  }, [orderId]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 55,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.07, duration: 950, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 950, useNativeDriver: true }),
      ])
    ).start();

    // Ripple ring
    Animated.loop(
      Animated.parallel([
        Animated.timing(ringAnim, { toValue: 1.35, duration: 1800, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 1800, useNativeDriver: true }),
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
          icon: "card-outline",
          label: "Pay",
          value: orderDetail.payment?.status,
          success: true,
        },
      ]
    : [];

  return (
    <LinearGradient colors={["#0a0a14", "#0d1220", "#081a12"]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconWrapper}>
          {/* Ripple ring */}
          <Animated.View
            style={[
              styles.rippleRing,
              {
                opacity: ringOpacity,
                transform: [{ scale: Animated.multiply(scaleAnim, ringAnim) }],
              },
            ]}
          />
          <Animated.View
            style={{
              transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
            }}
          >
            <LinearGradient
              colors={["#059669", "#10b981", "#34d399"]}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="checkmark" size={46} color="#fff" />
            </LinearGradient>
          </Animated.View>
          <View style={styles.glowRing} />
        </View>

        {/* Title */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
          <Text style={styles.title}>Payment successful!</Text>
          <Text style={styles.subtitle}>
            The transaction has been confirmed. The order is being prepared.
          </Text>
        </Animated.View>

        {/* Success Badge */}
        <Animated.View style={[styles.successBadge, { opacity: fadeAnim }]}>
          <Ionicons name="shield-checkmark-outline" size={15} color="#34d399" />
          <Text style={styles.successBadgeText}>The transaction is secure.</Text>
        </Animated.View>

        {/* Card */}
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
                <View style={styles.paidTag}>
                  <Text style={styles.paidTagText}>PAYMENT COMPLETED</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {infoRows.map((row, index) => (
                <View
                  key={index}
                  style={[
                    styles.infoRow,
                    index === infoRows.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.infoLeft}>
                    <View
                      style={[
                        styles.rowIconWrap,
                        row.success && styles.rowIconSuccess,
                      ]}
                    >
                      <Ionicons
                        name={row.icon}
                        size={15}
                        color={row.success ? "#34d399" : "#6ee7b7"}
                      />
                    </View>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                  </View>
                  <Text
                    style={[
                      styles.infoValue,
                      row.highlight && styles.infoHighlight,
                      row.success && styles.infoSuccess,
                    ]}
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )
        )}

        {/* Buttons */}
        <Animated.View style={[styles.btnGroup, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("HomePage")} activeOpacity={0.85}>
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

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("OrderHistory")} activeOpacity={0.8}>
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
    width: 130,
    height: 130,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
  glowRing: {
    position: "absolute",
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1.5,
    borderColor: "rgba(16,185,129,0.25)",
  },
  rippleRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(52,211,153,0.5)",
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

  // Badge
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(52,211,153,0.08)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 24,
  },
  successBadgeText: {
    color: "#34d399",
    fontSize: 13,
    fontWeight: "600",
  },

  // Card
  card: {
    width: "100%",
    backgroundColor: "#0d1f17",
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.15)",
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
    flex: 1,
  },
  paidTag: {
    backgroundColor: "rgba(16,185,129,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  paidTagText: {
    color: "#34d399",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(16,185,129,0.1)",
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
  rowIconSuccess: {
    backgroundColor: "rgba(52,211,153,0.15)",
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
  infoSuccess: {
    color: "#6ee7b7",
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
    borderColor: "rgba(16,185,129,0.25)",
    backgroundColor: "rgba(16,185,129,0.05)",
  },
  secondaryText: {
    color: "#10b981",
    fontWeight: "600",
    fontSize: 15,
  },
});