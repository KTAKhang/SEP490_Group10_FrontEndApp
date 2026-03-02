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
} from 'react-native';
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

const ContactDetailScreen = ({ route }) => {
  const { contactId } = route.params;
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const scrollRef = useRef();

  const {
    contactDetail,
    replies,
    repliesLoading,
    repliesError,
    sendReplyLoading,
    sendReplySuccess,
    attachments,
  } = useSelector((state) => state.contact);

  const [message, setMessage] = useState('');

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

  const handleSendReply = () => {
    if (!message.trim()) return;
    dispatch(sendContactReply({ contactId, message }));
  };

  const getStatusText = (status) => {
    if (!status) return 'Đang xử lý';
    if (status === 'resolved') return 'Đã phản hồi';
    if (status === 'pending') return 'Chờ xử lý';
    return status;
  };

  const getStatusColor = (status) => {
    if (!status || status === 'pending') return '#F59E0B';
    if (status === 'resolved') return '#10B981';
    return '#6B7280';
  };

  if (repliesLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết liên hệ...</Text>
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

      {/* HEADER GRADIENT */}
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

            <Text style={styles.headerTitle}>Chi tiết liên hệ</Text>

            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* CONTENT */}
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
              <View style={styles.detailTopRow}>
                {contactDetail.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {contactDetail.category}
                    </Text>
                  </View>
                )}
                {contactDetail.status && (
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(
                          contactDetail.status,
                        ) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: getStatusColor(contactDetail.status) },
                      ]}
                    >
                      {getStatusText(contactDetail.status)}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.subject}>{contactDetail.subject}</Text>

              <View style={styles.metaRow}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={COLORS.text.light}
                />
                <Text style={styles.metaText}>
                  {contactDetail.createdAt
                    ? ` ${new Date(
                        contactDetail.createdAt,
                      ).toLocaleString('vi-VN')}`
                    : ' Thời gian không xác định'}
                </Text>
              </View>

              <View style={styles.originalMessageBox}>
                <Text style={styles.originalMessageLabel}>Nội dung liên hệ</Text>
                <Text style={styles.originalMessage}>
                  {contactDetail.message}
                </Text>
              </View>

              {attachments && attachments.length > 0 && (
                <View style={styles.attachmentsBox}>
                  <Text style={styles.attachmentsLabel}>Tệp đính kèm</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.attachmentsRow}
                  >
                    {attachments.map((file, idx) => {
                      // Hỗ trợ cả dạng object và string URL
                      let url = null;
                      let name = '';
                      let mime = '';

                      if (typeof file === 'string') {
                        url = file;
                        const lastSlash = file.lastIndexOf('/');
                        name =
                          lastSlash >= 0 ? file.slice(lastSlash + 1) : file;
                      } else if (file && typeof file === 'object') {
                        url =
                          file.url ||
                          file.path ||
                          file.fileUrl ||
                          file.location ||
                          null;
                        name =
                          file.originalName ||
                          file.filename ||
                          file.name ||
                          `Tệp ${idx + 1}`;
                        mime =
                          file.mimeType ||
                          file.contentType ||
                          '';
                      }

                      const isImage =
                        (typeof mime === 'string' &&
                          mime.toLowerCase().startsWith('image/')) ||
                        (typeof url === 'string' &&
                          /\.(png|jpe?g|gif|webp|bmp)$/i.test(url));

                      if (isImage && url) {
                        return (
                          <View key={idx} style={styles.attachmentImageWrap}>
                            <Image
                              source={{ uri: url }}
                              style={styles.attachmentImage}
                              resizeMode="cover"
                            />
                            {name ? (
                              <Text
                                style={styles.attachmentCaption}
                                numberOfLines={1}
                              >
                                {name}
                              </Text>
                            ) : null}
                          </View>
                        );
                      }

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
                            {name || `Tệp ${idx + 1}`}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {replies?.length > 0 ? (
            replies.map((item, index) => {
              const senderRole =
                (item.senderRole && String(item.senderRole)) ||
                (item.sender?.role_name && String(item.sender.role_name)) ||
                '';
              const isAdmin =
                item.isFromAdmin === true ||
                senderRole.toLowerCase() === 'admin';
              const createdAtText = item.createdAt
                ? new Date(item.createdAt).toLocaleString('vi-VN')
                : '';

              return (
                <View
                  key={index}
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
                          !isAdmin && { color: '#fff' },
                        ]}
                      >
                        {item.message}
                      </Text>
                    </View>
                    <Text style={styles.bubbleMetaText}>
                      {isAdmin ? 'Hỗ trợ' : 'Bạn'}
                      {createdAtText ? ` • ${createdAtText}` : ''}
                    </Text>
                  </View>
                  {!isAdmin && (
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
              <Text style={styles.emptyRepliesTitle}>
                Chưa có phản hồi nào
              </Text>
              <Text style={styles.emptyRepliesText}>
                Bạn có thể gửi tin nhắn phía dưới, bộ phận hỗ trợ sẽ phản hồi
                sớm nhất.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* INPUT */}
        <View style={styles.replyContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập phản hồi..."
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

export default ContactDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  headerGradient: {
    paddingTop: StatusBar.currentHeight + 10,
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

  detailTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
  },

  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  subject: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: COLORS.text.primary,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  metaText: {
    fontSize: 12,
    color: COLORS.text.light,
    marginLeft: 4,
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
    marginBottom: 12,
    alignItems: 'flex-end',
  },

  leftAlign: {
    justifyContent: 'flex-start',
  },

  rightAlign: {
    justifyContent: 'flex-end',
  },

  bubble: {
    maxWidth: '72%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
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

  messageContent: {
    maxWidth: '78%',
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

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});