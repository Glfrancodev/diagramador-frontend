import { createContext, useContext, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();

  const login = async (email, password) => {
    try {
        const response = await axiosInstance.post('/auth/login', { correo: email, password });
      const { token } = response.data;
      
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Credenciales inválidas');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
