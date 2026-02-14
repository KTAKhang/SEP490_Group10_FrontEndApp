import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, resetForgotPasswordState } from '../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const { height } = Dimensions.get('window');

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const navigation = useNavigation();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const dispatch = useDispatch();
    const { isLoading, forgotPasswordStatus, forgotPasswordMessage } = useSelector((state) => state.auth);

    // Helper function để dịch lỗi sang tiếng Việt
    const getErrorMessage = (error) => {
        if (!error) return 'Có lỗi xảy ra';

        const lowerError = error.toLowerCase();

        // Các lỗi phổ biến
        if (lowerError.includes('email does not exist') || lowerError.includes('email not found')) {
            return 'Email không tồn tại trong hệ thống';
        }
        if (lowerError.includes('invalid email')) {
            return 'Email không hợp lệ';
        }
        if (lowerError.includes('user not found')) {
            return 'Không tìm thấy người dùng với email này';
        }
        if (lowerError.includes('email already sent')) {
            return 'Email đã được gửi, vui lòng kiểm tra hộp thư';
        }
        if (lowerError.includes('too many attempts')) {
            return 'Bạn đã thử quá nhiều lần, vui lòng thử lại sau';
        }

        // Trả về message gốc nếu không match
        return error;
    };

    // Reset state khi component mount
    useEffect(() => {
        dispatch(resetForgotPasswordState());
    }, [dispatch]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        if (forgotPasswordStatus === 'success') {
            Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Mã OTP đã được gửi đến email của bạn',
            });
            // Chuyển sang trang nhập OTP thay vì quay về Login 
            navigation.navigate('ForgotPasswordOTP', { email });
        } else if (forgotPasswordStatus === 'error') {
            console.log('Forgot Password Error:', forgotPasswordMessage); // Debug log
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: getErrorMessage(forgotPasswordMessage),
            });
            // Reset state sau khi hiển thị lỗi
            setTimeout(() => {
                dispatch(resetForgotPasswordState());
            }, 100);
        }
    }, [forgotPasswordStatus, forgotPasswordMessage, email, navigation, dispatch]);

    const handleForgotPassword = () => {
        if (!email.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Vui lòng nhập địa chỉ email',
            });
            return;
        }

        // Kiểm tra định dạng email cơ bản
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Vui lòng nhập địa chỉ email hợp lệ',
            });
            return;
        }

        dispatch(forgotPassword({ email }));
    };

    return (
        <LinearGradient
            colors={['#0D364C', '#13C2C2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.backgroundElements}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
                <View style={[styles.circle, styles.circle3]} />
                <View style={[styles.circle, styles.circle4]} />
            </View>

            {/* Header với nút quay lại */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Text style={styles.title}>Quên Mật Khẩu</Text>
                    <Text style={styles.subtitle}>
                        Nhập địa chỉ email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
                    </Text>

                    <View style={styles.inputContainer}>
                        <Mail color="#13C2C2" size={20} />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Nhập địa chỉ email"
                            placeholderTextColor="#aaa"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.disabledButton]}
                        onPress={handleForgotPassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Gửi OTP</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Đã nhớ mật khẩu?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.footerLink}> Đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundElements: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        position: 'absolute',
        backgroundColor: '#ffffff20',
        borderRadius: 100,
    },
    circle1: {
        width: 200,
        height: 200,
        top: -50,
        left: -50,
    },
    circle2: {
        width: 150,
        height: 150,
        bottom: -30,
        right: -30,
    },
    circle3: {
        width: 100,
        height: 100,
        top: height / 3,
        left: -40,
    },
    circle4: {
        width: 120,
        height: 120,
        bottom: height / 4,
        right: -40,
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffffff30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    card: {
        backgroundColor: '#ffffffcc',
        borderRadius: 20,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0D364C',
        marginBottom: 15,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#13C2C2',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 5,
        marginBottom: 20,
        backgroundColor: '#fff',
        minHeight: 50,
    },
    inputField: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#000',
        paddingVertical: 8,
    },
    submitButton: {
        backgroundColor: '#13C2C2',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        color: '#333',
        fontSize: 14,
    },
    footerLink: {
        color: '#13C2C2',
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.7,
    },
});

export default ForgotPasswordScreen;