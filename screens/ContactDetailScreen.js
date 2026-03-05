import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
  Image,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import {
  fetchContactDetail,
  sendContactReply,
  contactResetDetail,
} from '../store/slices/contactSlice';
import { COLORS } from '../constants/colors';
import { API_BASE_URL } from '../config/api';

const ContactDetailScreen = ({ route }) => {
  const { t } = useTranslation();
  const { contactId } = route.params;
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const scrollRef = useRef();

  const contactState = useSelector((state) => state.contact || {});
  const contactDetail = contactState.contactDetail || null;
  const repliesLoading = !!contactState.repliesLoading;
  const repliesError = contactState.repliesError || null;
  const sendReplyLoading = !!contactState.sendReplyLoading;
  const sendReplySuccess = !!contactState.sendReplySuccess;

  const [message, setMessage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    dispatch(fetchContactDetail(contactId));
    return () => dispatch(contactResetDetail());
  }, [contactId]);

  useEffect(() => {
    if (sendReplySuccess) {
      setMessage('');
      dispatch(fetchContactDetail(contactId));
    }
  }, [sendReplySuccess]);

  // Debug: log contactDetail để xem cấu trúc data thực tế
  useEffect(() => {
    if (contactDetail) {
      console.log('[ContactDetail] full data:', JSON.stringify(contactDetail, null, 2));
    }
  }, [contactDetail]);

  // ✅ FIX 1: Lấy replies & attachments an toàn từ Redux + contactDetail
  const replies = Array.isArray(contactState.replies)
    ? contactState.replies
    : [];
  const attachments =
    contactDetail?.attachments ||
    contactDetail?.files ||
    contactDetail?.images ||
    (Array.isArray(contactState.attachments) ? contactState.attachments : []) ||
    [];

  const handleSendReply = () => {
    if (!message.trim()) return;
    dispatch(sendContactReply({ contactId, message }));
  };

  // ✅ FIX 2: Check image bằng cả mime type lẫn extension, kể cả URL có query string
  const isImageFile = (str = '') => {
    if (!str || typeof str !== 'string') return false;
    // Bỏ query string trước khi check extension
    const cleanStr = str.split('?')[0].split('#')[0];
    return /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(cleanStr);
  };

  // ✅ FIX 3: Build URL an toàn, tránh double slash
  const buildFileUrl = (name) => {
    if (!name) return null;
    const base = API_BASE_URL.replace(/\/$/, '');
    return `${base}/uploads/contacts/${name}`;
  };

  // ✅ FIX 4: Normalize mỗi attachment thành { url, name, isImage }
  const normalizeAttachment = (file, idx) => {
    if (!file) return null;

    let url = null;
    let name = t('contact.fileLabel', { index: idx + 1 });
    let mime = '';

    if (typeof file === 'string') {
      // Nếu là string: có thể là full URL hoặc chỉ là filename
      if (file.startsWith('http://') || file.startsWith('https://')) {
        url = file;
      } else {
        url = buildFileUrl(file);
      }
      const lastSlash = file.lastIndexOf('/');
      name = lastSlash >= 0 ? file.slice(lastSlash + 1) : file;
    } else if (typeof file === 'object') {
      url =
        file.file_url ||   // ✅ key thực tế từ API
        file.url ||
        file.fileUrl ||
        file.location ||
        file.path ||
        file.secure_url ||
        null;
      // Nếu URL là relative path → thêm base
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = `${API_BASE_URL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
      }

      name =
        file.originalName ||
        file.originalname ||
        file.fileName ||
        file.filename ||
        file.name ||
        t('contact.fileLabel', { index: idx + 1 });

      mime =
        file.mimeType ||
        file.mimetype ||
        file.contentType ||
        file.type ||
        '';

      // Fallback: build URL từ filename nếu chưa có
      if (!url && name) {
        url = buildFileUrl(name);
      }
    }

    const isImage =
      (mime && typeof mime === 'string' && mime.toLowerCase().startsWith('image/')) ||
      isImageFile(name) ||
      isImageFile(url);

    console.log(`[Attachment ${idx}]`, { url, name, mime, isImage });

    return { url, name, mime, isImage };
  };

  if (repliesLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('contact.loadingDetail')}</Text>
      </View>
    );
  }

  if (repliesError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{repliesError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

      {/* IMAGE PREVIEW MODAL */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <TouchableOpacity
          style={styles.previewContainer}
          activeOpacity={1}
          onPress={() => setPreviewImage(null)}
        >
          <Image
            source={{ uri: previewImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>

      <LinearGradient
        colors={COLORS.gradient.primary}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('contact.detailTitle')}</Text>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {contactDetail && (
            <View style={styles.detailCard}>
              <Text style={styles.subject}>{contactDetail.subject}</Text>

              <View style={styles.originalMessageBox}>
                <Text style={styles.originalMessageLabel}>{t('contact.originalMessage')}</Text>
                <Text style={styles.originalMessage}>
                  {contactDetail.message}
                </Text>
              </View>

              {/* ===== ATTACHMENTS ===== */}
              {attachments.length > 0 && (
                <View style={styles.attachmentsBox}>
                  <Text style={styles.attachmentsLabel}>
                    Tệp đính kèm ({attachments.length})
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.attachmentsRow}
                  >
                    {attachments.map((file, idx) => {
                      const item = normalizeAttachment(file, idx);
                      if (!item) return null;
                      const { url, name, isImage } = item;

                      // ===== HÌNH ẢNH =====
                      if (isImage && url) {
                        return (
                          <View key={idx} style={styles.attachmentImageWrap}>
                            <TouchableOpacity
                              onPress={() => setPreviewImage(url)}
                              activeOpacity={0.85}
                            >
                              <Image
                                source={{ uri: url }}
                                style={styles.attachmentImage}
                                resizeMode="cover"
                                onError={(e) =>
                                  console.warn(
                                    '[Image error]',
                                    url,
                                    e.nativeEvent.error
                                  )
                                }
                              />
                              <View style={styles.zoomIcon}>
                                <Ionicons
                                  name="expand-outline"
                                  size={12}
                                  color="#fff"
                                />
                              </View>
                            </TouchableOpacity>
                            <Text
                              style={styles.attachmentCaption}
                              numberOfLines={1}
                            >
                              {name}
                            </Text>
                          </View>
                        );
                      }

                      // ===== FILE KHÔNG PHẢI ẢNH =====
                      return (
                        <View key={idx} style={styles.attachmentFileChip}>
                          <Ionicons
                            name="document-attach-outline"
                            size={18}
                            color={COLORS.primary}
                          />
                          <Text
                            style={styles.attachmentFileName}
                            numberOfLines={1}
                          >
                            {name}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* ===== REPLIES (ADMIN / CUSTOMER CHAT) ===== */}
          {replies && replies.length > 0 ? (
            replies.map((item, index) => {
              const senderRoleRaw =
                (item.senderRole && String(item.senderRole)) ||
                (item.sender?.role_name && String(item.sender.role_name)) ||
                (item.sender?.role && String(item.sender.role)) ||
                '';
              const senderRole = senderRoleRaw.toLowerCase();
              // Theo chat nội bộ: senderRole === 'customer' là tin nhắn của khách,
              // các giá trị khác (admin, staff, support, ...) xem như bên hỗ trợ.
              const isCustomer = senderRole === 'customer';
              const isAdmin = !isCustomer;
              const createdAtText = item.createdAt
                ? new Date(item.createdAt).toLocaleString('vi-VN')
                : '';

              return (
                <View
                  key={item._id || index}
                  style={[
                    styles.messageRow,
                    isAdmin ? styles.leftAlign : styles.rightAlign,
                  ]}
                >
                  {isAdmin && (
                    <View style={styles.avatarCircleAdmin}>
                      <MaterialIcons
                        name="support-agent"
                        size={18}
                        color="#fff"
                      />
                    </View>
                  )}

                  <View style={styles.messageContent}>
                    <View
                      style={[
                        styles.bubble,
                        isAdmin ? styles.adminBubble : styles.userBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          isCustomer && { color: '#fff' },
                        ]}
                      >
                        {item.message}
                      </Text>
                    </View>
                    <Text style={styles.bubbleMetaText}>
                      {isCustomer ? t('contact.you') : t('contact.support')}
                      {createdAtText ? ` • ${createdAtText}` : ''}
                    </Text>
                  </View>

                  {isCustomer && (
                    <View style={styles.avatarCircleUser}>
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color={COLORS.primary}
                      />
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyRepliesBox}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={40}
                color="#CBD5E1"
              />
              <Text style={styles.emptyRepliesTitle}>{t('contact.noReplies')}</Text>
              <Text style={styles.emptyRepliesText}>
                {t('contact.emptyRepliesText')}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* INPUT REPLY */}
        <View style={styles.replyContainer}>
          <TextInput
            style={styles.input}
            placeholder={t('contact.replyPlaceholder')}
            placeholderTextColor={COLORS.text.light}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendReply}
            disabled={sendReplyLoading}
          >
            {sendReplyLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    height: '80%',
    borderRadius: 12,
  },
  headerGradient: {
    paddingTop: (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    marginTop: -20,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: COLORS.shadow.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  subject: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: COLORS.text.primary,
  },
  originalMessageBox: {
    marginTop: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  originalMessageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  originalMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.primary,
  },
  attachmentsBox: {
    marginTop: 12,
  },
  attachmentsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  attachmentsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 4,
  },
  attachmentImageWrap: {
    width: 90,
    marginRight: 10,
  },
  attachmentImage: {
    width: 90,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  zoomIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 4,
    padding: 2,
  },
  attachmentCaption: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  attachmentFileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    marginRight: 8,
  },
  attachmentFileName: {
    marginLeft: 6,
    fontSize: 12,
    maxWidth: 140,
    color: COLORS.text.primary,
  },
  messageRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'flex-end',
  },
  leftAlign: {
    justifyContent: 'flex-start',
  },
  rightAlign: {
    justifyContent: 'flex-end',
  },
  messageContent: {
    maxWidth: '78%',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  adminBubble: {
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  bubbleMetaText: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.text.light,
  },
  avatarCircleAdmin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarCircleUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyRepliesBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  emptyRepliesTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  emptyRepliesText: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  replyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ContactDetailScreen;