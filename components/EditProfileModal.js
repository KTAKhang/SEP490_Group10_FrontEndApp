import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useActionSheet } from "@expo/react-native-action-sheet";
import * as ImagePicker from "expo-image-picker";
import { MinimalLoading } from "./Loading";
import DateTimePicker from "@react-native-community/datetimepicker";
const EditProfileModal = ({ visible, onClose, profile, onSave }) => {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [ward, setWard] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [wardsList, setWardsList] = useState([]);
  const [icity, setIcity] = useState("");
  const [cityCode, setCityCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageLoading, setImageLoading] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingWard, setPendingWard] = useState("");
  const [pendingCity, setPendingCity] = useState("");
  const { showActionSheetWithOptions } = useActionSheet();

  useEffect(() => {
    if (visible) {
      setName(profile?.user_name || "");
      if (profile?.avatar) {
        setAvatar({
          uri: profile.avatar,
          name: "avatar.jpg",
          type: "image/jpeg",
        });
      } else {
        setAvatar(null);
      }
      setPhone(profile?.phone || "");
      setGender(profile?.gender || "");
      setErrors({});

      if (profile?.birthday) {
        const d = new Date(profile.birthday);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setBirthday(`${yyyy}-${mm}-${dd}`);
      } else {
        setBirthday("");
      }

      if (profile?.address) {
        const parts = profile.address.split(",").map((p) => p.trim());
        setAddress(parts[0] || "");
        setPendingWard(parts[1] || "");
        setPendingCity(parts[2] || "");
      } else {
        setAddress("");
        setPendingWard("");
        setPendingCity("");
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, profile]);

  // Load provinces once
  useEffect(() => {
    const API_BASE = "https://provinces.open-api.vn/api/v2";
    fetch(`${API_BASE}/p/`)
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch(() => setProvinces([]));
  }, []);

  // Match city từ pendingCity
  useEffect(() => {
    if (!pendingCity || provinces.length === 0) return;

    const matched = provinces.find(
      (p) =>
        p.name === pendingCity ||
        p.name_with_type === pendingCity ||
        pendingCity.includes(p.name) ||
        p.name.includes(pendingCity),
    );

    if (matched) {
      setCityCode(matched.code);
      setIcity(matched.name);
      fetch("https://provinces.open-api.vn/api/v2/w/")
        .then((res) => res.json())
        .then((data) => {
          const filtered = data.filter(
            (w) => w.province_code === Number(matched.code),
          );
          setWardsList(filtered);
        })
        .catch(() => setWardsList([]));
    }
  }, [pendingCity, provinces]);

  // Match ward từ pendingWard
  useEffect(() => {
    if (!pendingWard || wardsList.length === 0) return;

    const matched = wardsList.find(
      (w) =>
        w.name === pendingWard ||
        pendingWard.includes(w.name) ||
        w.name.includes(pendingWard),
    );

    if (matched) {
      setWard(matched.name);
      setPendingWard("");
    }
  }, [pendingWard, wardsList]);

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Vui lòng nhập tên người dùng";
    } else if (name.trim().length < 2) {
      newErrors.name = "Tên phải có ít nhất 2 ký tự";
    } else if (name.trim().length > 50) {
      newErrors.name = "Tên không được vượt quá 50 ký tự";
    }

    if (!phone || !/^[0-9]{9,11}$/.test(phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (!address || address.trim().length < 5) {
      newErrors.address = "Vui lòng nhập địa chỉ";
    }

    if (!cityCode || !icity) {
      newErrors.city = "Vui lòng chọn tỉnh/thành";
    }

    if (!ward) {
      newErrors.ward = "Vui lòng chọn phường/xã";
    }

    if (!gender) {
      newErrors.gender = "Vui lòng chọn giới tính";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImageFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Bạn cần cấp quyền truy cập thư viện.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];

      setAvatar({
        uri: asset.uri,
        name: asset.fileName || "avatar.jpg",
        type: asset.type ? `${asset.type}/jpeg` : "image/jpeg",
      });
    }
  };

  const takePhotoFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Bạn cần cấp quyền truy cập camera.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];

      setAvatar({
        uri: asset.uri,
        name: "avatar.jpg",
        type: "image/jpeg",
      });
    }
  };

  const handleChangeAvatar = () => {
    // Tạm thời ẩn modal để action sheet hiển thị đúng
    setShowActionSheet(true);

    // Delay ngắn để đảm bảo modal đã ẩn
    setTimeout(() => {
      const options = [
        "Chọn từ thư viện",
        "Chụp ảnh mới",
        "Nhập URL",
        "Xóa ảnh",
        "Hủy",
      ];
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
        },
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
        setAvatar("");
        break;
      default:
        break;
    }
  };

  const showCityPicker = () => {
    if (!provinces || provinces.length === 0) return;
    const options = provinces.map((p) => p.name).concat("Hủy");
    const cancelButtonIndex = options.length - 1;

    setShowActionSheet(true); // ẩn modal trước
    setTimeout(() => {
      showActionSheetWithOptions(
        { options, cancelButtonIndex },
        (buttonIndex) => {
          setShowActionSheet(false); // hiện lại modal
          if (buttonIndex === cancelButtonIndex) return;
          const p = provinces[buttonIndex];
          setIcity(p.name);
          setCityCode(p.code);
          setWard("");
          fetch("https://provinces.open-api.vn/api/v2/w/")
            .then((res) => res.json())
            .then((data) => {
              const filtered = data.filter(
                (w) => w.province_code === Number(p.code),
              );
              setWardsList(filtered);
            })
            .catch(() => setWardsList([]));
        },
      );
    }, 100);
  };

  const showWardPicker = () => {
    if (!wardsList || wardsList.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn tỉnh/thành trước");
      return;
    }
    const options = wardsList.map((w) => w.name).concat("Hủy");
    const cancelButtonIndex = options.length - 1;

    setShowActionSheet(true); // ẩn modal trước
    setTimeout(() => {
      showActionSheetWithOptions(
        { options, cancelButtonIndex },
        (buttonIndex) => {
          setShowActionSheet(false); // hiện lại modal
          if (buttonIndex === cancelButtonIndex) return;
          setWard(wardsList[buttonIndex].name);
        },
      );
    }, 100);
  };

  const showGenderPicker = () => {
    const options = ["male", "female", "other", "Hủy"];
    const cancelButtonIndex = 3;

    setShowActionSheet(true); // ẩn modal trước
    setTimeout(() => {
      showActionSheetWithOptions(
        { options, cancelButtonIndex },
        (buttonIndex) => {
          setShowActionSheet(false); // hiện lại modal
          if (buttonIndex === cancelButtonIndex) return;
          setGender(options[buttonIndex]);
        },
      );
    }, 100);
  };
  const showUrlInputDialog = () => {
    Alert.prompt(
      "Nhập URL ảnh",
      "Vui lòng nhập đường dẫn ảnh:",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "OK",
          onPress: (url) => {
            if (url && url.trim()) {
              setAvatar(url.trim());
            }
          },
        },
      ],
      "plain-text",
      avatar,
    );
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedProfile = {
        user_name: name.trim(),
        avatar: avatar,
        phone: phone.trim(),
        address: `${address.trim()}, ${ward}, ${icity}`,
        birthday: birthday || null,
        gender: gender || null,
      };

      await onSave(updatedProfile);
      // if(isUpdateSuccess){}
      onClose();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật hồ sơ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const hasChanges =
      name !== (profile?.user_name || "") || avatar !== (profile?.avatar || "");

    if (hasChanges) {
      Alert.alert("Xác nhận", "Bạn có muốn hủy những thay đổi chưa được lưu?", [
        { text: "Tiếp tục chỉnh sửa", style: "cancel" },
        { text: "Hủy thay đổi", onPress: onClose, style: "destructive" },
      ]);
    } else {
      onClose();
    }
  };

  const ErrorText = ({ error }) =>
    error ? <Text style={styles.errorText}>{error}</Text> : null;

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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
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
                          source={{ uri: avatar?.uri }}
                          style={styles.avatarPreview}
                          onLoadStart={handleImageLoadStart}
                          onLoadEnd={handleImageLoadEnd}
                          onError={handleImageError}
                        />
                        {imageLoading && (
                          <View style={styles.imageLoadingOverlay}>
                            <MinimalLoading size="small" color="#22c55e" />
                          </View>
                        )}
                      </>
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarPlaceholderText}>
                          {name ? name.charAt(0).toUpperCase() : "?"}
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
                      style={[styles.input, errors.name && styles.inputError]}
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

                  {/* <View style={styles.inputGroup}>
                    <Text style={styles.label}>URL ảnh đại diện</Text>
                    <TextInput
                      style={[styles.input, errors.avatar && styles.inputError]}
                      placeholder="https://example.com/avataraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg"
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
                  </View> */}

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Số điện thoại *</Text>
                    <TextInput
                      style={[styles.input, errors.phone && styles.inputError]}
                      placeholder="0123456789"
                      value={phone}
                      onChangeText={(text) => {
                        setPhone(text.replace(/[^0-9]/g, ""));
                        if (errors.phone) setErrors({ ...errors, phone: null });
                      }}
                      keyboardType="phone-pad"
                      maxLength={11}
                      editable={!loading}
                    />
                    <ErrorText error={errors.phone} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tỉnh / Thành *</Text>
                    <TouchableOpacity
                      style={[styles.input, errors.city && styles.inputError]}
                      onPress={showCityPicker}
                    >
                      <Text style={{ color: icity ? "#111" : "#9ca3af" }}>
                        {icity || "Chọn tỉnh/thành"}
                      </Text>
                    </TouchableOpacity>
                    <ErrorText error={errors.city} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phường / Xã *</Text>
                    <TouchableOpacity
                      style={[styles.input, errors.ward && styles.inputError]}
                      onPress={showWardPicker}
                    >
                      <Text style={{ color: ward ? "#111" : "#9ca3af" }}>
                        {ward || "Chọn phường/xã"}
                      </Text>
                    </TouchableOpacity>
                    <ErrorText error={errors.ward} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Địa chỉ *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.address && styles.inputError,
                      ]}
                      placeholder="Số nhà, tên đường..."
                      value={address}
                      onChangeText={(text) => {
                        setAddress(text);
                        if (errors.address)
                          setErrors({ ...errors, address: null });
                      }}
                      editable={!loading}
                    />
                    <ErrorText error={errors.address} />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ngày sinh</Text>

                    {/* Nút mở picker */}
                    <TouchableOpacity
                      style={[
                        styles.input,
                        errors.birthday && styles.inputError,
                      ]}
                      onPress={() => setShowDatePicker(true)}
                      disabled={loading}
                    >
                      <Text
                        style={{
                          color: birthday ? "#111" : "#9ca3af",
                          fontSize: 16,
                        }}
                      >
                        {birthday || "Chọn ngày sinh"}
                      </Text>
                    </TouchableOpacity>
                    <ErrorText error={errors.birthday} />

                    {/* DateTimePicker - Android hiện inline, iOS dùng modal */}
                    {showDatePicker && (
                      <DateTimePicker
                        value={
                          birthday ? new Date(birthday) : new Date(2000, 0, 1)
                        }
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                        onChange={(event, selectedDate) => {
                          // Android tự đóng sau chọn, iOS cần đóng thủ công
                          if (Platform.OS === "android") {
                            setShowDatePicker(false);
                          }
                          if (event.type === "dismissed") {
                            setShowDatePicker(false);
                            return;
                          }
                          if (selectedDate) {
                            const yyyy = selectedDate.getFullYear();
                            const mm = String(
                              selectedDate.getMonth() + 1,
                            ).padStart(2, "0");
                            const dd = String(selectedDate.getDate()).padStart(
                              2,
                              "0",
                            );
                            setBirthday(`${yyyy}-${mm}-${dd}`);
                            if (errors.birthday)
                              setErrors({ ...errors, birthday: null });
                          }
                        }}
                      />
                    )}

                    {/* Nút "Xác nhận" riêng cho iOS */}
                    {showDatePicker && Platform.OS === "ios" && (
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        style={styles.dateConfirmButton}
                      >
                        <Text style={styles.dateConfirmText}>Xác nhận</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Giới tính *</Text>
                    <TouchableOpacity
                      style={[styles.input, errors.gender && styles.inputError]}
                      onPress={showGenderPicker}
                    >
                      <Text style={{ color: gender ? "#111" : "#9ca3af" }}>
                        {gender ? gender.toUpperCase() : "Chọn giới tính"}
                      </Text>
                    </TouchableOpacity>
                    <ErrorText error={errors.gender} />
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    onPress={handleCancel}
                    style={[
                      styles.cancelButton,
                      loading && styles.disabledButton,
                    ]}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.cancelText,
                        loading && styles.disabledText,
                      ]}
                    >
                      Hủy
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSave}
                    style={[
                      styles.saveButton,
                      loading && styles.disabledButton,
                    ]}
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "bold",
  },
  dateConfirmButton: {
    marginTop: 8,
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#22c55e",
    borderRadius: 8,
  },
  dateConfirmText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 32,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: "#22c55e",
    borderWidth: 3,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#d1d5db",
    borderWidth: 2,
  },
  avatarPlaceholderText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#6b7280",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  changeAvatarButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderColor: "#22c55e",
    borderWidth: 1,
  },
  changeAvatarText: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "600",
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    flex: 1,
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    alignItems: "center",
  },
  cancelText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.6,
  },
});

export default EditProfileModal;
