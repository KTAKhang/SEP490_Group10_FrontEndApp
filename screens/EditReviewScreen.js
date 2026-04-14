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
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { updateReviewWithFormData, updateReview, clearReviewState } from '../store/slices/reviewSlice';
import { COLORS } from '../constants/colors';

const MAX_IMAGES = 3;
const MAX_COMMENT_LENGTH = 1000;
const EDIT_WINDOW_DAYS = 3;

export default function EditReviewScreen() {
    const { t } = useTranslation();
    const route = useRoute();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { reviewId, review } = route.params || {};

    const { isLoading, error, successMessage } = useSelector((state) => state.review);

    const [rating, setRating] = useState(review?.rating ?? 5);
    const [comment, setComment] = useState(review?.comment ?? review?.content ?? '');
    const [existingImages, setExistingImages] = useState(review?.images ? [...review.images] : []);
    const [existingImagePublicIds, setExistingImagePublicIds] = useState(
        review?.imagePublicIds ? [...review.imagePublicIds] : []
    );
    const [newImageUris, setNewImageUris] = useState([]);
    const [canEdit, setCanEdit] = useState(true);
    const [blockMessage, setBlockMessage] = useState('');

    const editedCount = review?.editedCount ?? review?.edited_count ?? 0;
    const createdAt = review?.createdAt ?? review?.created_at;

    const totalImages = existingImages.length + newImageUris.length;
    const hasValidRating = rating >= 1 && rating <= 5;
    const canSubmit = canEdit && !!reviewId && hasValidRating && !isLoading;

    useEffect(() => {
        if (review) {
            setRating(review.rating ?? 5);
            setComment(review.comment ?? review.content ?? '');
            setExistingImages(Array.isArray(review.images) ? [...review.images] : []);
            setExistingImagePublicIds(Array.isArray(review.imagePublicIds) ? [...review.imagePublicIds] : []);
        }
    }, [review]);

    useEffect(() => {
        if (!review) {
            setCanEdit(false);
            setBlockMessage(t('reviews.reviewNotFound'));
            return;
        }
        if (editedCount >= 1) {
            setCanEdit(false);
            setBlockMessage(t('reviews.editOnceOnly'));
            return;
        }
        if (createdAt) {
            const created = new Date(createdAt);
            const now = new Date();
            const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
            if (diffDays > EDIT_WINDOW_DAYS) {
                setCanEdit(false);
                setBlockMessage(t('reviews.editWithin3Days'));
                return;
            }
        }
    }, [review, editedCount, createdAt, t]);

    useEffect(() => {
        if (successMessage) {
            dispatch(clearReviewState());
            Alert.alert(t('reviews.success'), t('reviews.reviewUpdated'), [
                { text: t('common.ok'), onPress: () => navigation.goBack() },
            ]);
        }
    }, [successMessage, dispatch, navigation]);

    useEffect(() => {
        if (error) {
            Alert.alert(t('common.error'), error);
            dispatch(clearReviewState());
        }
    }, [error, dispatch]);

    const pickImage = async () => {
        if (totalImages >= MAX_IMAGES) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('reviews.permissionRequired'), t('reviews.allowPhotoLibrary'));
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.length) {
            const added = result.assets
                .slice(0, MAX_IMAGES - totalImages)
                .map((a) => ({
                    uri: a.uri,
                    type: a.mimeType || 'image/jpeg',
                    fileName: a.fileName || `image_${Date.now()}.jpg`,
                }));
            setNewImageUris((prev) => [...prev, ...added].slice(0, MAX_IMAGES - existingImages.length));
        }
    };

    const removeExistingImage = (index) => {
        setExistingImages((prev) => prev.filter((_, i) => i !== index));
        setExistingImagePublicIds((prev) => prev.filter((_, i) => i !== index));
    };

    const removeNewImage = (index) => {
        setNewImageUris((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!canEdit || !reviewId) return;
        if (rating < 1 || rating > 5) {
            Alert.alert(t('common.error'), t('reviews.selectStarsRequired'));
            return;
        }

        try {
            const hasNewImages = newImageUris.length > 0;
            const hasExistingChanges = existingImages.length !== (review?.images?.length ?? 0) ||
                JSON.stringify(existingImagePublicIds) !== JSON.stringify(review?.imagePublicIds ?? []);

            if (hasNewImages || hasExistingChanges) {
                const formData = new FormData();
                formData.append('rating', String(rating));
                formData.append('comment', comment.trim());
                if (existingImages.length > 0) {
                    formData.append('existingImages', JSON.stringify(existingImages));
                    formData.append('existingImagePublicIds', JSON.stringify(existingImagePublicIds));
                }
                newImageUris.forEach((img, i) => {
                    formData.append('images', {
                        uri: img.uri,
                        name: img.fileName || `image_${i}.jpg`,
                        type: img.type || 'image/jpeg',
                    });
                });
                await dispatch(updateReviewWithFormData({ reviewId, formData })).unwrap();
            } else {
                await dispatch(updateReview({
                    review_id: reviewId,
                    rating,
                    review_content: comment.trim(),
                })).unwrap();
            }
        } catch (err) {
            Alert.alert(t('common.error'), err || t('reviews.updateFailed'));
        }
    };

    if (!reviewId) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={COLORS.gradient.primary} style={styles.headerGradient}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('reviews.editTitle')}</Text>
                </LinearGradient>
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{t('reviews.missingReviewInfo')}</Text>
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
                <Text style={styles.headerTitle}>{t('reviews.editTitle')}</Text>
                <Text style={styles.headerSubtitle}>
                    {t('reviews.editSubtitle', { days: EDIT_WINDOW_DAYS })}
                </Text>
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
                    {!canEdit ? (
                        <View style={styles.blockBox}>
                            <Icon name="info-outline" size={48} color={COLORS.primary} />
                            <Text style={styles.blockTitle}>{t('reviews.cannotEdit')}</Text>
                            <Text style={styles.blockMessage}>{blockMessage}</Text>
                            <TouchableOpacity style={styles.backToOrdersBtn} onPress={() => navigation.goBack()}>
                                <Text style={styles.backToOrdersText}>{t('reviews.backToOrder')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.label}>{t('reviews.ratingStars')}</Text>
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

                            <Text style={styles.label}>{t('reviews.commentLabel', { max: MAX_COMMENT_LENGTH })}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={t('reviews.placeholder')}
                                placeholderTextColor="#9CA3AF"
                                value={comment}
                                onChangeText={setComment}
                                maxLength={MAX_COMMENT_LENGTH}
                                multiline
                                numberOfLines={4}
                            />
                            <Text style={styles.charCount}>{comment.length}/{MAX_COMMENT_LENGTH}</Text>

                            <Text style={styles.label}>{t('reviews.imagesLabel', { max: MAX_IMAGES })}</Text>
                            <View style={styles.imageRow}>
                                {existingImages.map((uri, index) => (
                                    <View key={`ex-${index}`} style={styles.imageWrap}>
                                        <Image source={{ uri }} style={styles.thumb} />
                                        <TouchableOpacity
                                            style={styles.removeImageBtn}
                                            onPress={() => removeExistingImage(index)}
                                        >
                                            <Icon name="close" size={18} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {newImageUris.map((img, index) => (
                                    <View key={`new-${index}`} style={styles.imageWrap}>
                                        <Image source={{ uri: img.uri }} style={styles.thumb} />
                                        <TouchableOpacity
                                            style={styles.removeImageBtn}
                                            onPress={() => removeNewImage(index)}
                                        >
                                            <Icon name="close" size={18} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {totalImages < MAX_IMAGES && (
                                    <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                                        <Icon name="add-a-photo" size={32} color={COLORS.primary} />
                                        <Text style={styles.addImageText}>{t('reviews.addImage')}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={styles.imageCount}>{t('reviews.imagesCount', { current: totalImages, max: MAX_IMAGES })}</Text>

                            {canEdit && !hasValidRating && (
                                <Text style={styles.validationError}>{t('reviews.selectStarsRequired')}</Text>
                            )}

                            <TouchableOpacity
                                style={[styles.submitBtn, (!canSubmit || isLoading) && styles.submitBtnDisabled]}
                                onPress={handleSubmit}
                                disabled={!canSubmit || isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>{t('reviews.update')}</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
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
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
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
    errorBox: { padding: 16, backgroundColor: '#FEF2F2', margin: 16, borderRadius: 12 },
    errorText: { color: '#B91C1C', fontSize: 14 },
    blockBox: {
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginTop: 16,
    },
    blockTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text.primary, marginTop: 12 },
    blockMessage: { fontSize: 14, color: COLORS.text.secondary, textAlign: 'center', marginTop: 8 },
    backToOrdersBtn: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
    },
    backToOrdersText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    validationError: { fontSize: 13, color: '#B91C1C', marginBottom: 12 },
});
