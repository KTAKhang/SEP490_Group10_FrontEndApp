import React, { useCallback, useState, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  analyzeFruitImage,
  requestFruitTopic,
  MAX_FRUIT_IMAGE_BYTES,
  resolveAnalyzeError,
  formatMb,
} from '../services/fruitAssistantService';

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_W = Math.min(SCREEN_W - 32, 360);

const TOPIC_IDS = ['nutrition', 'recipes', 'health'];

function newId(prefix = 'm') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function FruitAiChatbot() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errorText, setErrorText] = useState('');
  const [topicDone, setTopicDone] = useState({});
  const [topicLoadingKey, setTopicLoadingKey] = useState(null);
  const scrollRef = useRef(null);

  /** Cuộn xuống ngay khi có tin nhắn kèm ảnh (giống web: thấy ảnh user tức thì). */
  useLayoutEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'user' && last?.imageUri) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages]);

  const ensureCustomerAccess = useCallback(() => {
    if (!isAuthenticated) {
      setOpen(false);
      Alert.alert(t('common.loginRequired'), t('fruitAi.loginToUse'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.login'), onPress: () => navigation.navigate('Login') },
      ]);
      return false;
    }
    if (user?.role_name && user.role_name !== 'customer') {
      Alert.alert(t('common.error'), t('fruitAi.customerOnly'));
      return false;
    }
    return true;
  }, [isAuthenticated, user, navigation, t]);

  const openPanel = useCallback(() => {
    if (!ensureCustomerAccess()) return;
    setOpen(true);
  }, [ensureCustomerAccess]);

  const pushMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, { ...msg, id: msg.id || newId() }]);
  }, []);

  const appendTopicPrompt = useCallback((context) => {
    const promptId = newId('p');
    pushMessage({
      id: promptId,
      role: 'assistant',
      topicPrompt: true,
      promptId,
      context,
    });
  }, [pushMessage]);

  const handleTopicPick = useCallback(
    async (promptId, topicId, context) => {
      if (!ensureCustomerAccess()) return;
      const key = `${promptId}-${topicId}`;
      setTopicLoadingKey(key);
      try {
        const body = await requestFruitTopic({
          topic: topicId,
          fruitLabelEn: context.fruitLabelEn,
          inStock: !!context.inStock,
          productName: context.productName || undefined,
        });
        if (body.status === 'ERR') {
          pushMessage({
            role: 'assistant',
            text: body.message || t('fruitAi.topicFailed'),
            isError: true,
          });
          return;
        }
        const titleKey =
          topicId === 'nutrition'
            ? 'fruitAi.topicNutrition'
            : topicId === 'recipes'
              ? 'fruitAi.topicRecipes'
              : 'fruitAi.topicHealth';
        setTopicDone((prev) => ({ ...prev, [key]: true }));
        pushMessage({
          role: 'assistant',
          topicTitle: t(titleKey),
          text: body.data?.text || '',
        });
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          t('fruitAi.topicFailed');
        pushMessage({ role: 'assistant', text: msg, isError: true });
      } finally {
        setTopicLoadingKey(null);
      }
    },
    [ensureCustomerAccess, pushMessage, t],
  );

  /** Gọi API sau khi ảnh user đã được đẩy lên UI (pickImage). */
  const runAnalyzeAfterPreview = useCallback(
    async (asset, fileSizeBytes) => {
      try {
        const body = await analyzeFruitImage(asset);

        if (body.status === 'ERR') {
          setStatus('error');
          const msg = body.message || t('fruitAi.requestFailed');
          setErrorText(msg);
          pushMessage({ role: 'assistant', text: msg, isError: true });
          return;
        }

        if (body.phase === 'low_confidence') {
          setStatus('success');
          pushMessage({
            role: 'assistant',
            variant: 'lowConfidence',
            message: body.message || '',
          });
          return;
        }

        if (body.phase === 'success') {
          setStatus('success');
          const follow = body.data?.geminiFollowUp;
          const ctx = follow?.context;

          if (body.productAvailable === false) {
            pushMessage({
              role: 'assistant',
              variant: 'notInShop',
              message: body.message || '',
              context: ctx,
            });
            if (ctx?.fruitLabelEn) appendTopicPrompt(ctx);
            return;
          }

          const products = body.data?.products || [];
          pushMessage({
            role: 'assistant',
            variant: 'inShop',
            products,
            context: ctx,
          });
          if (ctx?.fruitLabelEn) appendTopicPrompt(ctx);
        }
      } catch (err) {
        setStatus('error');
        const msg = resolveAnalyzeError(err, fileSizeBytes, MAX_FRUIT_IMAGE_BYTES);
        setErrorText(msg);
        pushMessage({ role: 'assistant', text: msg, isError: true });
      }
    },
    [pushMessage, appendTopicPrompt, t],
  );

  const pickImage = useCallback(async () => {
    if (!ensureCustomerAccess()) return;
    if (status === 'loading') return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('common.error'), t('profile.grantLibraryAccess'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const size = asset.fileSize || 0;

    if (size > MAX_FRUIT_IMAGE_BYTES) {
      const msg = t('fruitAi.imageTooLarge', {
        size: formatMb(size),
        max: formatMb(MAX_FRUIT_IMAGE_BYTES),
      });
      setStatus('error');
      setErrorText(msg);
      pushMessage({ role: 'assistant', text: msg, isError: true });
      return;
    }

    // Giống web: hiện bubble ảnh user ngay, rồi mới analyzing
    setErrorText('');
    pushMessage({
      role: 'user',
      imageUri: asset.uri,
      caption: asset.fileName || asset.uri.split('/').pop() || '',
    });
    setStatus('loading');

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });

    await runAnalyzeAfterPreview(asset, size);
  }, [ensureCustomerAccess, status, runAnalyzeAfterPreview, pushMessage, t]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setStatus('idle');
    setErrorText('');
    setTopicDone({});
    setTopicLoadingKey(null);
  }, []);

  const closePanel = useCallback(() => setOpen(false), []);

  const renderMessage = (m, index) => {
    const key = m.id || `msg-${index}`;

    if (m.role === 'user' && m.imageUri) {
      return (
        <View key={key} style={[styles.bubbleRow, styles.bubbleRowUser]}>
          <View style={[styles.bubble, styles.bubbleUser]}>
            <View style={styles.userImageFrame}>
              <Image
                source={{ uri: m.imageUri }}
                style={styles.userImage}
                resizeMode="cover"
                onLoadEnd={() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }}
              />
            </View>
            {m.caption ? (
              <Text style={styles.caption} numberOfLines={1}>
                {m.caption}
              </Text>
            ) : null}
          </View>
        </View>
      );
    }

    if (m.topicPrompt && m.context) {
      return (
        <View key={key} style={[styles.bubbleRow, styles.bubbleRowBot]}>
          <View style={[styles.bubble, styles.bubbleBot]}>
            <Text style={styles.topicIntro}>{t('fruitAi.topicIntro')}</Text>
            <Text style={styles.topicHint}>{t('fruitAi.topicHint')}</Text>
            <View style={styles.topicBtnsWrap}>
              {TOPIC_IDS.map((tid) => {
                const btnKey = `${m.promptId}-${tid}`;
                const done = topicDone[btnKey];
                const loading = topicLoadingKey === btnKey;
                const labelKey =
                  tid === 'nutrition'
                    ? 'fruitAi.topicNutrition'
                    : tid === 'recipes'
                      ? 'fruitAi.topicRecipes'
                      : 'fruitAi.topicHealth';
                return (
                  <TouchableOpacity
                    key={tid}
                    style={[
                      styles.topicBtn,
                      (done || loading) && styles.topicBtnDisabled,
                      tid !== TOPIC_IDS[TOPIC_IDS.length - 1] && styles.topicBtnSpacing,
                    ]}
                    disabled={done || loading}
                    onPress={() => handleTopicPick(m.promptId, tid, m.context)}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#5b21b6" style={{ marginRight: 8 }} />
                    ) : null}
                    <Text style={styles.topicBtnText}>
                      {done ? '✓ ' : ''}
                      {t(labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      );
    }

    if (m.variant === 'lowConfidence') {
      return (
        <View key={key} style={[styles.bubbleRow, styles.bubbleRowBot]}>
          <View style={[styles.bubble, styles.bubbleBot]}>
            <Text style={styles.bodyText}>{m.message}</Text>
            <Text style={styles.mutedSmall}>{t('fruitAi.tryClearerPhoto')}</Text>
          </View>
        </View>
      );
    }

    if (m.variant === 'notInShop') {
      return (
        <View key={key} style={[styles.bubbleRow, styles.bubbleRowBot]}>
          <View style={[styles.bubble, styles.bubbleBot]}>
            <Text style={styles.amberTitle}>{m.message}</Text>
            <Text style={styles.mutedSmall}>{t('fruitAi.notInShopExtra')}</Text>
          </View>
        </View>
      );
    }

    if (m.variant === 'inShop') {
      return (
        <View key={key} style={[styles.bubbleRow, styles.bubbleRowBot]}>
          <View style={[styles.bubble, styles.bubbleBot]}>
            <Text style={styles.bodyText}>{t('fruitAi.inShopMessage')}</Text>
            <Text style={styles.mutedSmall}>{t('fruitAi.inShopTap')}</Text>
            <Text style={styles.shopLabel}>{t('fruitAi.shopSection')}</Text>
            {(m.products || []).map((p) => (
              <TouchableOpacity
                key={String(p._id)}
                style={styles.productLink}
                onPress={() => {
                  setOpen(false);
                  navigation.navigate('ProductDetail', { productId: p._id });
                }}
              >
                <Text style={styles.productLinkText}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (m.role === 'assistant' && m.text != null) {
      return (
        <View key={key} style={[styles.bubbleRow, styles.bubbleRowBot]}>
          <View style={[styles.bubble, styles.bubbleBot]}>
            {m.topicTitle ? (
              <View style={styles.topicTitleRow}>
                <Ionicons name="sparkles" size={14} color="#6d28d9" />
                <Text style={styles.topicTitleText}> {m.topicTitle}</Text>
              </View>
            ) : null}
            <Text style={[styles.bodyText, m.isError && styles.errorText]}>{m.text}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <>
      {!open && (
        <TouchableOpacity
          style={styles.fab}
          onPress={openPanel}
          activeOpacity={0.9}
          accessibilityLabel={t('fruitAi.openAriaLabel')}
        >
          <LinearGradient colors={['#7c3aed', '#4f46e5']} style={styles.fabGradient}>
            <Ionicons name="sparkles" size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <Modal visible={open} animationType="fade" transparent onRequestClose={closePanel}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closePanel}>
          <TouchableOpacity
            style={[styles.panelWrap, { width: PANEL_W }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <LinearGradient colors={['#7c3aed', '#4f46e5']} style={styles.panelHeader}>
              <View style={styles.headerLeft}>
                <Ionicons name="sparkles" size={22} color="#fff" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.headerTitle}>{t('fruitAi.title')}</Text>
                  <Text style={styles.headerSub}>{t('fruitAi.subtitle')}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closePanel} hitSlop={12}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.panelBody}>
              <ScrollView
                ref={scrollRef}
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                keyboardShouldPersistTaps="handled"
              >
                {messages.length === 0 && (
                  <View style={[styles.bubbleRow, styles.bubbleRowBot]}>
                    <View style={[styles.bubble, styles.bubbleBot]}>
                      <Text style={styles.bodyText}>{t('fruitAi.emptyIntro')}</Text>
                    </View>
                  </View>
                )}
                {messages.map((m, i) => renderMessage(m, i))}
                {status === 'loading' && (
                  <View style={[styles.bubbleRow, styles.bubbleRowBot]}>
                    <View style={[styles.loadingPill, styles.bubbleBot]}>
                      <ActivityIndicator size="small" color="#6d28d9" />
                      <Text style={styles.loadingText}>{t('fruitAi.analyzing')}</Text>
                    </View>
                  </View>
                )}
                {status === 'error' && errorText && messages.length === 0 && (
                  <View style={styles.inlineError}>
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                    <Text style={styles.inlineErrorText}>{errorText}</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.footer}>
                <View style={styles.footerRow}>
                  <TouchableOpacity
                    style={[styles.uploadBtn, styles.uploadBtnFlex, status === 'loading' && styles.btnDisabled]}
                    onPress={pickImage}
                    disabled={status === 'loading'}
                  >
                    <Ionicons name="camera" size={18} color="#fff" />
                    <Text style={[styles.uploadBtnText, { marginLeft: 8 }]}>{t('fruitAi.uploadPhoto')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.clearBtn} onPress={clearChat}>
                    <Text style={styles.clearBtnText}>{t('fruitAi.clear')}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.footerHint}>{t('fruitAi.footerHint')}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 96,
    width: 56,
    height: 56,
    borderRadius: 28,
    zIndex: 49,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 100 : 88,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  panelWrap: {
    maxHeight: Math.min(560, Dimensions.get('window').height * 0.72),
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ede9fe',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  headerSub: { color: 'rgba(255,255,255,0.88)', fontSize: 11, marginTop: 2 },
  panelBody: {
    backgroundColor: '#f8fafc',
    maxHeight: 480,
  },
  scroll: { maxHeight: 360 },
  scrollContent: { padding: 12, paddingBottom: 8 },
  bubbleRow: { marginBottom: 10, flexDirection: 'row' },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowBot: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '92%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#7c3aed',
    borderBottomRightRadius: 6,
  },
  bubbleBot: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ede9fe',
    borderBottomLeftRadius: 6,
  },
  /** Khung cố định để vùng ảnh hiện ngay (giống web preview), không chờ decode xong mới có layout */
  userImageFrame: {
    width: 220,
    maxWidth: '100%',
    height: 176,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
  caption: { color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 6 },
  bodyText: { color: '#1f2937', fontSize: 14, lineHeight: 20 },
  mutedSmall: { color: '#6b7280', fontSize: 12, marginTop: 8, lineHeight: 18 },
  amberTitle: { color: '#92400e', fontWeight: '600', fontSize: 14 },
  errorText: { color: '#dc2626' },
  topicBtnsWrap: { marginTop: 10 },
  topicIntro: { color: '#1f2937', fontWeight: '600', fontSize: 14 },
  topicHint: { color: '#6b7280', fontSize: 12, marginTop: 6, lineHeight: 18 },
  topicBtnSpacing: { marginBottom: 8 },
  topicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    backgroundColor: '#f5f3ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  topicBtnDisabled: { opacity: 0.55 },
  topicBtnText: { color: '#4c1d95', fontSize: 14, flex: 1 },
  topicTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  topicTitleText: { fontSize: 12, fontWeight: '700', color: '#6d28d9' },
  shopLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 10, marginBottom: 6 },
  productLink: {
    borderWidth: 1,
    borderColor: '#ddd6fe',
    backgroundColor: '#f5f3ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  productLinkText: { color: '#5b21b6', fontWeight: '600', fontSize: 14 },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  loadingText: { color: '#6d28d9', fontSize: 12, marginLeft: 10 },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  inlineErrorText: { flex: 1, color: '#dc2626', fontSize: 12, lineHeight: 18, marginLeft: 8 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#ede9fe',
    padding: 12,
    backgroundColor: '#fff',
  },
  footerRow: { flexDirection: 'row', alignItems: 'stretch' },
  uploadBtnFlex: { flex: 1, marginRight: 10 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 12,
  },
  btnDisabled: { opacity: 0.5 },
  uploadBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  clearBtn: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clearBtnText: { color: '#6b7280', fontSize: 12 },
  footerHint: {
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 8,
  },
});
