import axios from 'axios';
import Cookies from 'js-cookie';

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_API_BACKEND_URL;
  if (envUrl && envUrl.trim() && !envUrl.includes("undefined")) {
    return envUrl;
  }

  // Fallback to live Render backend when deployed on Vercel or custom domains
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://messagehub-i52c.onrender.com";
  }

  return "http://localhost:3000";
};

const BASE_URL = getBackendUrl();
const normalizedBaseUrl = BASE_URL.replace(/\/+$/, "");

const axiosInstance = axios.create({
  baseURL: `${normalizedBaseUrl}/api/v1`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Access Token to every request automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token") || Cookies.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variables for handling refresh token queue
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Auto-refresh Access Token on 401 (TOKEN_EXPIRED)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh token request itself fails or endpoint is login/signup
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/signup") &&
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get("refreshToken");
        const res = await axios.post(
          `${normalizedBaseUrl}/api/v1/auth/refresh-token`,
          { refreshToken },
          { withCredentials: true }
        );

        if (res.data?.success && (res.data?.token || res.data?.accessToken)) {
          const newToken = res.data.token || res.data.accessToken;
          Cookies.set("token", newToken, { expires: 1, secure: true });
          if (res.data.refreshToken) {
            Cookies.set("refreshToken", res.data.refreshToken, { expires: 7, secure: true });
          }

          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          processQueue(null, newToken);
          return axiosInstance(originalRequest);
        } else {
          throw new Error("Failed to refresh session");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);

        // Session expired: Clear cookies and trigger logout state dynamically
        Cookies.remove("token");
        Cookies.remove("refreshToken");

        if (typeof window !== "undefined") {
          // Dynamic import to avoid circular dependency
          import("../store/useAuthStore.js").then(({ useAuthStore }) => {
            useAuthStore.getState().handleSessionExpired();
          });
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { axiosInstance };