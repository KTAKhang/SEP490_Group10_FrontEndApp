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
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, resetResetPasswordState } from '../store/slices/authSlice';
import Toast from 'react-native-toast-message';

const { height } = Dimensions.get('window');

const ForgotPasswordOTPScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    const { email } = route.params;
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const inputRefs = useRef([]);
    const dispatch = useDispatch();
    const { resetPasswordStatus, resetPasswordMessage, isLoading } = useSelector((state) => state.auth);


    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        dispatch(resetResetPasswordState());
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 500);
    }, [dispatch]);

    useEffect(() => {
        if (resetPasswordStatus === 'success') {
            Toast.show({
                type: 'success',
                text1: t('auth.success'),
                text2: t('auth.passwordResetSuccess'),
            });
            setTimeout(() => {
                navigation.navigate('Login');
            }, 1500);
        } else if (resetPasswordStatus === 'error') {
            Toast.show({
                type: 'error',
                text1: t('common.error'),
                text2: getErrorMessage(resetPasswordMessage),
            });
            setTimeout(() => {
                dispatch(resetResetPasswordState());
            }, 100);
        }
    }, [resetPasswordStatus, resetPasswordMessage, navigation, dispatch]);

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
        if (!error) return t('auth.passwordResetFailed');
        const lowerError = error.toLowerCase();
        if (lowerError.includes('invalid') || lowerError.includes('incorrect')) return t('auth.invalidOtpCode');
        if (lowerError.includes('expired')) return t('auth.otpExpiredMsg');
        if (lowerError.includes('too many attempts')) return t('auth.tooManyAttempts');
        if (lowerError.includes('password must contain at least 8 characters') || lowerError.includes('8 characters') || lowerError.includes('uppercase') || lowerError.includes('number'))
            return t('auth.passwordRequirements');
        return error;
    };

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) errors.push(t('auth.passwordReq8'));
        if (!/[A-Z]/.test(password)) errors.push(t('auth.passwordReqUpper'));
        if (!/[0-9]/.test(password)) errors.push(t('auth.passwordReqDigit'));
        return errors;
    };

    const handleOtpChange = (text, index) => {
        if (!/^[0-9]*$/.test(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResetPassword = () => {
        const otpString = otp.join('');

        if (!otpString.trim()) {
            Toast.show({
                type: 'error',
                text1: t('common.error'),
                text2: t('auth.enterOtpCode'),
            });
            return;
        }


        if (otpString.length < 6) {
            Toast.show({
                type: 'error',
                text1: t('common.error'),
                text2: t('auth.otpMustBe6Current', { count: otpString.length }),
            });
            return;
        }

        if (!/^[0-9]*$/.test(otpString)) {
            Toast.show({
                type: 'error',
                text1: t('common.error'),
                text2: t('auth.otpDigitsOnly'),
            });
            return;
        }

        if (!newPassword) {
            Toast.show({
                type: 'error',
                text1: t('common.error'),
                text2: t('auth.enterNewPassword'),
            });
            return;
        }

        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            Toast.show({
                type: 'error',
                text1: t('common.error'),
                text2: t('auth.passwordRequired', { requirements: passwordErrors.join(', ') }),
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: t('common.error'),
                text2: t('auth.passwordMismatch'),
            });
            return;
        }

        dispatch(resetPassword({ email, otp: otpString, newPassword }));
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
                    <Text style={styles.title}>{t('auth.resetPassword')}</Text>
                    <Text style={styles.subtitle}>
                        {t('auth.resetPasswordSubtitle')}
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
                        <Text style={styles.clearButtonText}>{t('auth.clearAndReenterOtp')}</Text>
                    </TouchableOpacity>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.inputField}
                            placeholder={t('auth.newPassword')}
                            placeholderTextColor="#aaa"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff color="#22c55e" size={20} />
                            ) : (
                                <Eye color="#22c55e" size={20} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputContainer, styles.confirmPasswordContainer]}>
                        <TextInput
                            style={styles.inputField}
                            placeholder={t('auth.confirmPassword')}
                            placeholderTextColor="#aaa"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff color="#22c55e" size={20} />
                            ) : (
                                <Eye color="#22c55e" size={20} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.disabledButton]}
                        onPress={handleResetPassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>{t('auth.resetPassword')}</Text>
                        )}
                    </TouchableOpacity>
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
        borderColor: '#13C2C2',
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#22c55e',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 5,
        marginBottom: 20,
        backgroundColor: '#fff',
        minHeight: 50,
    },
    confirmPasswordContainer: {
        marginBottom: 10,
    },
    inputField: {
        flex: 1,
        fontSize: 16,
        color: '#000',
        paddingVertical: 8,
    },
    eyeIcon: {
        padding: 5,
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

export default ForgotPasswordOTPScreen;