import { io } from "socket.io-client";
import { API_BASE_URL } from "./config/apiConfig";

export const socket = io(API_BASE_URL, {
  transports: ["websocket"], // QUAN TRỌNG với mobile
});