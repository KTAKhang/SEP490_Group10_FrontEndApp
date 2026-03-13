import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import apiClient from "../utils/mobileAxiosConfig";

/**
 * API profile/user - chỉ gọi backend (folder src).
 * GET /profile/user-info, PUT /profile/update-user, PUT /profile/change-password.
 */

export async function getUserProfileApi() {
  const response = await apiClient.get("/profile/user-info");

  const data = response.data;

  if (data.status !== "OK") {
    throw new Error(data.message);
  }

  return data.data;
}


/**
 * Backend: PUT /profile/update-user
 * Body: user_name, phone, address, birthday, gender; optional file avatar (multipart).
 */
export async function updateUserProfileApi({
  user_name,
  fullName,
  phone,
  address,
  birthday,
  gender,
  avatar,
}) {
  // console.log("data",data)
  const formData = new FormData();
   if (user_name != null) formData.append("user_name", user_name);
   if (fullName != null) formData.append("fullName", fullName);
    if (phone != null) formData.append("phone", phone);
    if (address != null) formData.append("address", address);
    if (birthday != null) formData.append("birthday", birthday);
    if (gender != null) formData.append("gender", gender);
    if (avatar && avatar.uri) {
      formData.append("avatar", {
        uri: avatar.uri.startsWith("file://")
          ? avatar.uri
          : `file://${avatar.uri}`,
        name: avatar.name || `avatar_${Date.now()}.jpg`,
        type: avatar.type || "image/jpeg",
      });
    }

  const response = await apiClient.put(
  "/profile/update-user",
  formData,
  {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }
);

  return response.data;
}

/**
 * Backend: PUT /profile/change-password (dùng trong userSlice / Profile).
 */
export async function changePasswordApi(payload) {
  const response = await apiClient.put(
    "/profile/change-password",
    payload
  );

  const data = response.data;

  if (data.status !== "OK") {
    throw new Error(data.message);
  }

  return data;
}
// export async function updateUserProfileApi({
//   user_name,
//   phone,
//   address,
//   birthday,
//   gender,
//   avatar,
// }) {
//   try {
//     const token = await AsyncStorage.getItem("token");
//     if (!token) throw new Error("Cần đăng nhập");
//     const formData = new FormData();
//     if (user_name != null) formData.append("user_name", user_name);
//     if (phone != null) formData.append("phone", phone);
//     if (address != null) formData.append("address", address);
//     if (birthday != null) formData.append("birthday", birthday);
//     if (gender != null) formData.append("gender", gender);
//     if (avatar && avatar.uri) {
//       formData.append("avatar", {
//         uri: avatar.uri.startsWith("file://")
//           ? avatar.uri
//           : `file://${avatar.uri}`,
//         name: avatar.name || `avatar_${Date.now()}.jpg`,
//         type: avatar.type || "image/jpeg",
//       });
//     }
//     const response = await axios.put(
//       `${API_BASE_URL}/profile/update-user`,
//       formData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//      "Content-Type": "multipart/form-data",     
//           Accept: "application/json",
//         },
//       },
//     );
//     const data = response.data;

//     if (data.status !== "OK") {
//       throw new Error(data.message || "Cập nhật thất bại");
//     }
//     return data.data ?? data;
//   } catch (error) {
//     console.log("UPDATE PROFILE ERROR >>>", error);
//   console.log("error.response >>>", error.response);
//   console.log("error.response?.data >>>", error.response?.data);

//     throw new Error(
      
//       error.response?.data?.message || error.message || "Cập nhật thất bại",
//     );
//   }
// }
