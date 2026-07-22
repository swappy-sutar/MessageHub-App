import axios from 'axios';

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

export { axiosInstance };