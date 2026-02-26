import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    StyleSheet,
    Switch,
    StatusBar,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigation from '../components/BottomNavigation';
import { COLORS } from '../constants/colors';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../store/slices/authSlice';
import ProfileHeader from '../components/ProfileHeader';
import PersonalInfoSection from '../components/PersonalInfoSection';
import OrderHistorySection from '../components/OrderHistorySection';
import { changePassword, fetchUserProfile, resetChangePasswordSuccess, resetUpdateSuccess, updateUserProfile } from '../store/slices/userSlice';
import { fetchOrderByUser } from '../store/slices/orderSlice';
import EditProfileModal from '../components/EditProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { InlineLoading } from '../components/Loading';

const ProfileScreen = ({ navigation }) => {
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [newsletter, setNewsletter] = useState(true);
    const dispatch = useDispatch();
    const {
        user: profile,
        getProfileLoading: isLoading,
        updateSuccess: isUpdateSuccess,
        changePasswordSuccess: isChangePasswordSuccess,
        updateLoading,
        changePasswordLoading,
        updateError,
        changePasswordError,
    } = useSelector((state) => state.user);
    const { orders, isLoading: orderLoading, error: orderError } = useSelector((state) => state.order);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        dispatch(fetchUserProfile());
        dispatch(fetchOrderByUser());
    }, [dispatch]);

    useEffect(() => {
        if (isUpdateSuccess) {
            dispatch(fetchUserProfile());
            Alert.alert(
                'Cập nhật thành công',
                'Thông tin cá nhân của bạn đã được cập nhật.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setEditModalVisible(false);
                            dispatch(resetUpdateSuccess());
                        },
                    },
                ]
            );
        }
    }, [isUpdateSuccess, dispatch]);

    useEffect(() => {
        if (isChangePasswordSuccess) {
            Alert.alert(
                'Đổi mật khẩu thành công',
                'Mật khẩu của bạn đã được cập nhật.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setPasswordModalVisible(false);
                            // Reset form
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            dispatch(resetChangePasswordSuccess());
                        },
                    },
                ]
            );
        }
    }, [isChangePasswordSuccess, dispatch]);

    // Handle error for change password
    useEffect(() => {
        if (changePasswordError && passwordModalVisible) {
            Alert.alert(
                'Lỗi đổi mật khẩu',
                changePasswordError,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Keep modal open so user can retry
                        },
                    },
                ]
            );
        }
    }, [changePasswordError, passwordModalVisible]);

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất không?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: () => dispatch(logoutUser())
                },
            ]
        );
    };

    const handleUpdateProfile = async (updatedProfile) => {
        return dispatch(updateUserProfile(updatedProfile)).unwrap();
    };
    const handleChangePassword = () => {
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
            return;
        }

        if (currentPassword === newPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải khác mật khẩu hiện tại.');
            return;
        }

        // API yêu cầu old_password và new_password
        const passwordData = {
            old_password: currentPassword,
            new_password: newPassword,
        };


        dispatch(changePassword(passwordData));
    };

    const handleClosePasswordModal = () => {
        setPasswordModalVisible(false);
        // Reset form when closing
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} translucent />
            <LinearGradient
                colors={COLORS.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <SafeAreaView>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Hồ sơ</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {isLoading ? (
                    <InlineLoading
                        text="Đang tải thông tin..."
                        style={styles.loadingContainer}
                        color={COLORS.primary}
                    />
                ) : (
                    <>
                        {profile && profile.user_name && (
                            <>
                                <ProfileHeader
                                    profile={profile}
                                    onEditPress={() => setEditModalVisible(true)}
                                />
                                <PersonalInfoSection
                                    profile={profile}
                                    onChangePasswordPress={() => setPasswordModalVisible(true)}
                                />
                                <OrderHistorySection
                                    orderHistory={orders}
                                    onViewAll={() => navigation?.navigate('OrderHistory')}
                                    onOrderPress={(order) => navigation.navigate('OrderDetails', { orderId: order._id })}
                                />
                            </>
                        )}

                        <View style={styles.menuSection}>
                            <TouchableOpacity
                                style={styles.menuRow}
                                onPress={() => navigation.navigate('Vouchers')}
                            >
                                <MaterialIcons name="confirmation-number" size={22} color={COLORS.primary} />
                                <Text style={styles.menuText}>Voucher của tôi</Text>
                                <MaterialIcons name="chevron-right" size={22} color={COLORS.text.light} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.menuRow}
                                onPress={() => navigation.navigate('PreOrder')}
                            >
                                <MaterialIcons name="eco" size={22} color={COLORS.primary} />
                                <Text style={styles.menuText}>Đặt trước</Text>
                                <MaterialIcons name="chevron-right" size={22} color={COLORS.text.light} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                            <Text style={styles.logoutText}>Đăng xuất</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>

            <BottomNavigation />

            <EditProfileModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
                profile={profile}
                // isUpdateSuccess={isUpdateSuccess}
                onSave={handleUpdateProfile}
            />
            <ChangePasswordModal
                visible={passwordModalVisible}
                onClose={handleClosePasswordModal}
                currentPassword={currentPassword}
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                setCurrentPassword={setCurrentPassword}
                setNewPassword={setNewPassword}
                setConfirmPassword={setConfirmPassword}
                onSubmit={handleChangePassword}
                isLoading={changePasswordLoading}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        marginTop:10,
    },
    headerGradient: {
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 5,
        shadowColor: COLORS.shadow.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        marginTop: -25,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        backgroundColor: COLORS.background,
        overflow: 'hidden',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 30,
        paddingBottom: 100,
    },
    menuSection: {
        marginTop: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border.light,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text.primary,
        marginLeft: 12,
    },
    loadingContainer: {
        marginTop: 50,
        paddingVertical: 40,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ef4444',
        marginTop: 24,
        marginBottom: 50,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default ProfileScreen;