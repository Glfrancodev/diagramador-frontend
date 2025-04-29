import { createContext, useContext, useState } from "react";
import axiosInstance from "../services/axiosInstance";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  /* ---------- estado ---------- */
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  const navigate = useNavigate();

  /* ---------- login ---------- */
  const login = async (correo, password) => {
    try {
      /* 1) petición de login */
      const { data } = await axiosInstance.post("/auth/login", {
        correo,
        password,
      });

      /* 2) guarda el token */
      localStorage.setItem("token", data.token);

      /* 3) pide el perfil para obtener el nombre
            (si tu API ya lo enviara en la respuesta de login,
            bastaría con:  localStorage.setItem('nombre', data.usuario.nombre) ) */
      const { data: perfil } = await axiosInstance.get("/usuarios/perfil");
      localStorage.setItem("nombre", perfil.nombre || "");

      setIsAuthenticated(true);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      alert("Credenciales inválidas");
    }
  };

  /* ---------- logout ---------- */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("nombre");   // 🔑 limpia también el nombre
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
