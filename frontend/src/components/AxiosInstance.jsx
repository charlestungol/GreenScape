// AxiosInstance.js
import axios from "axios";

const AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  withCredentials: true, // allow sending/receiving cookies for /auth/refresh, /csrf
});

// XSRF config so Axios auto-sends CSRF for unsafe methods to cookie-protected endpoints
AxiosInstance.defaults.xsrfCookieName = "csrftoken";
AxiosInstance.defaults.xsrfHeaderName = "X-CSRFToken";

// Authorization header for normal API calls (access token in memory/localStorage)
AxiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token && token !== "null" && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});


export default AxiosInstance;