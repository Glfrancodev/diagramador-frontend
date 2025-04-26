import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api', // 👈 Base URL para todo
});

// Interceptar request para agregar Authorization automáticamente
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // El token se guarda como 'token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
