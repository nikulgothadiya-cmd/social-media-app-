import { io } from "socket.io-client";
import { getToken } from "./token.js";

let socket;

export function getSocket() {
  if (!socket) {
    const base = import.meta.env.VITE_API_BASE || "http://localhost:5000";
    socket = io(base, {
      auth: { token: getToken() }
    });
  }
  return socket;
}

export function resetSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
