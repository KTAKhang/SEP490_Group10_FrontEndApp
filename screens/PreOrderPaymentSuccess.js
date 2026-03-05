import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function PreOrderPaymentSuccess({ navigation, route }) {
  const { t } = useTranslation();
  const isRemaining = route.params?.remaining === "success" || route.params?.type === "remaining";

  return (
    <LinearGradient
      colors={["#0f0f1a", "#12111f", "#0d1320"]}
      style={styles.container}
    >
      <View style={styles.iconWrapper}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>
      </View>

      <Text style={styles.title}>{t('payment.preOrderSuccessTitle')}</Text>
      <Text style={styles.subtitle}>
        {isRemaining ? t('preOrder.remainingSuccess') : t('preOrder.depositSuccess')}
      </Text>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate("PreOrderHistory", { remaining: isRemaining ? "success" : undefined })}
      >
        <Text style={styles.primaryText}>{t('payment.viewPreOrders')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate("HomePage")}
      >
        <Text style={styles.secondaryText}>{t('payment.backHome')}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconWrapper: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 40,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#10b981",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "bold",
  },
  secondaryBtn: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#444",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryText: {
    color: "#aaa",
  },
});
