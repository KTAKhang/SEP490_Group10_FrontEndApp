// components/PersonalInfoSection.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PersonalInfoSection = ({ profile, onChangePasswordPress }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        {[
            { icon: 'person-outline', label: 'Full Name', value: profile.user_name },
            { icon: 'mail-outline', label: 'Email', value: profile.email },
        ].map(({ icon, label, value }, index) => (
            <View key={label} style={[styles.infoItem, index === 3 && { borderBottomWidth: 0 }]}>
                <View style={styles.infoItemLeft}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={icon} size={20} color="#13C2C2" />
                    </View>
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>{label}</Text>
                        <Text style={styles.infoValue}>{value}</Text>
                    </View>
                </View>
            </View>
        ))}

        <TouchableOpacity style={styles.changePasswordButton} onPress={onChangePasswordPress}>
            <Ionicons name="key-outline" size={20} color="#13C2C2" />
            <Text style={styles.changePasswordText}>Đổi mật khẩu</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    section: { backgroundColor: '#fff', borderRadius: 8, marginBottom: 24 },
    sectionTitle: {
        fontSize: 16, fontWeight: '600', color: '#374151',
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    infoItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    infoItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconContainer: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
    infoContent: { marginLeft: 12, flex: 1 },
    infoLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
    infoValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
    changePasswordButton: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        padding: 12, margin: 16, borderWidth: 1, borderColor: '#13C2C2',
        borderRadius: 8, backgroundColor: '#fff',
    },
    changePasswordText: { color: '#13C2C2', fontWeight: '500', marginLeft: 8 },
});

export default PersonalInfoSection;
