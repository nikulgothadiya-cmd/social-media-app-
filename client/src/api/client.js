import axios from "axios";
import { getToken } from "./token.js";

// Dynamically set API URL based on current host
const getAPIBaseURL = () => {
  // Check if we're in development mode
  const isDev = import.meta.env.DEV || window.location.hostname === "localhost";
  
  if (isDev) {
    // Get the current hostname (could be localhost, 192.168.x.x, etc.)
    const hostname = window.location.hostname;
    const port = 5000; // Your backend port
    return `http://${hostname}:${port}/api`;
  }
  
  // Production: use relative path or environment variable
  return window.location.origin + "/api";
};

const api = axios.create({
  baseURL: getAPIBaseURL()
});

// Base URL of the backend without the /api prefix
export const getServerBaseURL = () => api.defaults.baseURL?.replace(/\/api$/, "") || window.location.origin;

// Normalize media URLs so mobile/local networks can access uploads
export const normalizeMediaUrl = (url) => {
  if (!url) return "";
  const base = getServerBaseURL();
  if (url.startsWith("http://localhost") || url.startsWith("https://localhost")) {
    return url.replace(/:\/\/localhost/i, `://${window.location.hostname}`);
  }
  if (url.startsWith("/")) {
    return `${base}${url}`;
  }
  return url;
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
