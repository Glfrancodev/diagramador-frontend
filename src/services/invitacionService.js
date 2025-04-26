import axiosInstance from './axiosInstance';

// Crear invitación a un proyecto
export const crearInvitacion = (datosInvitacion) => {
  return axiosInstance.post('/invitaciones', datosInvitacion);
};

// Listar invitaciones de un proyecto
export const listarInvitacionesPorProyecto = (idProyecto) => {
  return axiosInstance.get(`/invitaciones/proyecto/${idProyecto}`);
};

// Ver invitación específica
export const obtenerInvitacion = (id) => {
  return axiosInstance.get(`/invitaciones/${id}`);
};

// Aceptar o rechazar invitación
export const actualizarInvitacion = (id, datosActualizados) => {
  return axiosInstance.put(`/invitaciones/${id}`, datosActualizados);
};

// Eliminar invitación
export const eliminarInvitacion = (id) => {
  return axiosInstance.delete(`/invitaciones/${id}`);
};

// Listar invitaciones pendientes del usuario
export const listarInvitacionesPendientes = () => {
    return axiosInstance.get('/invitaciones/pendientes');
  };
  