import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
} from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as ImagePicker from 'expo-image-picker';
import { MinimalLoading } from './Loading';

const EditProfileModal = ({ visible, onClose, profile, onSave }) => {
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [imageLoading, setImageLoading] = useState(false);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const { showActionSheetWithOptions } = useActionSheet();

    useEffect(() => {
        if (visible) {
            setName(profile?.user_name || '');
            setAvatar(profile?.avatar || '');
            setErrors({});
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible, profile]);

    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = 'Vui lòng nhập tên người dùng';
        } else if (name.trim().length < 2) {
            newErrors.name = 'Tên phải có ít nhất 2 ký tự';
        } else if (name.trim().length > 50) {
            newErrors.name = 'Tên không được vượt quá 50 ký tự';
        }


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const pickImageFromLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Lỗi', 'Bạn cần cấp quyền truy cập thư viện.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
            setAvatar(result.assets[0].uri);
        }
    };

    const takePhotoFromCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Lỗi', 'Bạn cần cấp quyền truy cập camera.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
            setAvatar(result.assets[0].uri);
        }
    };

    const handleChangeAvatar = () => {
        // Tạm thời ẩn modal để action sheet hiển thị đúng
        setShowActionSheet(true);

        // Delay ngắn để đảm bảo modal đã ẩn
        setTimeout(() => {
            const options = ['Chọn từ thư viện', 'Chụp ảnh mới', 'Nhập URL', 'Xóa ảnh', 'Hủy'];
            const cancelButtonIndex = 4;
            const destructiveButtonIndex = 3;

            showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex,
                    destructiveButtonIndex,
                },
                (buttonIndex) => {
                    setShowActionSheet(false);
                    handleAvatarAction(buttonIndex);
                }
            );
        }, 100);
    };

    const handleAvatarAction = (buttonIndex) => {
        switch (buttonIndex) {
            case 0:
                pickImageFromLibrary();
                break;
            case 1:
                takePhotoFromCamera();
                break;
            case 2:
                showUrlInputDialog();
                break;
            case 3:
                setAvatar('');
                break;
            default:
                break;
        }
    };

    const showUrlInputDialog = () => {
        Alert.prompt(
            'Nhập URL ảnh',
            'Vui lòng nhập đường dẫn ảnh:',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'OK',
                    onPress: (url) => {
                        if (url && url.trim()) {

                            setAvatar(url.trim());

                        }
                    },
                },
            ],
            'plain-text',
            avatar
        );
    };



    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const updatedProfile = {
                ...profile,
                user_name: name.trim(),
                avatar: avatar.trim(),
            };

            await onSave(updatedProfile);
            onClose();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        const hasChanges = name !== (profile?.user_name || '') || avatar !== (profile?.avatar || '');

        if (hasChanges) {
            Alert.alert(
                'Xác nhận',
                'Bạn có muốn hủy những thay đổi chưa được lưu?',
                [
                    { text: 'Tiếp tục chỉnh sửa', style: 'cancel' },
                    { text: 'Hủy thay đổi', onPress: onClose, style: 'destructive' },
                ]
            );
        } else {
            onClose();
        }
    };

    const ErrorText = ({ error }) => (error ? <Text style={styles.errorText}>{error}</Text> : null);

    const handleImageError = () => setImageLoading(false);
    const handleImageLoadStart = () => setImageLoading(true);
    const handleImageLoadEnd = () => setImageLoading(false);

    return (
        <Modal
            visible={visible && !showActionSheet}
            animationType="slide"
            transparent
            onRequestClose={handleCancel}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={handleCancel}
                >
                    <Animated.View
                        style={[styles.modalContainer, { opacity: fadeAnim }]}
                    >
                        <TouchableOpacity activeOpacity={1}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Header */}
                                <View style={styles.header}>
                                    <TouchableOpacity
                                        onPress={handleCancel}
                                        style={styles.closeButton}
                                        disabled={loading}
                                    >
                                        <Text style={styles.closeButtonText}>✕</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>
                                    <View style={styles.placeholder} />
                                </View>

                                {/* Avatar Section */}
                                <View style={styles.avatarSection}>
                                    <View style={styles.avatarContainer}>
                                        {avatar ? (
                                            <>
                                                <Image
                                                    source={{ uri: avatar }}
                                                    style={styles.avatarPreview}
                                                    onLoadStart={handleImageLoadStart}
                                                    onLoadEnd={handleImageLoadEnd}
                                                    onError={handleImageError}
                                                />
                                                {imageLoading && (
                                                    <View style={styles.imageLoadingOverlay}>
                                                        <MinimalLoading size="small" color="#13C2C2" />
                                                    </View>
                                                )}
                                            </>
                                        ) : (
                                            <View style={styles.avatarPlaceholder}>
                                                <Text style={styles.avatarPlaceholderText}>
                                                    {name ? name.charAt(0).toUpperCase() : '?'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        style={styles.changeAvatarButton}
                                        onPress={handleChangeAvatar}
                                    >
                                        <Text style={styles.changeAvatarText}>Thay đổi ảnh</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Form Fields */}
                                <View style={styles.formSection}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Tên người dùng *</Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                errors.name && styles.inputError
                                            ]}
                                            placeholder="Nhập tên của bạn"
                                            value={name}
                                            onChangeText={(text) => {
                                                setName(text);
                                                if (errors.name) {
                                                    setErrors({ ...errors, name: null });
                                                }
                                            }}
                                            maxLength={50}
                                            editable={!loading}
                                        />
                                        <ErrorText error={errors.name} />
                                        <Text style={styles.charCount}>{name.length}/50</Text>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>URL ảnh đại diện</Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                errors.avatar && styles.inputError
                                            ]}
                                            placeholder="https://example.com/avatar.jpg"
                                            value={avatar}
                                            onChangeText={(text) => {
                                                setAvatar(text);
                                                if (errors.avatar) {
                                                    setErrors({ ...errors, avatar: null });
                                                }
                                            }}
                                            keyboardType="url"
                                            autoCapitalize="none"
                                            editable={!loading}
                                        />
                                        <ErrorText error={errors.avatar} />
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        onPress={handleCancel}
                                        style={[styles.cancelButton, loading && styles.disabledButton]}
                                        disabled={loading}
                                    >
                                        <Text style={[styles.cancelText, loading && styles.disabledText]}>
                                            Hủy
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={handleSave}
                                        style={[styles.saveButton, loading && styles.disabledButton]}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <MinimalLoading size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.saveText}>Lưu thay đổi</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </TouchableOpacity>
                    </Animated.View>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 16,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#6b7280',
        fontWeight: 'bold',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        flex: 1,
    },
    placeholder: {
        width: 32,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarPreview: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderColor: '#13C2C2',
        borderWidth: 3,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#d1d5db',
        borderWidth: 2,
    },
    avatarPlaceholderText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    imageLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    changeAvatarButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderColor: '#13C2C2',
        borderWidth: 1,
    },
    changeAvatarText: {
        color: '#13C2C2',
        fontSize: 14,
        fontWeight: '600',
    },
    formSection: {
        paddingHorizontal: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        marginTop: 4,
    },
    charCount: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'right',
        marginTop: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: '#f9fafb',
        alignItems: 'center',
    },
    cancelText: {
        color: '#6b7280',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#13C2C2',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#13C2C2',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.6,
    },
    disabledText: {
        opacity: 0.6,
    },
});

export default EditProfileModal;