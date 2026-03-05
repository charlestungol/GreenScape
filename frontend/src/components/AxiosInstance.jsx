import axios from "axios";

const AxiosInstance = axios.create({
  baseURL: "http://localhost:8000/",
  timeout: 5000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default AxiosInstance;