import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { sendOtp, resetOtpState } from '../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';


const { height } = Dimensions.get('window');

const RegisterScreen = () => {
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const dispatch = useDispatch();
    const { isLoading, otpStatus, otpMessage } = useSelector((state) => state.auth);

    // Reset OTP state khi component mount
    useEffect(() => {
        dispatch(resetOtpState());
        // Clear input fields
        setUserName('');
        setEmail('');
        setPassword('');
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
        if (otpStatus === 'success') {
            Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: otpMessage,
            });
            // TODO: điều hướng sang màn hình OTP sau 1s
            setTimeout(() => {
                navigation.navigate('VerifyOtp', { email }); // hoặc màn nào bạn muốn
            }, 1000);
        } else if (otpStatus === 'error') {
            console.log('OTP Error Message:', otpMessage); // Debug log

            const errorType = getErrorType(otpMessage);

            switch (errorType) {
                case 'username':
                    Toast.show({
                        type: 'error',
                        text1: 'Lỗi',
                        text2: 'Username đã tồn tại',
                    });
                    break;
                case 'email':
                    Toast.show({
                        type: 'error',
                        text1: 'Lỗi',
                        text2: 'Email đã tồn tại',
                    });
                    break;
                default:
                    Toast.show({
                        type: 'error',
                        text1: 'Lỗi',
                        text2: otpMessage || 'Đăng ký thất bại',
                    });
            }

            // Delay reset để Toast có thời gian hiển thị
            setTimeout(() => {
                dispatch(resetOtpState());
            }, 100);
        }
    }, [otpStatus, otpMessage]);

    // Helper function để kiểm tra loại lỗi
    const getErrorType = (message) => {
        if (!message) return null;

        const lowerMessage = message.toLowerCase();

        // Kiểm tra lỗi username
        const usernameErrors = [
            'username already taken',
            'user_name already exists',
            'username already exists',
            'user already exists',
            'tên người dùng đã tồn tại',
            'username đã tồn tại'
        ];

        // Kiểm tra lỗi email
        const emailErrors = [
            'email already taken',
            'email already exists',
            'email already registered',
            'email đã tồn tại',
            'email đã được đăng ký',
            'email is already in use'
        ];

        if (usernameErrors.some(error => lowerMessage.includes(error))) {
            return 'username';
        }

        if (emailErrors.some(error => lowerMessage.includes(error))) {
            return 'email';
        }

        return 'other';
    };

    const handleRegister = () => {
        if (!userName.trim() || !email.trim() || !password.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Vui lòng điền đầy đủ thông tin',
            });
            return;
        }

        // Kiểm tra Username không được để trống sau khi trim
        if (userName.trim().length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Username không được để trống',
            });
            return;
        }

        // Kiểm tra độ dài username
        if (userName.trim().length < 3) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Username phải có ít nhất 3 ký tự',
            });
            return;
        }

        // // Kiểm Username không được có số
        // const hasNumber = /\d/;
        // if (hasNumber.test(userName)) {
        //     Toast.show({
        //         type: 'error',
        //         text1: 'Lỗi',
        //         text2: 'Username không được chứa số',
        //     });
        //     return;
        // }

        // Kiểm tra họ không được có ký tự đặc biệt (chỉ cho phép chữ cái, dấu cách và dấu tiếng Việt)
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
        if (hasSpecialChar.test(userName)) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Username không được chứa ký tự đặc biệt',
            });
            return;
        }

        // Kiểm tra định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Email không hợp lệ',
            });
            return;
        }

        dispatch(sendOtp({ user_name: userName, email, password }));
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

            <View style={styles.loginContainer}>
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Text style={styles.title}>Đăng Ký</Text>

                    <View style={styles.inputContainer}>
                        <User color="#13C2C2" size={20} />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Username"
                            placeholderTextColor="#aaa"
                            value={userName}
                            onChangeText={setUserName}
                            required
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Mail color="#13C2C2" size={20} />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Email"
                            placeholderTextColor="#aaa"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            required
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Lock color="#13C2C2" size={20} />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Mật khẩu"
                            placeholderTextColor="#aaa"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            required
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.disabledButton]}
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Gửi OTP</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Đã có tài khoản?</Text>
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
    loginContainer: {
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
        marginBottom: 30,
        textAlign: 'center',
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
    loginButton: {
        backgroundColor: '#13C2C2',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    loginButtonText: {
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

export default RegisterScreen;
