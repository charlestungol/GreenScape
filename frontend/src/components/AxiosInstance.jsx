import axios from 'axios'

const baseUrl = 'http://127.0.0.1:8000/'

const AxiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 5000, 
    headers:{
        "Content-Type":"application/json",
        accept:"application/json"
    }
})

// Add a request interceptor to include the access token in headers
AxiosInstance.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// OPTIONAL: Auto-refresh access token on 401 using refresh token
let isRefreshing = false;
let queue = [];

// Response interceptor to handle 401 errors and refresh tokens
AxiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) throw error;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((newAccess) => {
          original.headers.Authorization = `Bearer ${newAccess}`;
          return AxiosInstance(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post("http://127.0.0.1:8000/api/auth/token/refresh/", { refresh });
        localStorage.setItem("access", data.access);
        AxiosInstance.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        queue.forEach((p) => p.resolve(data.access));
        queue = [];
        original.headers.Authorization = `Bearer ${data.access}`;
        return AxiosInstance(original);
      } catch (e) {
        queue.forEach((p) => p.reject(e));
        queue = [];
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        throw e;
      } finally {
        isRefreshing = false;
      }
    }
    throw error;
  }
);

export default AxiosInstance