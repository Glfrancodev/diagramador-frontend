import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";
import ProyectoCard from "../components/ProyectoCard";

import {
  ArrowRightOnRectangleIcon as LogoutIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/solid";

function Dashboard() {
  const { logout: authLogout } = useAuth();
  const navigate   = useNavigate();

  const [perfil, setPerfil]                         = useState(null);
  const [misProyectos, setMisProyectos]             = useState([]);
  const [proyectosCompartidos, setProyectosCompartidos] = useState([]);

  const [showMis, setShowMis]                       = useState(true);
  const [showCompartidos, setShowCompartidos]       = useState(true);

  const [modalCrear, setModalCrear]                 = useState(false);
  const [modalEditar, setModalEditar]               = useState(false);
  const [modalInvitaciones, setModalInvitaciones]   = useState(false);

  const [nuevoNombre, setNuevoNombre]               = useState("");
  const [nuevaDescripcion, setNuevaDescripcion]     = useState("");
  const [proyectoEditar, setProyectoEditar]         = useState(null);

  const [invPendientes, setInvPendientes]           = useState([]);

  /* ---------- carga inicial ---------- */
  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const { data: perfilSrv }      = await axiosInstance.get("/usuarios/perfil");
      const { data: propios }        = await axiosInstance.get("/proyectos/mis-proyectos");
      const { data: compartidos }    = await axiosInstance.get("/proyectos/invitados");

      /* ----- guarda el nombre/correo en localStorage ----- */
      localStorage.setItem("nombre", perfilSrv.nombre || perfilSrv.nombre || "");

      setPerfil(perfilSrv);
      setMisProyectos(propios);
      setProyectosCompartidos(compartidos);
    } catch (err) {
      console.error(err);
      handleLogout();
    }
  };

  /* ---------- logout que limpia localStorage ---------- */
  const handleLogout = () => {
    localStorage.removeItem("correo");
    authLogout();
  };

  /* ---------- navegación ---------- */
  const irAlProyecto = (id) => {
    localStorage.setItem("idProyecto", id);
    navigate(`/proyecto/${id}`);
  };

  /* ---------- CRUD proyecto ---------- */
  const crearProyecto = async () => {
    if (!nuevoNombre.trim()) return alert("El nombre es obligatorio");
    try {
      await axiosInstance.post("/proyectos", { nombre: nuevoNombre, descripcion: nuevaDescripcion });
      setModalCrear(false);
      setNuevoNombre("");
      setNuevaDescripcion("");
      cargarDatos();
    } catch (err) {
      console.error(err);
      alert("Error al crear proyecto");
    }
  };

  const abrirEditar = (p) => {
    setProyectoEditar(p);
    setNuevoNombre(p.nombre);
    setNuevaDescripcion(p.descripcion || "");
    setModalEditar(true);
  };

  const guardarCambios = async () => {
    if (!nuevoNombre.trim()) return alert("El nombre es obligatorio");
    try {
      await axiosInstance.put(`/proyectos/${proyectoEditar.idProyecto}`, {
        nombre: nuevoNombre,
        descripcion: nuevaDescripcion,
      });
      setModalEditar(false);
      setProyectoEditar(null);
      cargarDatos();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar proyecto");
    }
  };

  const eliminarProyecto = async (p) => {
    if (!window.confirm("¿Eliminar proyecto definitivamente?")) return;
    try {
      await axiosInstance.delete(`/proyectos/${p.idProyecto}`);
      cargarDatos();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar");
    }
  };

  /* ---------- invitaciones ---------- */
  const cargarInvitaciones = async () => {
    const { data } = await axiosInstance.get("/invitaciones/pendientes");
    setInvPendientes(data);
  };

  const aceptarInv = (id) => actualizarInv(id, "aceptada");
  const rechazarInv = (id) => actualizarInv(id, "rechazada");

  const actualizarInv = async (id, estado) => {
    try {
      await axiosInstance.put(`/invitaciones/${id}`, { estado });
      cargarDatos();
      cargarInvitaciones();
    } catch (err) { console.error(err); }
  };

  /* ---------- helpers UI ---------- */
  const Section = ({ title, show, toggle, children, extraBtn }) => (
    <section className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow mb-6">
      <header className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        <div className="flex items-center gap-2">
          {extraBtn}
          <button
            onClick={toggle}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          >
            {show ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
        </div>
      </header>
      {show && children}
    </section>
  );

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors px-4 pb-16">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6">
        <div className="text-center sm:text-left">
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{perfil?.correo}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
            UUID: {perfil?.idUsuario}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg shadow transition-colors"
        >
          <LogoutIcon className="w-5 h-5" /> Salir
        </button>
      </header>

      {/* Mis Proyectos */}
      <Section
        title="Mis proyectos"
        show={showMis}
        toggle={() => setShowMis(!showMis)}
        extraBtn={
          <button
            onClick={() => setModalCrear(true)}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow
                       transition-colors"
            title="Nuevo proyecto"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        }
      >
        {misProyectos.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No has creado proyectos todavía.</p>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {misProyectos.map((p) => (
              <ProyectoCard
                key={p.idProyecto}
                proyecto={p}
                onClick={() => irAlProyecto(p.idProyecto)}
                mostrarAcciones
                onEditar={() => abrirEditar(p)}
                onEliminar={() => eliminarProyecto(p)}
              />
            ))}
          </div>
        )}
      </Section>

      {/* Proyectos compartidos */}
      <Section
        title="Proyectos compartidos contigo"
        show={showCompartidos}
        toggle={() => setShowCompartidos(!showCompartidos)}
        extraBtn={
          <button
            onClick={() => {
              cargarInvitaciones();
              setModalInvitaciones(true);
            }}
            className="p-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600
                       text-gray-800 dark:text-gray-100 rounded-full"
            title="Invitaciones pendientes"
          >
            <EllipsisHorizontalIcon className="w-5 h-5" />
          </button>
        }
      >
        {proyectosCompartidos.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No tienes proyectos compartidos.</p>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {proyectosCompartidos.map((p) => (
              <ProyectoCard
                key={p.idProyecto}
                proyecto={p}
                onClick={() => irAlProyecto(p.idProyecto)}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ==================== MODALES ==================== */}
      {/* crear */}
      {modalCrear && (
        <Modal onClose={() => setModalCrear(false)} title="Nuevo proyecto">
          <input
            className="w-full mb-4 p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            placeholder="Nombre"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
          />
          <textarea
            className="w-full mb-4 p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            placeholder="Descripción"
            value={nuevaDescripcion}
            onChange={(e) => setNuevaDescripcion(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button outline onClick={() => setModalCrear(false)}>
              Cancelar
            </Button>
            <Button onClick={crearProyecto}>Crear</Button>
          </div>
        </Modal>
      )}

      {/* editar */}
      {modalEditar && (
        <Modal onClose={() => setModalEditar(false)} title="Editar proyecto">
          <input
            className="w-full mb-4 p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            placeholder="Nombre"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
          />
          <textarea
            className="w-full mb-4 p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            placeholder="Descripción"
            value={nuevaDescripcion}
            onChange={(e) => setNuevaDescripcion(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button outline onClick={() => setModalEditar(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarCambios}>Guardar</Button>
          </div>
        </Modal>
      )}

      {/* invitaciones */}
      {modalInvitaciones && (
        <Modal onClose={() => setModalInvitaciones(false)} title="Invitaciones pendientes">
          {invPendientes.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No tienes invitaciones pendientes.
            </p>
          ) : (
            <div className="space-y-4">
              {invPendientes.map((inv) => (
                <div
                  key={inv.idInvitacion}
                  className="border rounded-lg p-4 flex flex-col gap-2 dark:border-gray-700"
                >
                  <header className="font-semibold">{inv.nombreProyecto}</header>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {inv.descripcionProyecto}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Propietario: {inv.correoDueno}
                  </p>
                  <div className="flex gap-2">
                    <Button className="bg-green-500 hover:bg-green-600" onClick={() => aceptarInv(inv.idInvitacion)}>
                      Aceptar
                    </Button>
                    <Button className="bg-red-500 hover:bg-red-600" onClick={() => rechazarInv(inv.idInvitacion)}>
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ---------- componentes utilitarios ---------- */
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur">
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
      <header className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800">
          ✕
        </button>
      </header>
      {children}
    </div>
  </div>
);

const Button = ({ outline, className = "", ...props }) => {
  const base =
    "py-2 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const filled =
    "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-400";
  const outlined =
    "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-400";

  return (
    <button
      className={`${base} ${outline ? outlined : filled} ${className}`}
      {...props}
    />
  );
};

export default Dashboard;
