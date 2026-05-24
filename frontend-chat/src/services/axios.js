import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://10.10.10.55:80/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Interceptor to attach the auth token to every request
axiosInstance.interceptors.request.use((config) => {
  // Assuming you store the Sanctum token in localStorage after login
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
