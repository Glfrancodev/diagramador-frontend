import axiosInstance from './axiosInstance';

// Crear nueva pestaña
export const crearPestana = (datosPestana) => {
  return axiosInstance.post('/pestanas', datosPestana);
};

// Listar pestañas de un proyecto
export const listarPestanasPorProyecto = (idProyecto) => {
  return axiosInstance.get(`/pestanas/proyecto/${idProyecto}`);
};

// Obtener una pestaña específica
export const obtenerPestana = (id) => {
  return axiosInstance.get(`/pestanas/${id}`);
};

// Actualizar pestaña
export const actualizarPestana = (id, datosActualizados) => {
  return axiosInstance.put(`/pestanas/${id}`, datosActualizados);
};

// Eliminar pestaña
export const eliminarPestana = (id) => {
  return axiosInstance.delete(`/pestanas/${id}`);
};
