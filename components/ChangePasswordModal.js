import React from 'react';
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
    return (
        <Modal visible={visible} animationType="slide" transparent>
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
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Đổi mật khẩu</Text>
                        <View style={styles.placeholder} />
                    </LinearGradient>

                    {/* Content */}
                    <View style={styles.content}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                            <TextInput
                                placeholder="Mật khẩu hiện tại"
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
                                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
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
                                placeholder="Xác nhận mật khẩu"
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
                                onPress={onClose}
                                disabled={isLoading}
                            >
                                <Text style={styles.cancelButtonText}>Huỷ</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.submitButton, isLoading && styles.disabledButton]}
                                onPress={onSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <Text style={styles.submitButtonText}>Xác nhận</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
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
    placeholder: {
        width: 40,
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