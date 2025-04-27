import { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import axiosInstance from "../services/axiosInstance"; // 👈 si usas axios configurado

function Workspace() {
  const editorRef = useRef(null);
  const [tabs, setTabs] = useState([{ id: "tab-1", name: "Inicio", html: "", css: "" }]);
  const [activeTab, setActiveTab] = useState("tab-1");

  useEffect(() => {
    if (editorRef.current) return;

    const editor = grapesjs.init({
      container: "#editor",
      fromElement: false,
      width: "100%",
      height: "calc(100vh - 51px)",
      storageManager: false,
    });

    editorRef.current = editor;

    editor.addComponents(`
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
        }
        .gjs-cv-canvas {
          padding: 0 !important;
          margin: 0 !important;
        }
        .gjs-row {
          margin: 0 !important;
        }
        .gjs-container {
          margin: 0 !important;
          padding: 0 !important;
        }
      </style>
    `);
    

    cargarProyectoGuardado(); // 👈 Importante, llamamos a cargar al iniciar

    editor.DomComponents.addType('row', { model: { defaults: { tagName: 'div', droppable: true, draggable: true, classes: ['gjs-row'], components: [], style: { display: 'flex', margin: '10px 0' } } } });
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

    editor.BlockManager.add('layout-sidebar', {
      label: 'Sidebar Layout',
      category: 'Layout',
      content: `
        <style>
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
          }
        </style>
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

  // === Cargar Proyecto Guardado ===
  const cargarProyectoGuardado = async () => {
    const idProyecto = localStorage.getItem("idProyecto");
    if (!idProyecto) return;
  
    try {
      const response = await axiosInstance.get(`/proyectos/${idProyecto}`);
      const contenido = response.data.contenido;
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
        } else {
          setTabs([{ id: "tab-1", name: "Inicio", html: "", css: "" }]);
          setActiveTab("tab-1");
        }
      }
    } catch (error) {
      console.error("Error cargando proyecto:", error);
    }
  };
  

  // === Guardar Automáticamente ===
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
        contenido: JSON.stringify({
          pestañas: tabs,
          html: editorRef.current.getHtml(),
          css: editorRef.current.getCss(),
        }),
      };

      await fetch(`http://localhost:3000/api/proyectos/${idProyecto}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(proyectoActualizado),
      });

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

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", padding: "10px", background: "#f3f4f6" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => handleTabChange(tab.id)} style={{ padding: "8px 12px", backgroundColor: activeTab === tab.id ? "#2563eb" : "#e5e7eb", color: activeTab === tab.id ? "white" : "black", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            {tab.name}
          </button>
        ))}
        <button onClick={handleNewTab} style={{ padding: "8px 12px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          + Nueva
        </button>
      </div>
      <div id="editor" style={{ height: "calc(100vh - 50px)" }}></div>
    </div>
  );
}

export default Workspace;
