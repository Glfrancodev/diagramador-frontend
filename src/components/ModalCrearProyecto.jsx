function ModalCrearProyecto({ visible, onClose, onCrear }) {
    if (!visible) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Crear Nuevo Proyecto</h2>
  
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Nombre</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Escribe el nombre del proyecto"
            />
          </div>
  
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1">Descripción</label>
            <textarea
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe tu proyecto..."
            ></textarea>
          </div>
  
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded"
            >
              Cancelar
            </button>
            <button
              onClick={onCrear}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Crear
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  export default ModalCrearProyecto;
  