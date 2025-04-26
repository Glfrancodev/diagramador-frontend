import axiosInstance from './axiosInstance';

// Iniciar sesión
export const login = (correo, password) => {
  return axiosInstance.post('/auth/login', { correo, password });
};

// Obtener perfil del usuario autenticado
export const getPerfil = () => {
  return axiosInstance.get('/usuarios/perfil');
};

// Registrar nuevo usuario
export const registrarUsuario = (datosUsuario) => {
  return axiosInstance.post('/usuarios', datosUsuario);
};

// Obtener todos los usuarios (admin)
export const listarUsuarios = () => {
  return axiosInstance.get('/usuarios');
};

// Obtener usuario por ID
export const obtenerUsuario = (id) => {
  return axiosInstance.get(`/usuarios/${id}`);
};

// Actualizar usuario por ID
export const actualizarUsuario = (id, datosActualizados) => {
  return axiosInstance.put(`/usuarios/${id}`, datosActualizados);
};

// Cambiar estado activo/inactivo
export const cambiarEstadoUsuario = (id) => {
  return axiosInstance.patch(`/usuarios/${id}/estado`);
};
