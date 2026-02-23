import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    Linking,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { createPreOrderPaymentIntent } from '../services/preorderService';
import { COLORS } from '../constants/colors';
import { formatCurrency } from '../utils/formatCurrency';
import { MinimalLoading } from '../components/Loading';

const API_BASE = 'https://provinces.open-api.vn/api/v2';
const PREORDER_CONFIRM_TITLE = 'Xác nhận đặt trước';
const PREORDER_CONFIRM_MESSAGE =
    'Đặt trước không thể hủy. Bạn có chắc chắn muốn tiếp tục thanh toán đặt cọc 50%?';

const PHONE_REGEX = /^0\d{9}$/;

export default function PreOrderCheckoutScreen({ navigation, route }) {
    const { fruitType, quantityKg } = route?.params || {};
    const [formData, setFormData] = useState({
        receiver_name: '',
        receiver_phone: '',
        email: '',
        address: '',
        city: '',
        ward: '',
        note: '',
    });
    const [provinceName, setProvinceName] = useState('');
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(true);
    const [loadingWards, setLoadingWards] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [pickModal, setPickModal] = useState(null); // 'province' | 'ward' | null

    useEffect(() => {
        axios
            .get(`${API_BASE}/p/`)
            .then((res) => setProvinces(Array.isArray(res.data) ? res.data : []))
            .catch(() => setProvinces([]))
            .finally(() => setLoadingProvinces(false));
    }, []);

    useEffect(() => {
        if (!formData.city) {
            setWards([]);
            setProvinceName('');
            setFormData((prev) => ({ ...prev, ward: '' }));
            return;
        }
        setFormData((prev) => ({ ...prev, ward: '' }));
        const sel = provinces.find((p) => String(p.code) === String(formData.city));
        setProvinceName(sel ? sel.name : '');
        setLoadingWards(true);
        axios
            .get(`${API_BASE}/w/`)
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : [];
                setWards(list.filter((w) => String(w.province_code) === String(formData.city)));
            })
            .catch(() => setWards([]))
            .finally(() => setLoadingWards(false));
    }, [formData.city, provinces]);

    const update = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
    };

    const buildReceiverAddress = () => {
        const parts = [formData.address, formData.ward, provinceName].filter(Boolean);
        return parts.join(', ');
    };

    const validate = () => {
        const e = {};
        if (!formData.receiver_name?.trim()) e.receiver_name = 'Vui lòng nhập họ tên';
        if (!formData.receiver_phone?.trim()) e.receiver_phone = 'Vui lòng nhập số điện thoại';
        else if (!PHONE_REGEX.test(formData.receiver_phone.trim())) {
            e.receiver_phone = 'Số điện thoại phải bắt đầu bằng 0 và đủ 10 số';
        }
        if (!formData.address?.trim()) e.address = 'Vui lòng nhập địa chỉ (số nhà, đường)';
        if (!formData.city) e.city = 'Vui lòng chọn Tỉnh/Thành phố';
        if (!formData.ward) e.ward = 'Vui lòng chọn Phường/Xã';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleCheckout = () => {
        if (!fruitType?._id || !quantityKg) {
            Alert.alert('Lỗi', 'Thiếu thông tin đơn đặt trước.');
            return;
        }
        if (!validate()) return;

        Alert.alert(
            PREORDER_CONFIRM_TITLE,
            PREORDER_CONFIRM_MESSAGE,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const res = await createPreOrderPaymentIntent({
                                fruitTypeId: fruitType._id,
                                quantityKg: Number(quantityKg),
                                receiverInfo: {
                                    receiver_name: formData.receiver_name.trim(),
                                    receiver_phone: formData.receiver_phone.trim(),
                                    receiver_address: buildReceiverAddress(),
                                    note: formData.note?.trim() || undefined,
                                },
                            });
                            if (res.payUrl) {
                                await Linking.openURL(res.payUrl);
                                navigation.goBack();
                                navigation.goBack();
                            } else {
                                Alert.alert('Lỗi', 'Không nhận được link thanh toán.');
                            }
                        } catch (err) {
                            Alert.alert('Lỗi', err.message || 'Thanh toán thất bại');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (!fruitType) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Thiếu thông tin sản phẩm.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                    <Text style={styles.backLinkText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const depositEst = (fruitType.estimatedPrice || 0) * quantityKg * 0.5;

    const renderPickerModal = () => {
        if (!pickModal) return null;
        const isProvince = pickModal === 'province';
        const data = isProvince ? provinces : wards;
        const keyExtractor = (item) => String(isProvince ? item.code : item.code);
        const renderItem = ({ item }) => (
            <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                    if (isProvince) update('city', String(item.code));
                    else update('ward', item.name);
                    setPickModal(null);
                }}
            >
                <Text style={styles.pickerItemText}>{item.name}</Text>
            </TouchableOpacity>
        );
        return (
            <Modal visible animationType="slide" transparent>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setPickModal(null)}
                >
                    <View style={styles.pickerModalBox}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>
                                {isProvince ? 'Chọn Tỉnh/Thành phố' : 'Chọn Phường/Xã'}
                            </Text>
                            <TouchableOpacity onPress={() => setPickModal(null)}>
                                <MaterialIcons name="close" size={24} color={COLORS.text.primary} />
                            </TouchableOpacity>
                        </View>
                        {isProvince && loadingProvinces ? (
                            <ActivityIndicator style={styles.pickerLoading} color={COLORS.primary} />
                        ) : !isProvince && loadingWards ? (
                            <ActivityIndicator style={styles.pickerLoading} color={COLORS.primary} />
                        ) : (
                            <FlatList
                                data={data}
                                keyExtractor={keyExtractor}
                                renderItem={renderItem}
                                style={styles.pickerList}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={COLORS.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán đặt trước</Text>
            </LinearGradient>

            {loading && <MinimalLoading />}

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={80}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>{fruitType.name}</Text>
                        <Text style={styles.summaryRow}>
                            Số lượng: {quantityKg} kg • Đặt cọc 50%: {formatCurrency(depositEst)}
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>Thông tin nhận hàng</Text>

                    <View style={styles.field}>
                        <Text style={styles.label}>Họ tên *</Text>
                        <TextInput
                            style={[styles.input, errors.receiver_name && styles.inputError]}
                            value={formData.receiver_name}
                            onChangeText={(v) => update('receiver_name', v)}
                            placeholder="Họ tên người nhận"
                        />
                        {errors.receiver_name ? (
                            <Text style={styles.errMsg}>{errors.receiver_name}</Text>
                        ) : null}
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>Số điện thoại *</Text>
                        <TextInput
                            style={[styles.input, errors.receiver_phone && styles.inputError]}
                            value={formData.receiver_phone}
                            onChangeText={(v) => update('receiver_phone', v)}
                            placeholder="0xxxxxxxxx (10 số)"
                            keyboardType="phone-pad"
                        />
                        {errors.receiver_phone ? (
                            <Text style={styles.errMsg}>{errors.receiver_phone}</Text>
                        ) : null}
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.email}
                            onChangeText={(v) => update('email', v)}
                            placeholder="Email (tùy chọn)"
                            keyboardType="email-address"
                        />
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>Địa chỉ (số nhà, đường) *</Text>
                        <TextInput
                            style={[styles.input, errors.address && styles.inputError]}
                            value={formData.address}
                            onChangeText={(v) => update('address', v)}
                            placeholder="Số nhà, tên đường"
                        />
                        {errors.address ? (
                            <Text style={styles.errMsg}>{errors.address}</Text>
                        ) : null}
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>Tỉnh/Thành phố *</Text>
                        <TouchableOpacity
                            style={[styles.selectTouch, errors.city && styles.inputError]}
                            onPress={() => setPickModal('province')}
                        >
                            <Text style={[styles.selectText, !formData.city && styles.selectPlaceholder]}>
                                {formData.city
                                    ? (provinces.find((p) => String(p.code) === formData.city)?.name) || 'Chọn'
                                    : 'Chọn Tỉnh/Thành phố'}
                            </Text>
                            <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.text.secondary} />
                        </TouchableOpacity>
                        {errors.city ? (
                            <Text style={styles.errMsg}>{errors.city}</Text>
                        ) : null}
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>Phường/Xã *</Text>
                        <TouchableOpacity
                            style={[styles.selectTouch, errors.ward && styles.inputError]}
                            onPress={() => setPickModal('ward')}
                            disabled={!formData.city}
                        >
                            <Text style={[styles.selectText, !formData.ward && styles.selectPlaceholder]}>
                                {formData.ward || 'Chọn Phường/Xã'}
                            </Text>
                            <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.text.secondary} />
                        </TouchableOpacity>
                        {errors.ward ? (
                            <Text style={styles.errMsg}>{errors.ward}</Text>
                        ) : null}
                    </View>
                    <View style={styles.field}>
                        <Text style={styles.label}>Ghi chú</Text>
                        <TextInput
                            style={[styles.input, styles.inputArea]}
                            value={formData.note}
                            onChangeText={(v) => update('note', v)}
                            placeholder="Ghi chú (tùy chọn)"
                            multiline
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.checkoutBtn}
                        onPress={handleCheckout}
                        disabled={loading}
                    >
                        <MaterialIcons name="payment" size={22} color="#fff" />
                        <Text style={styles.checkoutBtnText}>Thanh toán đặt cọc 50%</Text>
                    </TouchableOpacity>
                    <Text style={styles.hint}>
                        Bấm "Thanh toán" sẽ hiện xác nhận: đặt trước không thể hủy. Chỉ sau khi bạn xác nhận, hệ thống mới chuyển đến cổng thanh toán.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>

            {renderPickerModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
    errMsg: { color: '#ef4444', fontSize: 12, marginTop: 4 },
    backLink: { padding: 16 },
    backLinkText: { color: COLORS.primary, fontWeight: '600' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 14,
    },
    backBtn: { padding: 8, marginRight: 8 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    summaryTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary, marginBottom: 6 },
    summaryRow: { fontSize: 14, color: COLORS.text.secondary },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text.primary, marginBottom: 12 },
    field: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', color: COLORS.text.primary, marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border.dark,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputArea: { minHeight: 80, textAlignVertical: 'top' },
    inputError: { borderColor: '#ef4444' },
    selectTouch: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.border.dark,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    selectText: { fontSize: 16, color: COLORS.text.primary },
    selectPlaceholder: { color: COLORS.text.light },
    checkoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 10,
        marginTop: 8,
    },
    checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    hint: { fontSize: 12, color: COLORS.text.light, marginTop: 16, textAlign: 'center', paddingHorizontal: 8 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    pickerModalBox: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '70%',
    },
    pickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.light,
    },
    pickerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text.primary },
    pickerList: { maxHeight: 320 },
    pickerItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border.light },
    pickerItemText: { fontSize: 16, color: COLORS.text.primary },
    pickerLoading: { padding: 24 },
});
