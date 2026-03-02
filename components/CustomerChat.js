import React, { useEffect, useState, useRef, useCallback } from "react";
import { PanResponder } from "react-native";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import api from "../api";
import { socket } from "../socket";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const isSameDay = (a, b) => {
  if (!a || !b) return false;
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const formatDateHeader = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(dateStr, today.toISOString())) return "Today";
  if (isSameDay(dateStr, yesterday.toISOString())) return "Yesterday";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatLastSeen = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

// ─────────────────────────────────────────────
// SENDING DOTS ANIMATION
// ─────────────────────────────────────────────
const SendingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(600),
        ]),
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  const dotStyle = (anim) => ({
    ...styles.dot,
    opacity: anim,
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
      },
    ],
  });

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Text style={styles.sendingText}>Đang gửi</Text>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
};

// ─────────────────────────────────────────────
// DATE SEPARATOR
// ─────────────────────────────────────────────
const DateSeparator = ({ label }) => (
  <View style={styles.dateSeparatorWrap}>
    <View style={styles.dateSeparatorLine} />
    <Text style={styles.dateSeparatorText}>{label}</Text>
    <View style={styles.dateSeparatorLine} />
  </View>
);

// ─────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────
const MessageBubble = ({ message, prevMessage }) => {
  const isCustomer = message.senderRole === "customer";
  const showDate =
    !prevMessage || !isSameDay(prevMessage.createdAt, message.createdAt);

  return (
    <>
      {showDate && (
        <DateSeparator label={formatDateHeader(message.createdAt)} />
      )}
      <View
        style={[
          styles.bubbleRow,
          isCustomer ? styles.bubbleRowRight : styles.bubbleRowLeft,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isCustomer ? styles.bubbleCustomer : styles.bubbleStaff,
          ]}
        >
          {!!message.content && (
            <Text
              style={[
                styles.bubbleText,
                isCustomer ? styles.bubbleTextCustomer : styles.bubbleTextStaff,
              ]}
            >
              {message.content}
            </Text>
          )}
          {message.images && message.images.length > 0 && (
            <View style={styles.imageGrid}>
              {message.images.map((img, idx) => (
                <Image
                  key={idx}
                  source={{ uri: img }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
          <Text
            style={[
              styles.bubbleTime,
              { color: isCustomer ? "rgba(255,255,255,0.75)" : "#9ca3af" },
            ]}
          >
            {formatTime(message.createdAt)}
          </Text>
        </View>
      </View>
    </>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function CustomerChat() {
  // Drag state
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    }),
  ).current;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const [onlineStaffs, setOnlineStaffs] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [activeTab, setActiveTab] = useState("online");
  const [historyRooms, setHistoryRooms] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [room, setRoom] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [hasMore, setHasMore] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  const flatListRef = useRef(null);

  // ── Load user ──────────────────────────────
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      setIsAuthenticated(!!token);
      const raw = await AsyncStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.role_name === "customer") setUser(parsed);
      }
    })();
  }, []);

  // ── Online staffs ──────────────────────────
  useEffect(() => {
    const handleConnect = () => socket.emit("get_online_staffs");
    const handleOnlineStaffs = (staffs) => {
      if (Array.isArray(staffs)) {
        setOnlineStaffs(staffs);
        return;
      }
      if (staffs && typeof staffs === "object") {
        setOnlineStaffs(Object.values(staffs));
        return;
      }
      setOnlineStaffs([]);
    };

    if (socket.connected) socket.emit("get_online_staffs");
    socket.on("connect", handleConnect);
    socket.on("online_staffs", handleOnlineStaffs);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("online_staffs", handleOnlineStaffs);
    };
  }, []);

  // ── Load history rooms ─────────────────────
  const loadHistoryRooms = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get("/chat/user/rooms");
      setHistoryRooms(res.data.data || []);
    } catch (err) {
      console.error("loadHistoryRooms failed:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "history") loadHistoryRooms();
  }, [isOpen, activeTab]);

  // ── Receive message ────────────────────────
  useEffect(() => {
    const handler = (message) => {
      if (!room) return;
      const msgRoomId =
        typeof message.room === "string" ? message.room : message.room?._id;
      if (msgRoomId === room._id) setMessages((prev) => [...prev, message]);
    };
    socket.on("receive_message", handler);
    return () => socket.off("receive_message", handler);
  }, [room]);

  // ── Join room ──────────────────────────────
  useEffect(() => {
    if (room?._id) socket.emit("join_room", room._id);
  }, [room]);

  // ── Scroll to bottom ───────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }, [messages]);

  // ── Load messages ──────────────────────────
  const loadMessages = useCallback(
    async (roomId, { before = null, prepend = false, limit = 6 } = {}) => {
      if (!roomId) return;
      if (prepend && loadingMore) return;
      if (prepend) setLoadingMore(true);

      try {
        const params = { limit };
        if (before) params.before = before;

        const res = await api.get(`/chat/room/${roomId}/messages`, { params });
        const payload = res.data?.data ?? res.data;
        const fetched = Array.isArray(payload)
          ? payload
          : payload.messages || [];
        const more =
          typeof payload === "object" && payload.hasMore !== undefined
            ? payload.hasMore
            : fetched.length === limit;
        const oldest =
          typeof payload === "object" && payload.oldestMessageId
            ? payload.oldestMessageId
            : fetched.length > 0
              ? fetched[0]._id
              : null;

        if (prepend) {
          setMessages((prev) => [...fetched, ...prev]);
        } else {
          setMessages(fetched);
        }

        setHasMore(more);
        setOldestMessageId(oldest ?? null);
      } catch (err) {
        console.error("loadMessages failed:", err);
      } finally {
        if (prepend) setLoadingMore(false);
        setInitializing(false);
      }
    },
    [loadingMore],
  );

  // ── Open history room ─────────────────────
  const openHistoryRoom = async (r) => {
    if (room?._id) socket.emit("leave_room", room._id);
    setMessages([]);
    setRoom(r);
    const staffOnline = onlineStaffs.find((s) => s.staffId === r.staff?._id);
    if (staffOnline) {
      setSelectedStaff(staffOnline);
      setIsReadOnly(false);
    } else {
      setSelectedStaff({
        userName: r.staff?.user_name ?? "",
        avatar: r.staff?.avatar ?? "",
        staffId: r.staff?._id ?? "",
      });
      setIsReadOnly(true);
    }
    setHasMore(false);
    setOldestMessageId(null);
    setInitializing(true);
    await loadMessages(r._id);
  };

  // ── Create room with staff ─────────────────
  const createRoomWithStaff = async (staff) => {
    try {
      if (room?._id) socket.emit("leave_room", room._id);
      setMessages([]);
      setSelectedStaff(staff);
      setIsReadOnly(false);
      const res = await api.post("/chat/room", { staffId: staff.staffId });
      const createdRoom = res.data.data;
      setRoom(createdRoom);
      setHasMore(false);
      setOldestMessageId(null);
      setInitializing(true);
      await loadMessages(createdRoom._id);
    } catch (err) {
      console.error("createRoomWithStaff error:", err);
    }
  };

  // ── Send message ───────────────────────────
  const sendMessage = async () => {
    if (!room || !user || isReadOnly) return;
    if (!text.trim() && selectedImages.length === 0) return;
    if (isSending) return;
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append("roomId", room._id);
      formData.append("content", text.trim());
      formData.append("senderRole", "customer");
      selectedImages.forEach((file, idx) => {
        const uri = file.uri;
        const name =
          file.name ||
          file.fileName ||
          uri.split("/").pop() ||
          `image_${Date.now()}_${idx}.jpg`;
        let type = file.type || file.mime || "image/jpeg";
        if (!type.includes("/")) {
          const ext = name.split(".").pop() || "jpg";
          type = `image/${ext === "jpg" ? "jpeg" : ext}`;
        }
        formData.append("images", { uri, name, type });
      });
      const res = await api.post("/chat/message", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      socket.emit("send_message", { roomId: room._id, message: res.data.data });
      setText("");
      setSelectedImages([]);
    } catch (err) {
      console.error("Send message failed:", err);
    } finally {
      setIsSending(false);
    }
  };

  // ── Pick image ─────────────────────────────
  const pickImages = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("The right to be denied", "You need photo access to select images.");
        return;
      }

      const remaining = 3 - selectedImages.length;
      if (remaining <= 0) {
        Alert.alert("Limit", "You can only select a maximum of 3 photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.cancelled === true || result.canceled === true) return;

      const assets = Array.isArray(result.assets)
        ? result.assets
        : Array.isArray(result.selected)
          ? result.selected
          : result.uri
            ? [{ uri: result.uri, fileName: result.fileName }]
            : [];

      const picked = assets.slice(0, remaining).map((a, i) => {
        const uri = a.uri;
        const name =
          a.fileName ||
          a.fileName ||
          uri.split("/").pop() ||
          `image_${Date.now()}_${i}.jpg`;
        const ext = name.split(".").pop()?.toLowerCase() || "jpg";
        const type =
          a.type && a.type.includes("/")
            ? a.type
            : `image/${ext === "jpg" ? "jpeg" : ext}`;
        return { uri, name, type };
      });

      setSelectedImages((prev) => [...prev, ...picked].slice(0, 3));
    } catch (err) {
      console.error("pickImages error:", err);
      Alert.alert("Error", "Cannot select image");
    }
  };

  // ── Close / Back ───────────────────────────
  const closeChat = () => {
    if (room?._id) socket.emit("leave_room", room._id);
    setIsOpen(false);
    setRoom(null);
    setMessages([]);
    setSelectedStaff(null);
    setIsReadOnly(false);
  };

  const backToList = () => {
    if (room?._id) socket.emit("leave_room", room._id);
    setRoom(null);
    setMessages([]);
    setSelectedStaff(null);
    setIsReadOnly(false);
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (!isAuthenticated) {
              Alert.alert("Notification", "Please log in to chat.");
              return;
            }
            setIsOpen(true);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>💬</Text>
        </TouchableOpacity>
      )}

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={closeChat}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Animated.View
            style={[
              styles.chatBox,
              {
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
              },
            ]}
          >
            {/* ── Header ── */}
            <Animated.View style={styles.header} {...panResponder.panHandlers}>
              <View style={styles.headerLeft}>
                {room && (
                  <TouchableOpacity onPress={backToList} style={styles.backBtn}>
                    <Text style={styles.headerIcon}>‹</Text>
                  </TouchableOpacity>
                )}
                <View>
                  <Text style={styles.headerTitle}>
                    {selectedStaff ? selectedStaff.userName : "Chat Support"}
                  </Text>
                  <Text style={styles.headerSub}>
                    {selectedStaff
                      ? isReadOnly
                        ? "🔒 View only — offline staff"
                        : "🟢 Online"
                      : `${onlineStaffs.length} online staff`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeChat} style={styles.closeBtn}>
                <Text style={styles.headerIcon}>✕</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* ── LIST VIEW ── */}
            {!room && (
              <>
                {/* Tabs */}
                <View style={styles.tabs}>
                  {["online", "history"].map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.tab,
                        activeTab === tab && styles.tabActive,
                      ]}
                      onPress={() => setActiveTab(tab)}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          activeTab === tab && styles.tabTextActive,
                        ]}
                      >
                        {tab === "online"
                          ? "👥 online staff"
                          : "🕐 History"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Online Tab */}
                {activeTab === "online" && (
                  <ScrollView contentContainerStyle={styles.onlineTab}>
                    <Text style={styles.sectionLabel}>
                      SELECT A STAFF MEMBER TO CHAT WITH
                    </Text>
                    <View style={styles.staffGrid}>
                      {onlineStaffs.map((staff) => (
                        <TouchableOpacity
                          key={staff.staffId}
                          style={styles.staffItem}
                          onPress={() => createRoomWithStaff(staff)}
                        >
                          <View style={styles.avatarWrap}>
                            <Image
                              source={{ uri: staff.avatar }}
                              style={styles.staffAvatar}
                            />
                            <View style={styles.onlineDot} />
                          </View>
                          <Text style={styles.staffName} numberOfLines={1}>
                            {staff.userName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {onlineStaffs.length === 0 && (
                      <Text style={styles.emptyText}>
                        There are currently no staff online.
                      </Text>
                    )}
                  </ScrollView>
                )}

                {/* History Tab */}
                {activeTab === "history" && (
                  <>
                    {loadingHistory ? (
                      <View style={styles.centerBox}>
                        <ActivityIndicator color="#16a34a" />
                      </View>
                    ) : historyRooms.length === 0 ? (
                      <View style={styles.centerBox}>
                        <Text style={styles.emptyText}>
                          Chưa có lịch sử chat
                        </Text>
                      </View>
                    ) : (
                      <FlatList
                        data={historyRooms}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item: r }) => {
                          const staffOnline = onlineStaffs.find(
                            (s) => String(s.staffId) === String(r.staff?._id),
                          );
                          return (
                            <TouchableOpacity
                              style={styles.historyItem}
                              onPress={() => openHistoryRoom(r)}
                            >
                              <View style={styles.avatarWrap}>
                                <Image
                                  source={{ uri: r.staff?.avatar }}
                                  style={styles.historyAvatar}
                                />
                                <View
                                  style={[
                                    styles.statusDot,
                                    {
                                      backgroundColor: staffOnline
                                        ? "#22c55e"
                                        : "#9ca3af",
                                    },
                                  ]}
                                />
                              </View>
                              <View style={styles.historyInfo}>
                                <View style={styles.historyRow}>
                                  <Text
                                    style={styles.historyName}
                                    numberOfLines={1}
                                  >
                                    {r.staff?.user_name}
                                  </Text>
                                  <Text style={styles.historyDate}>
                                    {formatLastSeen(r.updatedAt)}
                                  </Text>
                                </View>
                                <Text
                                  style={styles.historyLastMsg}
                                  numberOfLines={1}
                                >
                                  {r.lastMessage || "Chưa có tin nhắn"}
                                </Text>
                                <Text
                                  style={[
                                    styles.historyStatus,
                                    {
                                      color: staffOnline
                                        ? "#16a34a"
                                        : "#9ca3af",
                                    },
                                  ]}
                                >
                                  {staffOnline
                                    ? "🟢 Online — nhấn để chat"
                                    : "🔒 Chỉ xem lịch sử"}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        }}
                        ItemSeparatorComponent={() => (
                          <View style={styles.separator} />
                        )}
                      />
                    )}
                  </>
                )}
              </>
            )}

            {/* ── CHAT AREA ── */}
            {room && (
              <>
                {/* Read-only banner */}
                {isReadOnly && (
                  <View style={styles.readonlyBanner}>
                    <Text style={styles.readonlyText}>
                      🔒 Nhân viên đang offline. Bạn chỉ có thể xem lịch sử hội
                      thoại.
                    </Text>
                  </View>
                )}

                {/* Messages */}
                {initializing ? (
                  <View style={styles.centerBox}>
                    <ActivityIndicator color="#16a34a" />
                  </View>
                ) : (
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item, idx) => item._id ?? String(idx)}
                    renderItem={({ item, index }) => (
                      <MessageBubble
                        message={item}
                        prevMessage={messages[index - 1]}
                      />
                    )}
                    contentContainerStyle={styles.messageList}
                    ListHeaderComponent={
                      hasMore ? (
                        <TouchableOpacity
                          style={styles.loadMoreBtn}
                          onPress={() => {
                            if (!loadingMore && room?._id && oldestMessageId)
                              loadMessages(room._id, {
                                before: oldestMessageId,
                                prepend: true,
                              });
                          }}
                        >
                          <Text style={styles.loadMoreText}>
                            {loadingMore ? "Đang tải..." : "Tải thêm"}
                          </Text>
                        </TouchableOpacity>
                      ) : null
                    }
                    ListFooterComponent={
                      isSending ? (
                        <View
                          style={[
                            styles.bubbleRow,
                            styles.bubbleRowRight,
                            { marginBottom: 8 },
                          ]}
                        >
                          <View style={[styles.bubble, styles.bubbleSending]}>
                            <SendingDots />
                          </View>
                        </View>
                      ) : null
                    }
                  />
                )}

                {/* Image preview */}
                {!isReadOnly && selectedImages.length > 0 && (
                  <ScrollView
                    horizontal
                    style={styles.imagePreviewBar}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {selectedImages.map((file, index) => (
                      <View key={index}>
                        <Image
                          source={{ uri: file.uri }}
                          style={styles.previewImage}
                        />
                        <TouchableOpacity
                          style={styles.removeImageBtn}
                          onPress={() =>
                            setSelectedImages((prev) =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <Text style={styles.removeImageText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {/* Input / Read-only footer */}
                {isReadOnly ? (
                  <View style={styles.readonlyFooter}>
                    <Text style={styles.readonlyFooterText}>
                      🔒 Nhân viên offline — không thể gửi tin nhắn
                    </Text>
                  </View>
                ) : (
                  <View style={styles.inputBar}>
                    <TouchableOpacity
                      style={[styles.attachBtn, isSending && { opacity: 0.5 }]}
                      onPress={pickImages}
                      disabled={isSending}
                    >
                      <Text style={styles.attachIcon}>📎</Text>
                    </TouchableOpacity>
                    <TextInput
                      value={text}
                      onChangeText={setText}
                      placeholder={
                        isSending ? "Đang gửi..." : "Nhập tin nhắn..."
                      }
                      placeholderTextColor="#9ca3af"
                      style={[styles.input, isSending && { opacity: 0.6 }]}
                      editable={!isSending}
                      multiline
                      onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendBtn,
                        (isSending ||
                          (!text.trim() && selectedImages.length === 0)) && {
                          opacity: 0.5,
                        },
                      ]}
                      onPress={sendMessage}
                      disabled={
                        isSending ||
                        (!text.trim() && selectedImages.length === 0)
                      }
                    >
                      {isSending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.sendIcon}>➤</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const GREEN = "#16a34a";
const GREEN_LIGHT = "#22c55e";

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 100,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 50,
  },
  fabIcon: { fontSize: 26 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  chatBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
     bottom: 30,
    maxHeight: "90%",
    minHeight: "60%",
    overflow: "hidden",
  },

  // Header
  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  backBtn: { paddingRight: 6 },
  closeBtn: { padding: 4 },
  headerIcon: { color: "#fff", fontSize: 22, fontWeight: "300" },
  headerTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 12 },

  // Tabs
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: GREEN },
  tabText: { color: "#6b7280", fontSize: 13 },
  tabTextActive: { color: GREEN, fontWeight: "600" },

  // Online Tab
  onlineTab: { padding: 16, flexGrow: 1 },
  sectionLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  staffGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  staffItem: { alignItems: "center", width: 60 },
  avatarWrap: { position: "relative" },
  staffAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  staffName: {
    fontSize: 11,
    color: "#374151",
    marginTop: 4,
    width: 60,
    textAlign: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: GREEN_LIGHT,
    borderWidth: 2,
    borderColor: "#fff",
  },

  // History Tab
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  historyAvatar: { width: 48, height: 48, borderRadius: 24 },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  historyInfo: { flex: 1, minWidth: 0 },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyName: { fontWeight: "600", color: "#111827", fontSize: 14, flex: 1 },
  historyDate: { fontSize: 11, color: "#9ca3af", marginLeft: 8 },
  historyLastMsg: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  historyStatus: { fontSize: 11, marginTop: 2 },
  separator: { height: 1, backgroundColor: "#f3f4f6", marginLeft: 76 },

  // Chat area
  messageList: { padding: 12, paddingBottom: 16 },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: { color: "#9ca3af", fontSize: 14, textAlign: "center" },

  // Date separator
  dateSeparatorWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  dateSeparatorLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dateSeparatorText: { fontSize: 11, color: "#9ca3af", marginHorizontal: 8 },

  // Message bubbles
  bubbleRow: { flexDirection: "row", marginVertical: 2 },
  bubbleRowLeft: { justifyContent: "flex-start" },
  bubbleRowRight: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "72%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleCustomer: { backgroundColor: GREEN, borderBottomRightRadius: 4 },
  bubbleStaff: { backgroundColor: "#fff", borderBottomLeftRadius: 4 },
  bubbleSending: { backgroundColor: "#4ade80", borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextCustomer: { color: "#fff" },
  bubbleTextStaff: { color: "#1f2937" },
  bubbleTime: { fontSize: 10, marginTop: 4 },

  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  messageImage: { width: 100, height: 100, borderRadius: 8 },

  // Read-only
  readonlyBanner: {
    backgroundColor: "#fffbeb",
    borderBottomWidth: 1,
    borderBottomColor: "#fde68a",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  readonlyText: { fontSize: 12, color: "#92400e" },
  readonlyFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f9fafb",
    alignItems: "center",
  },
  readonlyFooterText: { fontSize: 12, color: "#9ca3af" },

  // Input
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 8,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  attachIcon: { fontSize: 18 },
  input: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    maxHeight: 80,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: { color: "#fff", fontSize: 16 },

  imagePreviewBar: {
    maxHeight: 100,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  previewImage: { width: 80, height: 80, borderRadius: 8 },
  removeImageBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageText: { color: "#fff", fontSize: 10, fontWeight: "600" },

  sendingText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginRight: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "rgba(255,255,255,0.85)",
  },

  loadMoreBtn: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 8,
  },
  loadMoreText: { fontSize: 13, color: GREEN },
});
