import React, { useState, useRef, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Animated,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const PasswordRulesModal = ({ visible, onAccept, onDecline }) => {
    const [agreed, setAgreed] = useState(false);
    const checkAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(60)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setAgreed(false);
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            slideAnim.setValue(60);
            fadeAnim.setValue(0);
        }
    }, [visible]);

    const toggleAgreed = () => {
        const next = !agreed;
        setAgreed(next);
        Animated.spring(checkAnim, {
            toValue: next ? 1 : 0,
            useNativeDriver: true,
            friction: 4,
            tension: 120,
        }).start();
    };

    const checkScale = checkAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 1],
    });

    const MANDATORY_RULES = [
        { icon: 'text-outline', text: 'Must be 8 characters long' },
        { icon: 'arrow-up-circle-outline', text: 'At least one uppercase letter (A–Z)' },
        { icon: 'arrow-down-circle-outline', text: 'At least one lowercase letter (a–z)' },
        { icon: 'calculator-outline', text: 'At least one number (0–9)' },
    ];

    const SECURITY_TIPS = [
        { icon: 'person-outline', text: 'Avoid easily guessable personal info (name, birthday)' },
        { icon: 'refresh-outline', text: 'Change your password regularly to stay secure' },
        { icon: 'sparkles-outline', text: 'Use special characters to increase strength' },
    ];

    return (
        <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
            <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.6)" />
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    {/* Header */}
                    <LinearGradient
                        colors={COLORS.gradient?.primary ?? ['#4f46e5', '#7c3aed']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <View style={styles.headerIcon}>
                            <Ionicons name="shield-checkmark" size={28} color="#fff" />
                        </View>
                        <Text style={styles.headerTitle}>Password Policy</Text>
                        <Text style={styles.headerSub}>Please read before changing your password</Text>
                    </LinearGradient>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Mandatory Rules */}
                        <View style={styles.section}>
                            <View style={styles.sectionLabel}>
                                <View style={styles.mandatoryBadge}>
                                    <Text style={styles.mandatoryBadgeText}>MANDATORY</Text>
                                </View>
                            </View>
                            <Text style={styles.sectionTitle}>Password Requirements</Text>
                            {MANDATORY_RULES.map((rule, i) => (
                                <View key={i} style={styles.ruleRow}>
                                    <View style={styles.ruleIconWrap}>
                                        <Ionicons name={rule.icon} size={16} color={COLORS.primary ?? '#4f46e5'} />
                                    </View>
                                    <Text style={styles.ruleText}>{rule.text}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Security Tips */}
                        <View style={styles.section}>
                            <View style={styles.sectionLabel}>
                                <View style={styles.tipsBadge}>
                                    <Text style={styles.tipsBadgeText}>TIPS</Text>
                                </View>
                            </View>
                            <Text style={styles.sectionTitle}>Security Recommendations</Text>
                            {SECURITY_TIPS.map((tip, i) => (
                                <View key={i} style={styles.ruleRow}>
                                    <View style={styles.tipIconWrap}>
                                        <Ionicons name={tip.icon} size={16} color="#f59e0b" />
                                    </View>
                                    <Text style={styles.ruleText}>{tip.text}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Agreement Checkbox */}
                        <TouchableOpacity
                            style={[styles.checkboxRow, agreed && styles.checkboxRowActive]}
                            onPress={toggleAgreed}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                                {agreed && (
                                    <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                                        <Ionicons name="checkmark" size={14} color="#fff" />
                                    </Animated.View>
                                )}
                            </View>
                            <Text style={[styles.checkboxLabel, agreed && styles.checkboxLabelActive]}>
                                I have read and agree to the password policy
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Buttons */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
                            <Text style={styles.declineBtnText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.acceptBtn, !agreed && styles.acceptBtnDisabled]}
                            onPress={agreed ? onAccept : undefined}
                            activeOpacity={agreed ? 0.8 : 1}
                        >
                            <LinearGradient
                                colors={
                                    agreed
                                        ? (COLORS.gradient?.primary ?? ['#4f46e5', '#7c3aed'])
                                        : ['#d1d5db', '#d1d5db']
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.acceptBtnGradient}
                            >
                                <Ionicons
                                    name="lock-open-outline"
                                    size={18}
                                    color={agreed ? '#fff' : '#9ca3af'}
                                    style={{ marginRight: 6 }}
                                />
                                <Text style={[styles.acceptBtnText, !agreed && styles.acceptBtnTextDisabled]}>
                                    Continue
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    container: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#fff',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 16,
    },
    header: {
        paddingTop: 28,
        paddingBottom: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.4,
    },
    headerSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
        textAlign: 'center',
    },
    scroll: {
        maxHeight: 400,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
    },
    section: {
        marginBottom: 4,
    },
    sectionLabel: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    mandatoryBadge: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    mandatoryBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ef4444',
        letterSpacing: 0.8,
    },
    tipsBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    tipsBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#d97706',
        letterSpacing: 0.8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    ruleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    ruleIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ede9fe',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 1,
    },
    tipIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 1,
    },
    ruleText: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        lineHeight: 21,
    },
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginVertical: 16,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        marginBottom: 4,
    },
    checkboxRowActive: {
        backgroundColor: '#ede9fe',
        borderColor: COLORS.primary ?? '#4f46e5',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#d1d5db',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary ?? '#4f46e5',
        borderColor: COLORS.primary ?? '#4f46e5',
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 19,
        fontWeight: '500',
    },
    checkboxLabelActive: {
        color: '#1f2937',
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    declineBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6b7280',
    },
    acceptBtn: {
        flex: 1.6,
        borderRadius: 12,
        overflow: 'hidden',
    },
    acceptBtnDisabled: {
        opacity: 0.75,
    },
    acceptBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    acceptBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    acceptBtnTextDisabled: {
        color: '#9ca3af',
    },
});

export default PasswordRulesModal;