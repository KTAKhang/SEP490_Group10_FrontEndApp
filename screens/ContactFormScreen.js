import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import {
  fetchContactCategories,
  createContact,
  contactClearMessages,
} from '../store/slices/contactSlice';

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_PREFIXES = ['image/'];
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt'];

function getFileExtension(name = '') {
  const idx = name.lastIndexOf('.');
  if (idx === -1) return '';
  return name.slice(idx + 1).toLowerCase();
}

function isAllowedFile(file) {
  const mime = (file.mimeType || file.type || '').toLowerCase();
  const name = file.name || file.fileName || '';
  const ext = getFileExtension(name);

  if (mime && ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))) return true;
  if (ext && ALLOWED_EXTENSIONS.includes(ext)) return true;
  return false;
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

export default function ContactFormScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const {
    categories,
    categoriesLoading,
    createContactLoading,
    createContactSuccess,
    createContactMessage,
    createContactError,
  } = useSelector((state) => state.contact);
  const { user } = useSelector((state) => state.auth);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const fallbackCategories = [
    'Sản phẩm',
    'Bảo hành',
    'Chính sách',
    'Dịch vụ',
    'Khác',
  ];
  
  const finalCategories =
    categories && categories.length > 0
      ? categories
      : fallbackCategories;

  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchContactCategories());
    }
  }, [dispatch]);

  useEffect(() => {
    if (createContactSuccess) {
      if (createContactMessage) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: createContactMessage,
        });
      }
      setSubject('');
      setCategory('');
      setMessage('');
      setFiles([]);
      dispatch(contactClearMessages());
      navigation.navigate('ContactHistory');
    }
  }, [createContactSuccess, createContactMessage, dispatch, navigation]);

  useEffect(() => {
    if (createContactError) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: createContactError,
      });
      dispatch(contactClearMessages());
    }
  }, [createContactError, dispatch]);

  const canSubmit = useMemo(() => {
    const s = subject.trim();
    const m = message.trim();
    return (
      !createContactLoading &&
      s.length >= 5 &&
      s.length <= 200 &&
      category &&
      m.length >= 10
    );
  }, [subject, category, message, createContactLoading]);

  const validateForm = () => {
    const newErrors = {};
    const s = subject.trim();
    const m = message.trim();

    if (!s) newErrors.subject = 'Vui lòng nhập tiêu đề.';
    else if (s.length < 5) newErrors.subject = 'Tiêu đề phải có ít nhất 5 ký tự.';
    else if (s.length > 200)
      newErrors.subject = 'Tiêu đề không được vượt quá 200 ký tự.';

    if (!category) newErrors.category = 'Vui lòng chọn danh mục.';

    if (!m) newErrors.message = 'Vui lòng nhập nội dung.';
    else if (m.length < 10) newErrors.message = 'Nội dung phải có ít nhất 10 ký tự.';

    if (files.length > MAX_FILES) {
      newErrors.files = `Chỉ được đính kèm tối đa ${MAX_FILES} file.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickFiles = async () => {
    try {
      const remaining = MAX_FILES - files.length;
      if (remaining <= 0) {
        Toast.show({
          type: 'info',
          text1: 'Giới hạn file',
          text2: `Bạn chỉ có thể chọn tối đa ${MAX_FILES} file.`,
        });
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
        type: '*/*',
      });

      if (result.canceled) return;

      const picked = result.assets || [];
      const selected = picked.slice(0, remaining);

      const invalidFiles = [];
      const tooBigFiles = [];

      const mapped = selected
        .map((file) => {
          const allowed = isAllowedFile(file);
          const size = file.size ?? file.fileSize;
          if (!allowed) {
            invalidFiles.push(file.name || file.fileName || 'Unknown');
            return null;
          }
          if (size != null && size > MAX_FILE_SIZE_BYTES) {
            tooBigFiles.push(file.name || file.fileName || 'Unknown');
            return null;
          }
          return {
            uri: file.uri,
            name: file.name || file.fileName || 'attachment',
            type: file.mimeType || file.type || 'application/octet-stream',
            size,
          };
        })
        .filter(Boolean);

      if (invalidFiles.length) {
        Toast.show({
          type: 'error',
          text1: 'File không hợp lệ',
          text2:
            'Chỉ cho phép các loại: hình ảnh, PDF, DOC/DOCX, TXT.',
        });
      }

      if (tooBigFiles.length) {
        Toast.show({
          type: 'error',
          text1: 'File quá lớn',
          text2: `Mỗi file tối đa ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`,
        });
      }

      setFiles((prev) => [...prev, ...mapped].slice(0, MAX_FILES));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể chọn file. Vui lòng thử lại.',
      });
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    dispatch(
      createContact({
        subject: subject.trim(),
        category,
        message: message.trim(),
        files,
      }),
    );
  };

  const CategoryPicker = () => {
    if (!showCategoryPicker) return null;
  
    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerBox}>
          <ScrollView>
            {finalCategories.map((c, idx) => {
              const value =
                typeof c === 'string'
                  ? c
                  : c.value ?? c.id ?? c._id ?? c.code ?? c.name;
  
              const label =
                typeof c === 'string'
                  ? c
                  : c.label ?? c.name ?? c.display_name ?? String(value);
  
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.pickerItem}
                  onPress={() => {
                    setCategory(value);
                    setErrors((prev) => ({ ...prev, category: null }));
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
  
          <TouchableOpacity
            style={styles.pickerClose}
            onPress={() => setShowCategoryPicker(false)}
          >
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
              Đóng
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const headerTitle = 'Liên hệ hỗ trợ';

  const selectedCategoryLabel = useMemo(() => {
    if (!category) return '';
    const found = categories.find((c) => {
      const value = c.value ?? c.id ?? c._id ?? c.code ?? c.name;
      return String(value) === String(category);
    });
    if (!found) return '';
    return found.label ?? found.name ?? String(category);
  }, [category, categories]);

  if (user && user.role_name === 'admin') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
        <LinearGradient
          colors={COLORS.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <View style={styles.headerSpacer} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={[styles.content, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: COLORS.text.secondary, textAlign: 'center', paddingHorizontal: 24 }}>
            Chức năng liên hệ khách hàng chỉ dành cho tài khoản Customer.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
      <LinearGradient
        colors={COLORS.gradient.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{headerTitle}</Text>
            <TouchableOpacity
              style={styles.headerLinkButton}
              onPress={() => navigation.navigate('ContactHistory')}
            >
              <Text style={styles.headerLinkText}>Lịch sử</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Gửi liên hệ mới</Text>
        <Text style={styles.sectionHint}>
          Vui lòng mô tả chi tiết vấn đề hoặc góp ý của bạn. Đội ngũ hỗ trợ sẽ phản hồi trong thời gian sớm nhất.
        </Text>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Tiêu đề <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              errors.subject && styles.inputError,
            ]}
            placeholder="Nhập tiêu đề liên hệ (tối thiểu 5 ký tự)"
            placeholderTextColor={COLORS.text.light}
            value={subject}
            onChangeText={(text) => {
              setSubject(text);
              if (errors.subject) {
                setErrors((prev) => ({ ...prev, subject: null }));
              }
            }}
            maxLength={200}
          />
          <View style={styles.helperRow}>
            <Text style={styles.helperText}>{subject.trim().length}/200</Text>
          </View>
          {errors.subject ? <Text style={styles.errorText}>{errors.subject}</Text> : null}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Danh mục <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdown,
              errors.category && styles.inputError,
            ]}
            onPress={() => {
              if (categoriesLoading) return;
              setShowCategoryPicker(true);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={
                category ? styles.dropdownValue : styles.dropdownPlaceholder
              }
            >
              {category
                ? selectedCategoryLabel || 'Đã chọn danh mục'
                : categoriesLoading
                ? 'Đang tải danh mục...'
                : 'Chọn danh mục liên hệ'}
            </Text>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={22}
              color={COLORS.text.light}
            />
          </TouchableOpacity>
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Nội dung <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.textarea,
              errors.message && styles.inputError,
            ]}
            placeholder="Mô tả chi tiết vấn đề, góp ý hoặc yêu cầu hỗ trợ..."
            placeholderTextColor={COLORS.text.light}
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              if (errors.message) {
                setErrors((prev) => ({ ...prev, message: null }));
              }
            }}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <View style={styles.helperRow}>
            <Text style={styles.helperText}>
              {message.trim().length >= 10
                ? ''
                : `Cần thêm ${Math.max(0, 10 - message.trim().length)} ký tự nữa để đạt tối thiểu.`}
            </Text>
          </View>
          {errors.message ? <Text style={styles.errorText}>{errors.message}</Text> : null}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>File đính kèm (tùy chọn)</Text>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handlePickFiles}
            activeOpacity={0.9}
          >
            <MaterialIcons name="attach-file" size={20} color={COLORS.primary} />
            <Text style={styles.attachButtonText}>Chọn file</Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            Tối đa {MAX_FILES} file, mỗi file ≤ {formatFileSize(MAX_FILE_SIZE_BYTES)}.
            Cho phép: hình ảnh, PDF, DOC/DOCX, TXT.
          </Text>
          {files.length > 0 && (
            <View style={styles.fileList}>
              {files.map((file, index) => (
                <View key={`${file.uri}-${index}`} style={styles.fileItem}>
                  <View style={styles.fileInfo}>
                    <MaterialIcons
                      name="insert-drive-file"
                      size={18}
                      color={COLORS.primary}
                    />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text
                        style={styles.fileName}
                        numberOfLines={1}
                      >
                        {file.name}
                      </Text>
                      {file.size != null && (
                        <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeFileButton}
                    onPress={() => handleRemoveFile(index)}
                  >
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {errors.files ? <Text style={styles.errorText}>{errors.files}</Text> : null}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!canSubmit || createContactLoading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit || createContactLoading}
        >
          {createContactLoading ? (
            <Text style={styles.submitButtonText}>
              {files.length > 0 ? 'Đang tải file lên...' : 'Đang gửi liên hệ...'}
            </Text>
          ) : (
            <Text style={styles.submitButtonText}>Gửi liên hệ</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CategoryPicker />
    </View>
  );
}

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
    elevation: 5,
    shadowColor: COLORS.shadow.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerSpacer: {
    width: 60,
    height: 44,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    flex: 1,
    marginHorizontal: 12,
  },
  headerLinkButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  headerLinkText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    marginTop: -20,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 6,
  },
  required: {
    color: '#DC2626',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border.dark,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: '#FFFFFF',
  },
  textarea: {
    borderWidth: 1,
    borderColor: COLORS.border.dark,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: '#FFFFFF',
    minHeight: 120,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  helperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.text.light,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#DC2626',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border.dark,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownPlaceholder: {
    color: COLORS.text.light,
    fontSize: 14,
  },
  dropdownValue: {
    color: COLORS.text.primary,
    fontSize: 14,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#E0F2FE',
    marginBottom: 4,
  },
  attachButtonText: {
    marginLeft: 4,
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  fileList: {
    marginTop: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    fontSize: 13,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 11,
    color: COLORS.text.light,
    marginTop: 2,
  },
  removeFileButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: 360,
    paddingBottom: 12,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  pickerItemText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  pickerClose: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});

