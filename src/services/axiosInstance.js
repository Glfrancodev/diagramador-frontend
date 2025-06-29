import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://diagramador-backend-production.up.railway.app/api',
});

// Interceptor para incluir token automáticamente
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // <- Verifica que guardas el token en el login
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosInstance;
