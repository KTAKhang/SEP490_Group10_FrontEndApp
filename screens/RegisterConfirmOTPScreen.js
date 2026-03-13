import React, { useState, useRef, useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { confirmOtp, resetConfirmOtpState } from '../store/slices/authSlice';
import Toast from 'react-native-toast-message';

const { height } = Dimensions.get('window');

const RegisterConfirmOTPScreen = ({ navigation, route }) => {
    const { t } = useTranslation();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);
    const dispatch = useDispatch();
    const { confirmOtpStatus, confirmOtpMessage, isLoading } = useSelector((state) => state.auth);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Reset state khi component mount
    useEffect(() => {
        dispatch(resetConfirmOtpState());
        // Focus vào ô đầu tiên
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 500);
    }, [dispatch]);

    // Xử lý trạng thái từ Redux
    useEffect(() => {
        if (confirmOtpStatus === 'error' && confirmOtpMessage) {
            const errorMessage = getErrorMessage(confirmOtpMessage);
            Toast.show({
                type: 'error',
                text1: t('auth.confirmError'),
                text2: errorMessage,
                visibilityTime: 4000,
            });

            // Reset state sau khi hiển thị
            setTimeout(() => {
                dispatch(resetConfirmOtpState());
            }, 100);
        }
    }, [confirmOtpStatus, confirmOtpMessage, dispatch]);

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

    const getErrorMessage = (error) => {
        if (!error) return t('auth.confirmError');
        const lowerError = error.toLowerCase();
        if (lowerError.includes('invalid or expired otp') || lowerError.includes('invalid otp') || lowerError.includes('otp is invalid'))
            return t('auth.invalidOtpCode');
        if (lowerError.includes('otp expired') || lowerError.includes('otp has expired')) return t('auth.otpExpiredMsg');
        if (lowerError.includes('wrong otp') || lowerError.includes('incorrect otp')) return t('auth.invalidOtpCode');
        if (lowerError.includes('otp not found')) return t('auth.pleaseEnterOtp');
        if (lowerError.includes('too many attempts')) return t('auth.tooManyAttempts');
        return error;
    };

    const handleOtpChange = (text, index) => {
        // Chỉ cho phép nhập số
        if (!/^\d*$/.test(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Tự động chuyển sang ô tiếp theo khi nhập
        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        // Xử lý phím Backspace
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleConfirm = async () => {
        const otpString = otp.join('');

        // Kiểm tra OTP có bị bỏ trống không
        if (!otpString.trim()) {
            Toast.show({
                type: 'error',
                text1: t('common.error'),
                text2: t('auth.pleaseEnterOtp'),
            });
            return;
        }

        if (otpString.length < 6) {
            Toast.show({
                type: 'error',
                text1: t('common.error'),
                text2: t('auth.otpMustBe6Digits', { count: otpString.length }),
            });
            return;
        }

        // Kiểm tra OTP chỉ chứa số
        if (!/^\d{6}$/.test(otpString)) {
            Toast.show({
                type: 'error',
                text1: t('common.error'),
                text2: t('auth.otpDigitsOnly'),
            });
            return;
        }

        // Log để debug
        // console.log('Submitting OTP:', otpString);

        const email = route.params?.email || '';
        const resultAction = await dispatch(confirmOtp({ email, otp: otpString }));

        if (confirmOtp.fulfilled.match(resultAction)) {
            Toast.show({
                type: 'success',
                text1: t('auth.success'),
                text2: t('auth.registerSuccessRedirect'),
                visibilityTime: 2000,
            });

            setTimeout(() => {
                navigation.navigate('Login');
            }, 2000);
        } else {
            // console.log('OTP Error:', resultAction.payload); // Debug log
            const errorMessage = getErrorMessage(resultAction.payload);

            Toast.show({
                type: 'error',
                text1: t('auth.confirmError'),
                text2: errorMessage,
                visibilityTime: 4000,
            });

            // Clear OTP nếu sai
            if (confirmOtp.rejected.match(resultAction)) {
                setTimeout(() => clearOtp(), 1000);
            }
        }
    };

    const clearOtp = () => {
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
    };

    return (
        <LinearGradient
            colors={['#0D364C', '#22c55e']}
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
                    <Text style={styles.title}>{t('auth.verifyOtp')}</Text>
                    <Text style={styles.subtitle}>
                        {t('auth.otpSentToEmailPrompt')}
                    </Text>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={[
                                    styles.otpInput,
                                    digit ? styles.otpInputFilled : null
                                ]}
                                value={digit}
                                onChangeText={(text) => handleOtpChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="numeric"
                                maxLength={1}
                                textAlign="center"
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    <TouchableOpacity style={styles.clearButton} onPress={clearOtp}>
                        <Text style={styles.clearButtonText}>{t('auth.clearAndReenter')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.disabledButton]}
                        onPress={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>{t('common.confirm')}</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </LinearGradient>
    );
};

export default RegisterConfirmOTPScreen;

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
        color: '#22c55e',
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
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    otpInput: {
        width: 45,
        height: 50,
        borderWidth: 2,
        borderColor: '#22c55e',
        borderRadius: 8,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        backgroundColor: '#fff',
    },
    otpInputFilled: {
        borderColor: '#0D364C',
        backgroundColor: '#fff',
    },
    clearButton: {
        alignItems: 'center',
        marginBottom: 20,
    },
    clearButtonText: {
        color: '#22c55e',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    submitButton: {
        backgroundColor: '#22c55e',
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
    disabledButton: {
        opacity: 0.7,
    },
});