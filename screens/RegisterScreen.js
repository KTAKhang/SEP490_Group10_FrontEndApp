import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, Phone, Home, Key, MapPin, Calendar, Eye, EyeOff } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { sendOtp, resetOtpState, confirmOtp } from '../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_BASE = 'https://provinces.open-api.vn/api/v2';
const { height } = Dimensions.get('window');

// ─── Reusable Field Component ────────────────────────────────────────────────
const Field = ({ icon, error, children }) => (
    <View style={{ marginBottom: 16 }}>
        <View style={[styles.inputContainer, error ? styles.inputError : null]}>
            {icon}
            {children}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const RegisterScreen = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const { isLoading, otpStatus, otpMessage, confirmOtpLoading, confirmOtpStatus, confirmOtpMessage } =
        useSelector((state) => state.auth);

    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState({});
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Location data
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvinceName, setSelectedProvinceName] = useState('');

    // Simple picker modal states
    const [showProvincePicker, setShowProvincePicker] = useState(false);
    const [showWardPicker, setShowWardPicker] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        user_name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        city: '',
        ward: '',
        birthday: '',
        gender: '',
        otp: '',
    });

    // ── Animations ──────────────────────────────────────────────────────────
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();
    }, []);

    // ── Load Provinces ──────────────────────────────────────────────────────
    useEffect(() => {
        axios
            .get(`${API_BASE}/p/`)
            .then((res) => setProvinces(res.data))
            .catch((err) => console.error('Error loading provinces:', err));
    }, []);

    // ── Load Wards when city changes ────────────────────────────────────────
    useEffect(() => {
        if (!formData.city) {
            setWards([]);
            setField('ward', '');
            return;
        }
        axios
            .get(`${API_BASE}/w/`)
            .then((res) => {
                const filtered = res.data.filter(
                    (w) => w.province_code === Number(formData.city)
                );
                setWards(filtered);
            })
            .catch((err) => console.error(err));
    }, [formData.city]);

    // ── Redux OTP send response ─────────────────────────────────────────────
    useEffect(() => {
        dispatch(resetOtpState());
    }, [dispatch]);

    useEffect(() => {
        if (otpStatus === 'success') {
            Toast.show({ type: 'success', text1: 'Success', text2: otpMessage });
            setStep(2);
            setTimeout(() => dispatch(resetOtpState()), 100);
        } else if (otpStatus === 'error') {
            const errorType = getErrorType(otpMessage);
            const msg =
                errorType === 'username'
                    ? 'Username already taken'
                    : errorType === 'email'
                    ? 'Email already taken'
                    : otpMessage || 'Registration failed';
            Toast.show({ type: 'error', text1: 'Error', text2: msg });
            setTimeout(() => dispatch(resetOtpState()), 100);
        }
    }, [otpStatus, otpMessage]);

    // ── Redux OTP confirm response ──────────────────────────────────────────
    useEffect(() => {
        if (confirmOtpStatus === 'success') {
            Toast.show({ type: 'success', text1: 'Thành công', text2: confirmOtpMessage });
            setTimeout(() => navigation.navigate('Login'), 1200);
        } else if (confirmOtpStatus === 'error') {
            Toast.show({ type: 'error', text1: 'Lỗi', text2: confirmOtpMessage  });
        }
    }, [confirmOtpStatus, confirmOtpMessage]);

    // ── Helpers ─────────────────────────────────────────────────────────────
    const setField = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
    };

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const getErrorType = (message) => {
        if (!message) return null;
        const lower = message.toLowerCase();
        if (['username already taken', 'user_name already exists', 'username already exists'].some((e) => lower.includes(e)))
            return 'username';
        if (['email already taken', 'email already exists', 'email already registered'].some((e) => lower.includes(e)))
            return 'email';
        return 'other';
    };

    // ── Step 1 Validation & Submit ──────────────────────────────────────────
    const handleSendOTP = () => {
        const err = {};
        if (!formData.user_name.trim()) err.user_name = 'Please enter username!';
        else if (formData.user_name.trim().length < 3) err.user_name = 'Username must be at least 3 characters';
        else if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(formData.user_name))
            err.user_name = 'Username must not contain special characters';

        if (!formData.email.trim()) err.email = 'Please enter email!';
        else if (!validateEmail(formData.email)) err.email = 'Invalid email';

        if (!formData.password) err.password = 'Please enter password!';

        if (!formData.phone.trim()) err.phone = 'Please enter phone number!';

        if (!formData.city) err.city = 'Please select a province/city!';
        if (!formData.ward) err.ward = 'Please select a ward!';
        if (!formData.address.trim()) err.address = 'Please enter address!';

        if (!formData.birthday) {
            err.birthday = 'Please select date of birth!';
        } else {
            const dob = new Date(formData.birthday);
            if (isNaN(dob.getTime())) err.birthday = 'Invalid date of birth!';
            else if (dob > new Date()) err.birthday = 'Date of birth cannot be in the future!';
        }

        if (!formData.gender) err.gender = 'Please select gender!';

        if (Object.keys(err).length) {
            setErrors(err);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please check your information' });
            return;
        }

        const fullAddress = `${formData.address}, ${formData.ward}, ${selectedProvinceName}`;
        dispatch(
            sendOtp({
                user_name: formData.user_name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                address: fullAddress,
                birthday: formData.birthday,
                gender: formData.gender,
            })
        );
    };

    // ── Step 2 Confirm OTP ──────────────────────────────────────────────────
    const handleConfirmOTP = () => {
        if (!formData.otp || formData.otp.length !== 6) {
            setErrors({ otp: 'OTP phải đủ 6 số' });
            return;
        }
        console.log("formData.otp",formData.otp)
        dispatch(confirmOtp({ email: formData.email, otp: formData.otp }));
    };

    // ── Picker Rows (simple list overlay) ──────────────────────────────────
    const PickerModal = ({ visible, data, onSelect, onClose, labelKey = 'name' }) => {
        if (!visible) return null;
        return (
            <View style={styles.pickerOverlay}>
                <View style={styles.pickerBox}>
                    <ScrollView>
                        {data.map((item, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.pickerItem}
                                onPress={() => { onSelect(item); onClose(); }}
                            >
                                <Text style={styles.pickerItemText}>{item[labelKey]}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.pickerClose} onPress={onClose}>
                        <Text style={{ color: '#22c55e', fontWeight: '600' }}>Đóng</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const genderOptions = [
        { name: 'Nam', value: 'male' },
        { name: 'Nữ', value: 'female' },
        { name: 'Khác', value: 'other' },
    ];

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <LinearGradient
            colors={['#0D364C', '#22c55e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Background circles */}
            <View style={styles.backgroundElements}>
                <View style={[styles.circle, styles.circle1]} />
                <View style={[styles.circle, styles.circle2]} />
                <View style={[styles.circle, styles.circle3]} />
                <View style={[styles.circle, styles.circle4]} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
                >
                    {/* ── Header ── */}
                    <View style={styles.iconCircle}>
                        {step === 1
                            ? <User color="#fff" size={28} />
                            : <Key color="#fff" size={28} />}
                    </View>
                    <Text style={styles.title}>
                        {step === 1 ? 'Register' : 'Confirm OTP'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 1
                            ? 'Create a new account'
                            : `Enter the OTP sent to\n${formData.email}`}
                    </Text>

                    {/* ══════════ STEP 1 ══════════ */}
                    {step === 1 && (
                        <>
                            {/* Username */}
                            <Field icon={<User color="#22c55e" size={20} />} error={errors.user_name}>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Username"
                                    placeholderTextColor="#aaa"
                                    value={formData.user_name}
                                    onChangeText={(v) => setField('user_name', v)}
                                    autoCapitalize="none"
                                />
                            </Field>

                            {/* Email */}
                            <Field icon={<Mail color="#22c55e" size={20} />} error={errors.email}>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Email"
                                    placeholderTextColor="#aaa"
                                    value={formData.email}
                                    onChangeText={(v) => setField('email', v)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </Field>

                            {/* Password */}
                            <Field icon={<Lock color="#22c55e" size={20} />} error={errors.password}>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Mật khẩu"
                                    placeholderTextColor="#aaa"
                                    value={formData.password}
                                    onChangeText={(v) => setField('password', v)}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                                    {showPassword ? (
                                        <EyeOff color="#22c55e" size={20} />
                                    ) : (
                                        <Eye color="#22c55e" size={20} />
                                    )}
                                </TouchableOpacity>
                            </Field>

                            {/* Phone */}
                            <Field icon={<Phone color="#22c55e" size={20} />} error={errors.phone}>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Phone number"
                                    placeholderTextColor="#aaa"
                                    value={formData.phone}
                                    onChangeText={(v) => setField('phone', v)}
                                    keyboardType="phone-pad"
                                />
                            </Field>

                            {/* City/Province Picker */}
                            <Field icon={<MapPin color="#22c55e" size={20} />} error={errors.city}>
                                <TouchableOpacity
                                    style={styles.pickerTrigger}
                                    onPress={() => setShowProvincePicker(true)}
                                >
                                    <Text style={formData.city ? styles.pickerValue : styles.pickerPlaceholder}>
                                            {selectedProvinceName || 'Select province/city'}
                                        </Text>
                                </TouchableOpacity>
                            </Field>

                            {/* Ward Picker */}
                            <Field icon={<MapPin color="#22c55e" size={20} />} error={errors.ward}>
                                <TouchableOpacity
                                    style={styles.pickerTrigger}
                                    onPress={() => formData.city && setShowWardPicker(true)}
                                >
                                    <Text style={formData.ward ? styles.pickerValue : styles.pickerPlaceholder}>
                                        {formData.ward || (formData.city ? 'Select ward' : 'Select a province/city first')}
                                    </Text>
                                </TouchableOpacity>
                            </Field>

                            {/* Address */}
                            <Field icon={<Home color="#22c55e" size={20} />} error={errors.address}>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Địa chỉ (số nhà, tên đường...)"
                                    placeholderTextColor="#aaa"
                                    value={formData.address}
                                    onChangeText={(v) => setField('address', v)}
                                />
                            </Field>

                            {/* Birthday */}
                            <Field icon={<Calendar color="#22c55e" size={20} />} error={errors.birthday}>
                                <TouchableOpacity
                                    style={styles.pickerTrigger}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={formData.birthday ? styles.pickerValue : styles.pickerPlaceholder}>
                                            {formData.birthday || 'Select date of birth'}
                                        </Text>
                                </TouchableOpacity>
                            </Field>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={formData.birthday ? new Date(formData.birthday) : new Date(2000, 0, 1)}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    maximumDate={new Date()}
                                    onChange={(event, date) => {
                                        setShowDatePicker(false);
                                        if (date) {
                                            const formatted = date.toISOString().split('T')[0];
                                            setField('birthday', formatted);
                                        }
                                    }}
                                />
                            )}

                            {/* Gender */}
                            <Field icon={<User color="#22c55e" size={20} />} error={errors.gender}>
                                <TouchableOpacity
                                    style={styles.pickerTrigger}
                                    onPress={() => setShowGenderPicker(true)}
                                >
                                    <Text style={formData.gender ? styles.pickerValue : styles.pickerPlaceholder}>
                                            {genderOptions.find((g) => g.value === formData.gender)?.name || 'Select gender'}
                                        </Text>
                                </TouchableOpacity>
                            </Field>

                            <TouchableOpacity
                                style={[styles.loginButton, isLoading && styles.disabledButton]}
                                onPress={handleSendOTP}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Send OTP</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Already have an account?</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.footerLink}> Login</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* ══════════ STEP 2 ══════════ */}
                    {step === 2 && (
                        <>
                            <Field icon={<Key color="#22c55e" size={20} />} error={errors.otp}>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Enter OTP (6 digits)"
                                    placeholderTextColor="#aaa"
                                    value={formData.otp}
                                    onChangeText={(v) =>
                                        setField('otp', v.replace(/\D/g, '').slice(0, 6))
                                    }
                                    keyboardType="numeric"
                                    maxLength={6}
                                />
                            </Field>

                            <TouchableOpacity
                                style={[styles.loginButton, confirmOtpLoading && styles.disabledButton]}
                                onPress={handleConfirmOTP}
                                disabled={confirmOtpLoading}
                            >
                                {confirmOtpLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Xác Nhận OTP</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => setStep(1)}
                            >
                                <Text style={styles.backButtonText}>← Back to edit information</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Animated.View>
            </ScrollView>

            {/* ── Picker Modals ── */}
            <PickerModal
                visible={showProvincePicker}
                data={provinces}
                labelKey="name"
                onSelect={(p) => {
                    setField('city', String(p.code));
                    setSelectedProvinceName(p.name);
                    setField('ward', '');
                }}
                onClose={() => setShowProvincePicker(false)}
            />

            <PickerModal
                visible={showWardPicker}
                data={wards}
                labelKey="name"
                onSelect={(w) => setField('ward', w.name)}
                onClose={() => setShowWardPicker(false)}
            />

            <PickerModal
                visible={showGenderPicker}
                data={genderOptions}
                labelKey="name"
                onSelect={(g) => setField('gender', g.value)}
                onClose={() => setShowGenderPicker(false)}
            />
        </LinearGradient>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    backgroundElements: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: { position: 'absolute', backgroundColor: '#ffffff20', borderRadius: 100 },
    circle1: { width: 200, height: 200, top: -50, left: -50 },
    circle2: { width: 150, height: 150, bottom: -30, right: -30 },
    circle3: { width: 100, height: 100, top: height / 3, left: -40 },
    circle4: { width: 120, height: 120, bottom: height / 4, right: -40 },

    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    card: {
        backgroundColor: '#ffffffcc',
        borderRadius: 20,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#22c55e',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#0D364C',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 18,
    },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#22c55e',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        minHeight: 50,
    },
    inputError: { borderColor: '#ef4444' },
    inputField: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#000',
        paddingVertical: 10,
    },
    errorText: { color: '#ef4444', fontSize: 11, marginTop: 4, marginLeft: 4 },

    pickerTrigger: { flex: 1, justifyContent: 'center', paddingVertical: 10, marginLeft: 10 },
    pickerPlaceholder: { color: '#aaa', fontSize: 15 },
    pickerValue: { color: '#000', fontSize: 15 },

    loginButton: {
        backgroundColor: '#22c55e',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    disabledButton: { opacity: 0.7 },
    loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

    backButton: { alignItems: 'center', marginTop: 16 },
    backButtonText: { color: '#0D364C', fontSize: 14 },

    footer: { marginTop: 20, flexDirection: 'row', justifyContent: 'center' },
    footerText: { color: '#333', fontSize: 14 },
    footerLink: { color: '#22c55e', fontWeight: '600', fontSize: 14 },

    // Picker Modal
    pickerOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#00000066',
        justifyContent: 'flex-end',
        zIndex: 999,
    },
    pickerBox: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.5,
        paddingBottom: 16,
    },
    pickerItem: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    pickerItemText: { fontSize: 15, color: '#0D364C' },
    pickerClose: { alignItems: 'center', paddingVertical: 14 },
});

export default RegisterScreen;