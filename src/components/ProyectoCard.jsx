// src/components/ProyectoCard.jsx

function ProyectoCard({ proyecto, onClick, mostrarAcciones = false, onEditar, onEliminar }) {
    return (
      <div
        className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 transition cursor-pointer"
        onClick={onClick}
      >
        <div className="flex flex-col">
          <p className="font-semibold">{proyecto.nombre}</p>
          {/* AÑADIMOS LA DESCRIPCIÓN */}
          {proyecto.descripcion && (
            <p className="text-sm text-gray-500">{proyecto.descripcion}</p>
          )}
          <p className="text-xs text-gray-400">{new Date(proyecto.fechaCreacion).toLocaleDateString()}</p>
        </div>
  
        {mostrarAcciones && (
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditar && onEditar(proyecto);
              }}
              className="text-yellow-500 hover:text-yellow-600 transition"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEliminar && onEliminar(proyecto);
              }}
              className="text-red-500 hover:text-red-600 transition"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    );
  }
  
  export default ProyectoCard;
  