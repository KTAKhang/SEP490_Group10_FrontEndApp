import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const AuthRequiredModal = ({ visible, onClose, title, message, actionText = 'Đăng nhập' }) => {
    const navigation = useNavigation();

    const handleLogin = () => {
        onClose();
        navigation.navigate('Login');
    };

    const handleRegister = () => {
        onClose();
        navigation.navigate('Register');
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        style={styles.header}
                    >
                        <Icon name="lock" size={40} color={COLORS.white} />
                        <Text style={styles.title}>{title || 'Yêu cầu đăng nhập'}</Text>
                    </LinearGradient>

                    <View style={styles.content}>
                        <Text style={styles.message}>
                            {message || 'Bạn cần đăng nhập để sử dụng tính năng này.'}
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleLogin}
                            >
                                <Icon name="login" size={20} color={COLORS.white} />
                                <Text style={styles.loginButtonText}>{actionText}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={handleRegister}
                            >
                                <Icon name="person-add" size={20} color={COLORS.primary} />
                                <Text style={styles.registerButtonText}>Đăng ký</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: COLORS.shadow?.dark || '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    header: {
        padding: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.white,
        marginTop: 15,
        textAlign: 'center',
    },
    content: {
        padding: 25,
    },
    message: {
        fontSize: 16,
        color: COLORS.text?.secondary || '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    buttonContainer: {
        gap: 12,
        marginBottom: 20,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        elevation: 3,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        gap: 8,
    },
    loginButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.primary,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    registerButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    cancelButtonText: {
        color: COLORS.text?.secondary || '#999',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default AuthRequiredModal; 