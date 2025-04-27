import { useEffect, useRef } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";

function Workspace() {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) return;

    const editor = grapesjs.init({
      container: "#editor",
      fromElement: false,
      width: "100%",
      height: "100vh",
      storageManager: false,
    });

    // === TIPOS PERSONALIZADOS SOLO PARA LAYOUT (COLUMNAS) ===

    editor.DomComponents.addType('row', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: true,
          draggable: true,
          classes: ['gjs-row'],
          components: [],
          style: { display: 'flex', margin: '10px 0' },
        },
      },
    });

    editor.DomComponents.addType('column', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: true,
          draggable: true,
          classes: ['gjs-column'],
          style: { flex: '1', padding: '10px', minHeight: '100px', border: '1px dashed #ccc' },
        },
      },
    });

    editor.DomComponents.addType('column-3-7-left', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: true,
          draggable: true,
          classes: ['gjs-column'],
          style: { flex: '3', padding: '10px', minHeight: '100px', border: '1px dashed #ccc' },
        },
      },
    });

    editor.DomComponents.addType('column-3-7-right', {
      model: {
        defaults: {
          tagName: 'div',
          droppable: true,
          draggable: true,
          classes: ['gjs-column'],
          style: { flex: '7', padding: '10px', minHeight: '100px', border: '1px dashed #ccc' },
        },
      },
    });

    // === BLOQUES DE COLUMNAS ===

    editor.BlockManager.add('one-column', {
      label: '1 Column',
      category: 'Layout',
      content: { type: 'row', components: [{ type: 'column' }] },
    });

    editor.BlockManager.add('two-columns', {
      label: '2 Columns',
      category: 'Layout',
      content: { type: 'row', components: [{ type: 'column' }, { type: 'column' }] },
    });

    editor.BlockManager.add('three-columns', {
      label: '3 Columns',
      category: 'Layout',
      content: { type: 'row', components: [{ type: 'column' }, { type: 'column' }, { type: 'column' }] },
    });

    editor.BlockManager.add('two-columns-3-7', {
      label: '2 Columns 3/7',
      category: 'Layout',
      content: { type: 'row', components: [{ type: 'column-3-7-left' }, { type: 'column-3-7-right' }] },
    });

    // === BLOQUES BÁSICOS DE GRAPESJS ===

    editor.BlockManager.add('text', {
      label: 'Text',
      category: 'Basic',
      content: '<p>Insert your text here</p>',
    });

    editor.BlockManager.add('link', {
      label: 'Link',
      category: 'Basic',
      content: '<a href="#">Insert link</a>',
    });

    editor.BlockManager.add('image', {
      label: 'Image',
      category: 'Basic',
      content: { type: 'image' },
    });

    editor.BlockManager.add('video', {
      label: 'Video',
      category: 'Basic',
      content: { type: 'video' },
    });

    editor.BlockManager.add('map', {
      label: 'Map',
      category: 'Basic',
      content: { type: 'map' },
    });

    editor.BlockManager.add('link-block', {
      label: 'Link Block',
      category: 'Basic',
      content: { type: 'link', editable: true, droppable: true },
    });

    editor.BlockManager.add('quote', {
      label: 'Quote',
      category: 'Basic',
      content: '<blockquote>Insert quote here</blockquote>',
    });

    editor.BlockManager.add('text-section', {
      label: 'Text Section',
      category: 'Basic',
      content: '<section><h1>Title</h1><p>Insert your text here</p></section>',
    });

    // === BLOQUE DE SIDEBAR (NAVEGACIÓN) ===

    editor.BlockManager.add('layout-sidebar', {
      label: 'Sidebar Layout',
      category: 'Layout',
      content: `
        <div style="display: flex; min-height: 100vh;">
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
    
    

    // Mostrar bordes activos
    editor.Panels.getButton('options', 'sw-visibility')?.set('active', 1);

    editorRef.current = editor;
  }, []);

  return (
    <div id="editor" style={{ height: "100vh" }}></div>
  );
}

export default Workspace;
