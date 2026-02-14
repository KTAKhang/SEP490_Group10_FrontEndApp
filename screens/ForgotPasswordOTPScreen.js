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
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, resetResetPasswordState } from '../store/slices/authSlice';
import Toast from 'react-native-toast-message';

const { height } = Dimensions.get('window');


const ForgotPasswordOTPScreen = ({ route, navigation }) => {
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
                text1: 'Thành công',
                text2: 'Mật khẩu đã được đặt lại thành công',
            });
            setTimeout(() => {
                navigation.navigate('Login');
            }, 1500);
        } else if (resetPasswordStatus === 'error') {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
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
        if (!error) return 'Đặt lại mật khẩu thất bại';

        const lowerError = error.toLowerCase();

        if (lowerError.includes('invalid') || lowerError.includes('incorrect')) {
            return 'Mã OTP không hợp lệ';
        }
        if (lowerError.includes('expired')) {
            return 'Mã OTP đã hết hạn';
        }
        if (lowerError.includes('too many attempts')) {
            return 'Bạn đã thử quá nhiều lần, vui lòng thử lại sau';
        }
        if (lowerError.includes('password must contain at least 8 characters') ||
            lowerError.includes('8 characters') ||
            lowerError.includes('uppercase') ||
            lowerError.includes('number')) {
            return 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm 1 chữ hoa và 1 chữ số';
        }

        return error;
    };

    const validatePassword = (password) => {
        const errors = [];

        if (password.length < 8) {
            errors.push('ít nhất 8 ký tự');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('ít nhất 1 ký tự viết hoa');
        }

        if (!/[0-9]/.test(password)) {
            errors.push('ít nhất 1 chữ số');
        }

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
                text1: 'Lỗi',
                text2: 'Vui lòng nhập mã OTP',
            });
            return;
        }


        if (otpString.length < 6) {

            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: `Mã OTP phải có đủ 6 số (hiện tại: ${otpString.length} số)`,
            });
            return;
        }

        if (!/^[0-9]*$/.test(otpString)) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Mã OTP chỉ được chứa số',
            });
            return;
        }

        if (!newPassword) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Vui lòng nhập mật khẩu mới',
            });
            return;
        }

        // Kiểm tra tính hợp lệ của mật khẩu
        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: `Mật khẩu phải có ${passwordErrors.join(', ')}`,
            });
            return;
        }


        if (newPassword !== confirmPassword) {

            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Mật khẩu xác nhận không khớp',
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
                    <Text style={styles.title}>Đặt Lại Mật Khẩu</Text>
                    <Text style={styles.subtitle}>
                        Nhập mã OTP đã được gửi đến email của bạn và mật khẩu mới
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
                        <Text style={styles.clearButtonText}>Xóa và nhập lại OTP</Text>
                    </TouchableOpacity>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.inputField}
                            placeholder="Mật khẩu mới"
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
                                <EyeOff color="#13C2C2" size={20} />
                            ) : (
                                <Eye color="#13C2C2" size={20} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputContainer, styles.confirmPasswordContainer]}>
                        <TextInput
                            style={styles.inputField}
                            placeholder="Xác nhận mật khẩu"
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
                                <EyeOff color="#13C2C2" size={20} />
                            ) : (
                                <Eye color="#13C2C2" size={20} />
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
                            <Text style={styles.submitButtonText}>Đặt Lại Mật Khẩu</Text>
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
        color: '#13C2C2',
        fontSize: 14,
        textDecorationLine: 'underline',
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
    disabledButton: {
        opacity: 0.7,
    },
});

export default ForgotPasswordOTPScreen;