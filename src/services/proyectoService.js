import axiosInstance from './axiosInstance';

// Crear nuevo proyecto
export const crearProyecto = (datosProyecto) => {
  return axiosInstance.post('/proyectos', datosProyecto);
};

// Listar mis propios proyectos
export const listarMisProyectos = () => {
  return axiosInstance.get('/proyectos/mis-proyectos');
};

// Listar proyectos donde soy invitado
export const listarProyectosCompartidos = () => {
  return axiosInstance.get('/proyectos/invitados');
};

// Obtener un proyecto por ID
export const obtenerProyecto = (id) => {
  return axiosInstance.get(`/proyectos/${id}`);
};

// Actualizar proyecto propio
export const actualizarProyecto = (id, datosActualizados) => {
  return axiosInstance.put(`/proyectos/${id}`, datosActualizados);
};

// Eliminar proyecto propio
export const eliminarProyecto = (id) => {
  return axiosInstance.delete(`/proyectos/${id}`);
};
