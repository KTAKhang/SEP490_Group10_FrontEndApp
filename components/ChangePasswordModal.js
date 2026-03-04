import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import PasswordRulesModal from './PasswordRulesModal';

const ChangePasswordModal = ({
    visible,
    onClose,
    currentPassword,
    newPassword,
    confirmPassword,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    onSubmit,
    isLoading = false
}) => {
    const [rulesAccepted, setRulesAccepted] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const handleMainVisible = visible && rulesAccepted;
    const handleRulesVisible = visible && !rulesAccepted || showRules;

    const handleRulesAccept = () => {
        setRulesAccepted(true);
        setShowRules(false);
    };

    const handleRulesDecline = () => {
        setRulesAccepted(false);
        setShowRules(false);
        onClose();
    };

    const handleClose = () => {
        setRulesAccepted(false);
        onClose();
    };

    return (
        <>
            {/* Step 1: Password Rules Gate */}
            <PasswordRulesModal
                visible={visible && !rulesAccepted}
                onAccept={handleRulesAccept}
                onDecline={handleRulesDecline}
            />

            {/* Step 2: Change Password Form */}
            <Modal visible={handleMainVisible} animationType="slide" transparent>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {/* Gradient Header */}
                        <LinearGradient
                            colors={COLORS.gradient.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.headerGradient}
                        >
                            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                <Ionicons name="close" size={24} color={COLORS.white} />
                            </TouchableOpacity>
                            <Text style={styles.title}>Change password</Text>
                            {/* Info button to re-open rules */}
                            <TouchableOpacity
                                style={styles.infoButton}
                                onPress={() => setShowRules(true)}
                            >
                                <Ionicons name="information-circle-outline" size={24} color={COLORS.white} />
                            </TouchableOpacity>
                        </LinearGradient>

                        {/* Content */}
                        <View style={styles.content}>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                                <TextInput
                                    placeholder="Current password"
                                    placeholderTextColor={COLORS.text.light}
                                    secureTextEntry
                                    style={styles.input}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    editable={!isLoading}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="key-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                                <TextInput
                                    placeholder="New password (8+ chars, uppercase, lowercase, number)"
                                    placeholderTextColor={COLORS.text.light}
                                    secureTextEntry
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    editable={!isLoading}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                                <TextInput
                                    placeholder="Confirm password"
                                    placeholderTextColor={COLORS.text.light}
                                    secureTextEntry
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    editable={!isLoading}
                                />
                            </View>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.cancelButton, isLoading && styles.disabledButton]}
                                    onPress={handleClose}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.submitButton, isLoading && styles.disabledButton]}
                                    onPress={onSubmit}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color={COLORS.white} />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Confirm</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Rules modal khi user bấm icon info */}
                <PasswordRulesModal
                    visible={showRules}
                    onAccept={() => setShowRules(false)}
                    onDecline={() => setShowRules(false)}
                />
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: COLORS.white,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: COLORS.shadow.dark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    headerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
        elevation: 5,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.white,
        textAlign: 'center',
        flex: 1,
    },
    content: {
        padding: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border.light,
        borderRadius: 12,
        backgroundColor: COLORS.white,
        marginBottom: 16,
        paddingHorizontal: 16,
        shadowColor: COLORS.shadow.light,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: COLORS.text.primary,
        backgroundColor: 'transparent',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        gap: 12,
    },
    cancelButton: {
        backgroundColor: COLORS.text.light,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
        shadowColor: COLORS.shadow.medium,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 3,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        shadowColor: COLORS.shadow.medium,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 3,
    },
    disabledButton: {
        opacity: 0.6,
    },
    cancelButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 16,
    },
    submitButtonText: {
        color: COLORS.white,
        fontWeight: '600',
        fontSize: 16,
    },
});

export default ChangePasswordModal;