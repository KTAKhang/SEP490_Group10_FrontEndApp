// components/PersonalInfoSection.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PersonalInfoSection = ({ profile = {}, onChangePasswordPress }) => {

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('vi-VN');
    };

    const formatGender = (gender) => {
        if (!gender) return '';
        if (gender.toLowerCase() === 'male') return 'Nam';
        if (gender.toLowerCase() === 'female') return 'Nữ';
        return gender;
    };

    const infoItems = [
        { icon: 'person-outline', label: 'Full Name', value: profile.user_name },
        { icon: 'mail-outline', label: 'Email', value: profile.email },
        { icon: 'call-outline', label: 'Phone', value: profile.phone },
        { icon: 'location-outline', label: 'Address', value: profile.address },
        { icon: 'calendar-outline', label: 'Birthday', value: formatDate(profile.birthday) },
        { icon: 'male-female-outline', label: 'Gender', value: formatGender(profile.gender) },
    ];

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {infoItems.map(({ icon, label, value }, index) => (
                <View
                    key={label}
                    style={[
                        styles.infoItem,
                        index === infoItems.length - 1 && { borderBottomWidth: 0 }
                    ]}
                >
                    <View style={styles.infoItemLeft}>
                        <View style={styles.iconContainer}>
                            <Ionicons name={icon} size={20} color="#13C2C2" />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>{label}</Text>
                            <Text style={styles.infoValue}>
                                {value || 'Not updated'}
                            </Text>
                        </View>
                    </View>
                </View>
            ))}

            <TouchableOpacity
                style={styles.changePasswordButton}
                onPress={onChangePasswordPress}
            >
                <Ionicons name="key-outline" size={20} color="#13C2C2" />
                <Text style={styles.changePasswordText}>Đổi mật khẩu</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    infoItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#E6FFFB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContent: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    changePasswordButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        margin: 16,
        borderWidth: 1,
        borderColor: '#13C2C2',
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    changePasswordText: {
        color: '#13C2C2',
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default PersonalInfoSection;