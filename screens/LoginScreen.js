import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, Home } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import { handleLoginSuccess } from '../utils/authUtils';
import Toast from 'react-native-toast-message';

const { height } = Dimensions.get('window');

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigation = useNavigation();
    const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

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
        if (error) {
            Alert.alert('Đăng Nhập Thất Bại', 'Vui lòng kiểm tra lại email và mật khẩu');
        }
    }, [error]);

    // Tự động chuyển về HomePage khi đăng nhập thành công
    useEffect(() => {
        if (isAuthenticated && user) {
            Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Đăng nhập thành công!',
                visibilityTime: 2000,
            });
            
            // Sử dụng utility function để navigate
            handleLoginSuccess(navigation, user);
        }
    }, [isAuthenticated, user, navigation]);

    const handleLogin = () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
            return;
        }
        dispatch(loginUser({ email: email.trim(), password }));
    };

    const handleGoHome = () => {
        navigation.navigate('HomePage');
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
                    {/* Header với nút về trang chủ */}
                    <View style={styles.headerContainer}>
                        <TouchableOpacity
                            style={styles.homeButton}
                            onPress={handleGoHome}
                            activeOpacity={0.7}
                        >
                            <Home color="#13C2C2" size={20} />
                            <Text style={styles.homeButtonText}>Về trang chủ</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.title}>Đăng Nhập</Text>

                    {/* Email Input */}
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
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Lock color="#13C2C2" size={20} />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Mật khẩu"
                            placeholderTextColor="#aaa"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            {showPassword ? (
                                <EyeOff color="#13C2C2" size={20} />
                            ) : (
                                <Eye color="#13C2C2" size={20} />
                            )}
                        </TouchableOpacity>
                    </View>
                    {/* Forgot Password Button */}
                    <TouchableOpacity
                        style={styles.forgotPasswordButton}
                        onPress={() => navigation.navigate('ForgotPassword')} // Điều hướng đến màn hình quên mật khẩu
                    >
                        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.disabledButton]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Đăng nhập</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Bạn chưa có tài khoản?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.footerLink}> Đăng ký</Text>
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
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 10,
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(19, 194, 194, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(19, 194, 194, 0.3)',
    },
    homeButtonText: {
        color: '#13C2C2',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
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
    forgotPasswordButton: {
        marginRight: 10,
        alignItems: 'flex-end',
    },
    forgotPasswordText: {
        color: '#13C2C2',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default LoginScreen;
