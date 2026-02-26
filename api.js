import axios from "axios";
import { API_BASE_URL } from "./config/apiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
const api = axios.create({
  baseURL: API_BASE_URL, // backend của bạn
  withCredentials: true, // nếu dùng cookie
});

// nếu dùng Bearer token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore token read errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
