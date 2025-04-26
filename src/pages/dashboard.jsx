import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPerfil } from '../services/usuarioService';
import { listarMisProyectos, listarProyectosCompartidos, crearProyecto, actualizarProyecto, eliminarProyecto } from '../services/proyectoService';
import { listarInvitacionesPendientes, actualizarInvitacion } from '../services/invitacionService';
import { useNavigate } from 'react-router-dom';
import ProyectoCard from '../components/ProyectoCard';
import { obtenerProyecto } from '../services/proyectoService';
import { obtenerUsuario } from '../services/usuarioService';

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
      const perfilResponse = await getPerfil();
      setPerfil(perfilResponse.data);

      const proyectosPropiosResponse = await listarMisProyectos();
      setMisProyectos(proyectosPropiosResponse.data);

      const proyectosInvitadosResponse = await listarProyectosCompartidos();
      setProyectosCompartidos(proyectosInvitadosResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      logout();
    }
  };

  const cargarInvitaciones = async () => {
    try {
      const invitacionesResponse = await listarInvitacionesPendientes();
      const invitaciones = invitacionesResponse.data;
  
      const invitacionesEnriquecidas = await Promise.all(
        invitaciones.map(async (inv) => {
          try {
            const proyectoResponse = await obtenerProyecto(inv.idProyecto);
            const proyecto = proyectoResponse.data;
  
            const usuarioResponse = await obtenerUsuario(proyecto.idUsuario);
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
            return null; // Si falla, descartamos esa invitación
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
      await crearProyecto({
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
      await actualizarProyecto(proyectoEditar.idProyecto, {
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
      await eliminarProyecto(proyecto.idProyecto);
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      alert('Hubo un error al eliminar el proyecto.');
    }
  };

  const aceptarInvitacion = async (idInvitacion) => {
    try {
        console.log('Intentando aceptar invitacion:', idInvitacion);
      await actualizarInvitacion(idInvitacion, { estado: 'aceptada' });
      cargarDatos();
      cargarInvitaciones();
    } catch (error) {
      console.error('Error al aceptar invitación:', error);
    }
  };

  const rechazarInvitacion = async (idInvitacion) => {
    try {
      await actualizarInvitacion(idInvitacion, { estado: 'rechazada' });
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

      {/* Modal de Invitaciones */}
      {invitacionesPendientes.map((inv) => (
  <div key={inv.idInvitacion} className="flex justify-between items-center">
    <div>
      <p className="font-semibold text-sm">{inv.nombreProyecto}</p>
      <p className="text-xs text-gray-500">{inv.descripcionProyecto}</p>
      <p className="text-xs text-gray-400">Dueño: {inv.correoDueno}</p>
    </div>
    <div className="flex space-x-2">
      <button
        onClick={() => aceptarInvitacion(inv.idInvitacion)}
        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition"
      >
        Aceptar
      </button>
      <button
        onClick={() => rechazarInvitacion(inv.idInvitacion)}
        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
      >
        Rechazar
      </button>
    </div>
  </div>
))}

    </div>
  );
}

export default Dashboard;
