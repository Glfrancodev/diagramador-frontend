import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProyectoCard from '../components/ProyectoCard';
import axiosInstance from '../services/axiosInstance';

function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [misProyectos, setMisProyectos] = useState([]);
  const [proyectosCompartidos, setProyectosCompartidos] = useState([]);

  const [mostrarMisProyectos, setMostrarMisProyectos] = useState(false);
  const [mostrarCompartidos, setMostrarCompartidos] = useState(false);

  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalInvitaciones, setModalInvitaciones] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [proyectoEditar, setProyectoEditar] = useState(null);

  const [invitacionesPendientes, setInvitacionesPendientes] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const perfilResponse = await axiosInstance.get('/usuarios/perfil');
      setPerfil(perfilResponse.data);

      const proyectosPropiosResponse = await axiosInstance.get('/proyectos/mis-proyectos');
      setMisProyectos(proyectosPropiosResponse.data);

      const proyectosInvitadosResponse = await axiosInstance.get('/proyectos/invitados');
      setProyectosCompartidos(proyectosInvitadosResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      logout();
    }
  };

  const cargarInvitaciones = async () => {
    try {
      const invitacionesResponse = await axiosInstance.get('/invitaciones/pendientes');
      const invitaciones = invitacionesResponse.data;

      const invitacionesEnriquecidas = await Promise.all(
        invitaciones.map(async (inv) => {
          try {
            const proyectoResponse = await axiosInstance.get(`/proyectos/${inv.idProyecto}`);
            const proyecto = proyectoResponse.data;

            const usuarioResponse = await axiosInstance.get(`/usuarios/${proyecto.idUsuario}`);
            const usuario = usuarioResponse.data;

            return {
              idInvitacion: inv.idInvitacion,
              nombreProyecto: proyecto.nombre,
              descripcionProyecto: proyecto.descripcion,
              correoDueno: usuario.correo,
              fechaInvitacion: inv.fechaInvitacion,
            };
          } catch (error) {
            console.error('Error enriqueciendo invitación:', error);
            return null;
          }
        })
      );

      setInvitacionesPendientes(invitacionesEnriquecidas.filter((inv) => inv !== null));
    } catch (error) {
      console.error('Error al cargar invitaciones:', error);
    }
  };

  const irAlProyecto = (idProyecto) => {
    navigate(`/proyecto/${idProyecto}`);
  };

  const handleCrearProyecto = async () => {
    if (!nuevoNombre.trim()) {
      alert('El nombre del proyecto es obligatorio.');
      return;
    }

    try {
      await axiosInstance.post('/proyectos', {
        nombre: nuevoNombre,
        descripcion: nuevaDescripcion
      });
      setModalCrear(false);
      setNuevoNombre('');
      setNuevaDescripcion('');
      cargarDatos();
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      alert('Hubo un error al crear el proyecto.');
    }
  };

  const abrirModalEditar = (proyecto) => {
    setProyectoEditar(proyecto);
    setNuevoNombre(proyecto.nombre);
    setNuevaDescripcion(proyecto.descripcion || '');
    setModalEditar(true);
  };

  const handleGuardarCambios = async () => {
    if (!nuevoNombre.trim()) {
      alert('El nombre del proyecto es obligatorio.');
      return;
    }

    try {
      await axiosInstance.put(`/proyectos/${proyectoEditar.idProyecto}`, {
        nombre: nuevoNombre,
        descripcion: nuevaDescripcion
      });
      setModalEditar(false);
      setProyectoEditar(null);
      setNuevoNombre('');
      setNuevaDescripcion('');
      cargarDatos();
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      alert('Hubo un error al actualizar el proyecto.');
    }
  };

  const handleEliminarProyecto = async (proyecto) => {
    if (!window.confirm('¿Estás seguro que quieres eliminar este proyecto?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/proyectos/${proyecto.idProyecto}`);
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      alert('Hubo un error al eliminar el proyecto.');
    }
  };

  const aceptarInvitacion = async (idInvitacion) => {
    try {
      await axiosInstance.put(`/invitaciones/${idInvitacion}`, { estado: 'aceptada' });
      cargarDatos();
      cargarInvitaciones();
    } catch (error) {
      console.error('Error al aceptar invitación:', error);
    }
  };

  const rechazarInvitacion = async (idInvitacion) => {
    try {
      await axiosInstance.put(`/invitaciones/${idInvitacion}`, { estado: 'rechazada' });
      cargarDatos();
      cargarInvitaciones();
    } catch (error) {
      console.error('Error al rechazar invitación:', error);
    }
  };

  const abrirModalInvitaciones = async () => {
    await cargarInvitaciones();
    setModalInvitaciones(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded shadow mb-6">
        <div className="text-center sm:text-left">
          {perfil && (
            <>
              <p className="text-xl font-semibold">{perfil.correo}</p>
              <p className="text-sm text-gray-500">UUID: {perfil.idUsuario}</p>
            </>
          )}
        </div>
        <button
          onClick={logout}
          className="mt-4 sm:mt-0 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Mis Proyectos */}
      <section className="bg-white p-4 rounded shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Mis Proyectos</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setModalCrear(true)}
              className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-600 transition"
            >
              +
            </button>
            <button
              onClick={() => setMostrarMisProyectos(!mostrarMisProyectos)}
              className="text-xl"
            >
              {mostrarMisProyectos ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {mostrarMisProyectos && (
          <div className="space-y-4">
            {misProyectos.length === 0 ? (
              <p className="text-gray-500">No tienes proyectos creados.</p>
            ) : (
              misProyectos.map((proyecto) => (
                <ProyectoCard
                  key={proyecto.idProyecto}
                  proyecto={proyecto}
                  onClick={() => irAlProyecto(proyecto.idProyecto)}
                  mostrarAcciones={true}
                  onEditar={() => abrirModalEditar(proyecto)}
                  onEliminar={() => handleEliminarProyecto(proyecto)}
                />
              ))
            )}
          </div>
        )}
      </section>

      {/* Proyectos Compartidos */}
      <section className="bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Proyectos que te compartieron</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={abrirModalInvitaciones}
              className="bg-gray-300 text-black rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-400 transition"
            >
              ...
            </button>
            <button
              onClick={() => setMostrarCompartidos(!mostrarCompartidos)}
              className="text-xl"
            >
              {mostrarCompartidos ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {mostrarCompartidos && (
          <div className="space-y-4">
            {proyectosCompartidos.length === 0 ? (
              <p className="text-gray-500">No tienes proyectos compartidos.</p>
            ) : (
              proyectosCompartidos.map((proyecto) => (
                <ProyectoCard
                  key={proyecto.idProyecto}
                  proyecto={proyecto}
                  onClick={() => irAlProyecto(proyecto.idProyecto)}
                  mostrarAcciones={false}
                />
              ))
            )}
          </div>
        )}
      </section>

      {/* Modal Crear Proyecto */}
      {modalCrear && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-2xl font-bold mb-4 text-center">Nuevo Proyecto</h2>
            <input
              type="text"
              placeholder="Nombre del proyecto"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />
            <textarea
              placeholder="Descripción del proyecto"
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />
            <div className="flex justify-between">
              <button
                onClick={() => setModalCrear(false)}
                className="bg-gray-300 text-black py-2 px-4 rounded hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearProyecto}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Invitaciones Pendientes */}
      {modalInvitaciones && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md w-[28rem] max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">Invitaciones Pendientes</h2>

            {invitacionesPendientes.length === 0 ? (
              <p className="text-gray-500 text-center">No tienes invitaciones pendientes.</p>
            ) : (
              invitacionesPendientes.map((inv) => (
                <div key={inv.idInvitacion} className="mb-4 p-3 border rounded shadow-sm">
                  <p className="font-semibold">{inv.nombreProyecto}</p>
                  <p className="text-sm text-gray-500">{inv.descripcionProyecto}</p>
                  <p className="text-xs text-gray-400 mb-2">Dueño: {inv.correoDueno}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => aceptarInvitacion(inv.idInvitacion)}
                      className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600 transition"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => rechazarInvitacion(inv.idInvitacion)}
                      className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 transition"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setModalInvitaciones(false)}
                className="bg-gray-300 text-black py-2 px-6 rounded hover:bg-gray-400 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
