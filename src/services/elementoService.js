import axiosInstance from './axiosInstance';

// Crear nuevo elemento
export const crearElemento = (datosElemento) => {
  return axiosInstance.post('/elementos', datosElemento);
};

// Listar elementos de una pestaña
export const listarElementosPorPestana = (idPestana) => {
  return axiosInstance.get(`/elementos/pestana/${idPestana}`);
};

// Obtener un elemento específico
export const obtenerElemento = (id) => {
  return axiosInstance.get(`/elementos/${id}`);
};

// Actualizar un elemento
export const actualizarElemento = (id, datosActualizados) => {
  return axiosInstance.put(`/elementos/${id}`, datosActualizados);
};

// Eliminar un elemento
export const eliminarElemento = (id) => {
  return axiosInstance.delete(`/elementos/${id}`);
};
