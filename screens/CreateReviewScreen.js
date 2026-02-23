import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { createReviewWithFormData, createReview, clearReviewState } from '../store/slices/reviewSlice';
import { COLORS } from '../constants/colors';

const MAX_IMAGES = 3;
const MAX_COMMENT_LENGTH = 1000;

export default function CreateReviewScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { orderId, productId, productName } = route.params || {};

    const { isLoading, error, successMessage } = useSelector((state) => state.review);

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [imageUris, setImageUris] = useState([]);
    const [submitError, setSubmitError] = useState(null);

    const hasValidParams = !!(orderId && productId);
    const hasValidRating = rating >= 1 && rating <= 5;
    const canSubmit = hasValidParams && hasValidRating && !isLoading;

    useEffect(() => {
        if (successMessage) {
            dispatch(clearReviewState());
            Alert.alert('Thành công', 'Đánh giá đã được gửi.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        }
    }, [successMessage, dispatch, navigation]);

    useEffect(() => {
        if (error) {
            Alert.alert('Lỗi', error);
            dispatch(clearReviewState());
        }
    }, [error, dispatch]);

    useEffect(() => {
        setSubmitError(null);
    }, [rating, comment]);

    const pickImage = async () => {
        if (imageUris.length >= MAX_IMAGES) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cần quyền', 'Vui lòng cho phép truy cập thư viện ảnh.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.length) {
            const added = result.assets.slice(0, MAX_IMAGES - imageUris.length).map((a) => ({
                uri: a.uri,
                type: a.mimeType || 'image/jpeg',
                fileName: a.fileName || `image_${Date.now()}.jpg`,
            }));
            setImageUris((prev) => [...prev, ...added].slice(0, MAX_IMAGES));
        }
    };

    const removeImage = (index) => {
        setImageUris((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!orderId || !productId) {
            setSubmitError('Thiếu thông tin đơn hàng hoặc sản phẩm.');
            return;
        }
        if (rating < 1 || rating > 5) {
            setSubmitError('Vui lòng chọn từ 1 đến 5 sao.');
            return;
        }
        setSubmitError(null);

        try {
            if (imageUris.length > 0) {
                const formData = new FormData();
                formData.append('orderId', orderId);
                formData.append('productId', productId);
                formData.append('rating', String(rating));
                formData.append('comment', comment.trim());
                imageUris.forEach((img, i) => {
                    formData.append('images', {
                        uri: img.uri,
                        name: img.fileName || `image_${i}.jpg`,
                        type: img.type || 'image/jpeg',
                    });
                });
                await dispatch(createReviewWithFormData(formData)).unwrap();
            } else {
                await dispatch(createReview({
                    order_id: orderId,
                    product_id: productId,
                    rating,
                    review_content: comment.trim(),
                })).unwrap();
            }
        } catch (err) {
            setSubmitError(err || 'Gửi đánh giá thất bại.');
        }
    };

    if (!orderId || !productId) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={COLORS.gradient.primary} style={styles.headerGradient}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
                </LinearGradient>
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>Thiếu thông tin đơn hàng hoặc sản phẩm.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
            <LinearGradient colors={COLORS.gradient.primary} style={styles.headerGradient}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
                {productName ? (
                    <Text style={styles.headerSubtitle} numberOfLines={1}>{productName}</Text>
                ) : null}
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={80}
            >
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.hint}>Chỉ đơn hàng đã giao mới được đánh giá.</Text>

                    <Text style={styles.label}>Đánh giá sao</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((value) => (
                            <TouchableOpacity
                                key={value}
                                onPress={() => setRating(value)}
                                style={styles.starBtn}
                            >
                                <Icon
                                    name={rating >= value ? 'star' : 'star-border'}
                                    size={36}
                                    color={rating >= value ? '#FFB800' : '#D1D5DB'}
                                />
                            </TouchableOpacity>
                        ))}
                        <Text style={styles.ratingText}>{rating}/5</Text>
                    </View>

                    <Text style={styles.label}>Nhận xét (tối đa {MAX_COMMENT_LENGTH} ký tự)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Chia sẻ trải nghiệm của bạn..."
                        placeholderTextColor="#9CA3AF"
                        value={comment}
                        onChangeText={setComment}
                        maxLength={MAX_COMMENT_LENGTH}
                        multiline
                        numberOfLines={4}
                    />
                    <Text style={styles.charCount}>{comment.length}/{MAX_COMMENT_LENGTH}</Text>

                    <Text style={styles.label}>Ảnh đánh giá (tối đa {MAX_IMAGES} ảnh)</Text>
                    <View style={styles.imageRow}>
                        {imageUris.map((img, index) => (
                            <View key={index} style={styles.imageWrap}>
                                <Image source={{ uri: img.uri }} style={styles.thumb} />
                                <TouchableOpacity
                                    style={styles.removeImageBtn}
                                    onPress={() => removeImage(index)}
                                >
                                    <Icon name="close" size={18} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {imageUris.length < MAX_IMAGES && (
                            <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                                <Icon name="add-a-photo" size={32} color={COLORS.primary} />
                                <Text style={styles.addImageText}>Thêm ảnh</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.imageCount}>{imageUris.length}/{MAX_IMAGES} ảnh</Text>

                    {!hasValidRating && hasValidParams && (
                        <Text style={styles.validationError}>Vui lòng chọn từ 1 đến 5 sao.</Text>
                    )}
                    {submitError ? (
                        <Text style={styles.validationError}>{submitError}</Text>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.submitBtn, (!canSubmit || isLoading) && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Gửi đánh giá</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    flex1: { flex: 1 },
    headerGradient: {
        paddingTop: 44,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    backBtn: { position: 'absolute', left: 16, top: 44, zIndex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    hint: { fontSize: 13, color: COLORS.text.secondary, marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary, marginBottom: 8 },
    starsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    starBtn: { padding: 4 },
    ratingText: { fontSize: 14, color: COLORS.text.secondary, marginLeft: 12 },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border.dark,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: COLORS.text.primary,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    charCount: { fontSize: 12, color: COLORS.text.light, marginTop: 4, marginBottom: 16 },
    imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
    imageWrap: { position: 'relative' },
    thumb: { width: 80, height: 80, borderRadius: 8 },
    removeImageBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addImageBtn: {
        width: 80,
        height: 80,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addImageText: { fontSize: 11, color: COLORS.primary, marginTop: 4 },
    imageCount: { fontSize: 12, color: COLORS.text.light, marginBottom: 24 },
    submitBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
    validationError: {
        fontSize: 13,
        color: '#B91C1C',
        marginBottom: 12,
    },
    errorBox: { padding: 16, backgroundColor: '#FEF2F2', margin: 16, borderRadius: 12 },
    errorText: { color: '#B91C1C', fontSize: 14 },
});
