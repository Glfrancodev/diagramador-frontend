import { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import axiosInstance from "../services/axiosInstance";
import { useNavigate } from 'react-router-dom';

function Workspace() {
  const editorRef = useRef(null);
  const [tabs, setTabs] = useState([{ id: "tab-1", name: "Inicio", html: "", css: "" }]);
  const [activeTab, setActiveTab] = useState("tab-1");
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabName, setEditingTabName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (editorRef.current) return;

    const editor = grapesjs.init({
      container: "#editor",
      fromElement: false,
      width: "100%",
      height: "calc(100vh - 102px)",
      storageManager: false,
    });

    editorRef.current = editor;

    editor.addComponents(`
      <style>
        html, body { margin: 0; padding: 0; height: 100%; width: 100%; }
        .gjs-cv-canvas { padding: 0 !important; margin: 0 !important; }
        .gjs-row { margin: 0 !important; }
        .gjs-container { margin: 0 !important; padding: 0 !important; }
      </style>
    `);

    cargarProyectoGuardado();

    editor.DomComponents.addType('row', { model: { defaults: { tagName: 'div', droppable: true, draggable: true, classes: ['gjs-row'], style: { display: 'flex', margin: '10px 0' } } } });
    editor.DomComponents.addType('column', { model: { defaults: { tagName: 'div', droppable: true, draggable: true, classes: ['gjs-column'], style: { flex: '1', padding: '10px', minHeight: '100px', border: '1px dashed #ccc' } } } });
    editor.DomComponents.addType('column-3-7-left', { model: { defaults: { tagName: 'div', droppable: true, draggable: true, classes: ['gjs-column'], style: { flex: '3', padding: '10px', minHeight: '100px', border: '1px dashed #ccc' } } } });
    editor.DomComponents.addType('column-3-7-right', { model: { defaults: { tagName: 'div', droppable: true, draggable: true, classes: ['gjs-column'], style: { flex: '7', padding: '10px', minHeight: '100px', border: '1px dashed #ccc' } } } });

    editor.BlockManager.add('one-column', { label: '1 Column', category: 'Layout', content: { type: 'row', components: [{ type: 'column' }] } });
    editor.BlockManager.add('two-columns', { label: '2 Columns', category: 'Layout', content: { type: 'row', components: [{ type: 'column' }, { type: 'column' }] } });
    editor.BlockManager.add('three-columns', { label: '3 Columns', category: 'Layout', content: { type: 'row', components: [{ type: 'column' }, { type: 'column' }, { type: 'column' }] } });
    editor.BlockManager.add('two-columns-3-7', { label: '2 Columns 3/7', category: 'Layout', content: { type: 'row', components: [{ type: 'column-3-7-left' }, { type: 'column-3-7-right' }] } });

    editor.BlockManager.add('text', { label: 'Text', category: 'Basic', content: '<p>Insert your text here</p>' });
    editor.BlockManager.add('link', { label: 'Link', category: 'Basic', content: '<a href="#">Insert link</a>' });
    editor.BlockManager.add('image', { label: 'Image', category: 'Basic', content: { type: 'image' } });
    editor.BlockManager.add('video', { label: 'Video', category: 'Basic', content: { type: 'video' } });
    editor.BlockManager.add('map', { label: 'Map', category: 'Basic', content: { type: 'map' } });
    editor.BlockManager.add('link-block', { label: 'Link Block', category: 'Basic', content: { type: 'link', editable: true, droppable: true } });
    editor.BlockManager.add('quote', { label: 'Quote', category: 'Basic', content: '<blockquote>Insert quote here</blockquote>' });
    editor.BlockManager.add('text-section', { label: 'Text Section', category: 'Basic', content: '<section><h1>Title</h1><p>Insert your text here</p></section>' });

    // ⬇️ Aquí agregamos el Sidebar Layout
    editor.BlockManager.add('layout-sidebar', {
      label: 'Sidebar Layout',
      category: 'Layout',
      content: `
        <div style="display: flex; min-height: 100vh; width: 100%;">
          <aside style="flex: 3; background-color: #1f2937; color: white; display: flex; flex-direction: column; padding: 1rem; box-sizing: border-box;">
            <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Menú</h2>
            <nav style="display: flex; flex-direction: column; gap: 0.5rem;">
              <a href="#" style="color: white; text-decoration: none;">Dashboard</a>
              <a href="#" style="color: white; text-decoration: none;">Usuarios</a>
              <a href="#" style="color: white; text-decoration: none;">Roles</a>
              <a href="#" style="color: white; text-decoration: none;">Permisos</a>
            </nav>
          </aside>
          <main style="flex: 7; padding: 1rem; box-sizing: border-box; min-height: 100vh;">
            <p>Arrastra aquí tu contenido...</p>
          </main>
        </div>
      `
    });

    editor.Panels.getButton('options', 'sw-visibility')?.set('active', 1);
  }, []);

  const cargarProyectoGuardado = async () => {
    const idProyecto = localStorage.getItem("idProyecto");
    if (!idProyecto) return;

    try {
      const response = await axiosInstance.get(`/proyectos/${idProyecto}`);
      const contenido = response.data.contenido;
      setNombreProyecto(response.data.nombre);

      if (contenido) {
        const parsed = JSON.parse(contenido);
        if (parsed.pestañas && parsed.pestañas.length > 0) {
          setTabs(parsed.pestañas);
          setActiveTab(parsed.pestañas[0].id);

          if (editorRef.current) {
            const primeraTab = parsed.pestañas[0];
            editorRef.current.setComponents(primeraTab.html || "");
            editorRef.current.setStyle(primeraTab.css || "");
          }
        }
      }
    } catch (error) {
      console.error("Error cargando proyecto:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!editorRef.current) return;

      const editor = editorRef.current;
      const currentTab = tabs.find(tab => tab.id === activeTab);

      if (currentTab) {
        currentTab.html = editor.getHtml();
        currentTab.css = editor.getCss();
      }

      guardarProyecto();
    }, 10000);

    return () => clearInterval(interval);
  }, [tabs, activeTab]);

  const guardarProyecto = async () => {
    try {
      const token = localStorage.getItem('token');
      const idProyecto = localStorage.getItem('idProyecto');

      if (!token || !idProyecto) {
        console.error("Falta el token o el id del proyecto en localStorage");
        return;
      }

      const proyectoActualizado = {
        contenido: JSON.stringify({ pestañas: tabs }),
      };

      await axiosInstance.put(`/proyectos/${idProyecto}`, proyectoActualizado);
      console.log("✅ Proyecto guardado automáticamente (PUT exitoso)");
    } catch (error) {
      console.error("❌ Error al guardar el proyecto:", error);
    }
  };

  const handleTabChange = (id) => {
    const editor = editorRef.current;
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (currentTab) {
      currentTab.html = editor.getHtml();
      currentTab.css = editor.getCss();
    }
    const nextTab = tabs.find(tab => tab.id === id);
    if (nextTab) {
      editor.setComponents(nextTab.html || "");
      editor.setStyle(nextTab.css || "");
      setActiveTab(id);
    }
  };

  const handleNewTab = () => {
    const newId = `tab-${tabs.length + 1}`;
    const newTab = { id: newId, name: `Nueva Pestaña ${tabs.length}`, html: "", css: "" };
    setTabs([...tabs, newTab]);
    setTimeout(() => handleTabChange(newId), 100);
  };

  const handleStartEditing = (id, currentName) => {
    setEditingTabId(id);
    setEditingTabName(currentName);
  };

  const handleFinishEditing = () => {
    if (editingTabId) {
      setTabs(prevTabs =>
        prevTabs.map(tab =>
          tab.id === editingTabId ? { ...tab, name: editingTabName } : tab
        )
      );
      setEditingTabId(null);
      setEditingTabName("");
    }
  };

  const handleDeleteTab = (id) => {
    if (tabs.length === 1) {
      alert("No puedes eliminar la única pestaña.");
      return;
    }

    const updatedTabs = tabs.filter(tab => tab.id !== id);
    setTabs(updatedTabs);

    if (activeTab === id && updatedTabs.length > 0) {
      handleTabChange(updatedTabs[0].id);
    }
  };

  const exportarProyecto = async () => {
    const idProyecto = localStorage.getItem('idProyecto');
    if (!idProyecto) return;

    try {
      const response = await axiosInstance.get(`/proyectos/exportar/${idProyecto}`, {
        responseType: 'blob',
        timeout: 300000 // 5 minutos
      });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${nombreProyecto}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exportando proyecto:', error);
    }
  };

  const volverInicio = () => {
    navigate('/dashboard');
  };

  return (
    <div>
      {/* Barra superior */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#1f2937', color: 'white', padding: '10px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={volverInicio} style={{ background: '#2563eb', color: 'white', padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
            ← Volver
          </button>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{nombreProyecto || 'Proyecto'}</h2>
        </div>
        <button onClick={exportarProyecto} style={{ background: '#10b981', color: 'white', padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
          Exportar
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", padding: "10px", background: "#f3f4f6" }}>
        {tabs.map(tab => (
          <div key={tab.id} style={{ display: "flex", alignItems: "center" }}>
            {editingTabId === tab.id ? (
              <input
                type="text"
                value={editingTabName}
                onChange={(e) => setEditingTabName(e.target.value)}
                onBlur={handleFinishEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFinishEditing();
                  }
                }}
                autoFocus
                style={{ padding: "8px 12px", backgroundColor: "#e5e7eb", border: "none", borderRadius: "6px", fontSize: "14px", minWidth: "100px" }}
              />
            ) : (
              <button
                onClick={() => handleTabChange(tab.id)}
                onDoubleClick={() => handleStartEditing(tab.id, tab.name)}
                style={{ padding: "8px 12px", backgroundColor: activeTab === tab.id ? "#2563eb" : "#e5e7eb", color: activeTab === tab.id ? "white" : "black", border: "none", borderRadius: "6px", cursor: "pointer", minWidth: "100px" }}
              >
                {tab.name}
              </button>
            )}
            <button
              onClick={() => handleDeleteTab(tab.id)}
              style={{ background: "transparent", border: "none", color: "red", fontWeight: "bold", marginLeft: "4px", cursor: "pointer", fontSize: "16px" }}
            >
              ❌
            </button>
          </div>
        ))}
        <button onClick={handleNewTab} style={{ padding: "8px 12px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          + Nueva
        </button>
      </div>

      {/* Editor */}
      <div id="editor" style={{ height: "calc(100vh - 102px)" }}></div>
    </div>
  );
}

export default Workspace;
