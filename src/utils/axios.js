import axios from "axios";
import Cookies from "js-cookie";
import { commonRouters } from "../router/router.config";

// In dev, use relative /api so Vite proxy forwards to backend (avoids CORS).
const baseURL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const api = axios.create({
  baseURL,
  timeout: 2800000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AUTH_PAGE_PATHS = new Set(commonRouters.map((r) => r.path));

const clearAuthAndRedirect = () => {
  localStorage.clear();
  Cookies.remove("token");
  Cookies.remove("refreshToken");
  window.location.replace("/signin");
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    if (status !== 401) {
      return Promise.reject(error?.response?.data ?? error);
    }

    const onAuthPage = AUTH_PAGE_PATHS.has(window.location.pathname);
    if (onAuthPage) {
      return Promise.reject(error?.response?.data ?? error);
    }

    // Admin API has no refresh token; redirect to signin on 401
    clearAuthAndRedirect();
    return Promise.reject(error?.response?.data ?? error);
  }
);

export default api;
