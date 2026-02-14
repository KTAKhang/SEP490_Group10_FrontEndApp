import React from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    Modal,
    SafeAreaView,
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';

// Main Loading Component với nhiều variants
const Loading = ({
    variant = 'standard',
    text = 'Loading...',
    color = COLORS.primary,
    size = 'large',
    visible = true,
    style = {},
    textStyle = {}
}) => {
    if (!visible) return null;

    switch (variant) {
        case 'fullscreen':
            return (
                <View style={[styles.fullscreenContainer, style]}>
                    <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
                    <LinearGradient
                        colors={COLORS.gradient.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientBackground}
                    >
                        <View style={styles.loadingContent}>
                            <ActivityIndicator size={size} color="#FFFFFF" />
                            <Text style={[styles.fullscreenText, textStyle]}>{text}</Text>
                        </View>
                    </LinearGradient>
                </View>
            );

        case 'overlay':
            return (
                <Modal visible={visible} transparent animationType="fade">
                    <View style={styles.overlayContainer}>
                        <View style={styles.overlayContent}>
                            <ActivityIndicator size={size} color={color} />
                            <Text style={[styles.overlayText, textStyle]}>{text}</Text>
                        </View>
                    </View>
                </Modal>
            );

        case 'inline':
            return (
                <View style={[styles.inlineContainer, style]}>
                    <ActivityIndicator size={size} color={color} />
                    <Text style={[styles.inlineText, textStyle]}>{text}</Text>
                </View>
            );

        case 'footer':
            return (
                <View style={[styles.footerContainer, style]}>
                    <ActivityIndicator size="small" color={color} />
                    <Text style={[styles.footerText, textStyle]}>{text}</Text>
                </View>
            );

        case 'minimal':
            return (
                <View style={[styles.minimalContainer, style]}>
                    <ActivityIndicator size={size} color={color} />
                </View>
            );

        case 'card':
            return (
                <View style={[styles.cardContainer, style]}>
                    <View style={styles.cardContent}>
                        <ActivityIndicator size={size} color={color} />
                        <Text style={[styles.cardText, textStyle]}>{text}</Text>
                    </View>
                </View>
            );

        default: // 'standard'
            return (
                <View style={[styles.standardContainer, style]}>
                    <ActivityIndicator size={size} color={color} />
                    <Text style={[styles.standardText, textStyle]}>{text}</Text>
                </View>
            );
    }
};

// Specialized Loading Components
export const FullScreenLoading = ({ text = 'Loading...', visible = true }) => (
    <Loading variant="fullscreen" text={text} visible={visible} />
);

export const OverlayLoading = ({ text = 'Please wait...', visible = true, color = COLORS.primary }) => (
    <Loading variant="overlay" text={text} visible={visible} color={color} />
);

export const InlineLoading = ({ text = 'Loading...', color = COLORS.primary, style = {} }) => (
    <Loading variant="inline" text={text} color={color} style={style} />
);

export const FooterLoading = ({ text = 'Loading more...', color = COLORS.primary }) => (
    <Loading variant="footer" text={text} color={color} />
);

export const MinimalLoading = ({ color = COLORS.primary, size = 'large', style = {} }) => (
    <Loading variant="minimal" color={color} size={size} style={style} />
);

export const CardLoading = ({ text = 'Loading...', color = COLORS.primary, style = {} }) => (
    <Loading variant="card" text={text} color={color} style={style} />
);

const styles = StyleSheet.create({
    // Fullscreen variant
    fullscreenContainer: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    gradientBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullscreenText: {
        marginTop: 16,
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
        textAlign: 'center',
    },

    // Overlay variant
    overlayContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayContent: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 150,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 8,
    },
    overlayText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.text.primary,
        fontWeight: '500',
        textAlign: 'center',
    },

    // Standard variant
    standardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    standardText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.text.secondary,
        textAlign: 'center',
    },

    // Inline variant
    inlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    inlineText: {
        marginLeft: 12,
        fontSize: 14,
        color: COLORS.text.secondary,
    },

    // Footer variant
    footerContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 16,
        shadowColor: COLORS.shadow.medium,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    footerText: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },

    // Minimal variant
    minimalContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Card variant
    cardContainer: {
        marginHorizontal: 20,
        marginVertical: 10,
    },
    cardContent: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: COLORS.shadow.light,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
    },
});

export default Loading; 