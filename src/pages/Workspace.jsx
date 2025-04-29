import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import axiosInstance from "../services/axiosInstance";
import { useNavigate } from "react-router-dom";

/* ---------- throttle ---------- */
const throttle = (fn, delay = 250) => {
  let last = 0, timer;
  return (...a) => {
    const now = Date.now();
    if (now - last >= delay) {
      last = now; fn(...a);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => { last = Date.now(); fn(...a); }, delay - (now - last));
    }
  };
};

function Workspace() {
  /* ---------- refs ---------- */
  const editorRef      = useRef(null);
  const socketRef      = useRef(null);
  const remoteApplyRef = useRef(false);
  const tabsRef        = useRef([]);
  const activeTabRef   = useRef("");
  const mySocketIdRef  = useRef("");

  /* ---------- state ---------- */
  const [tabs, setTabs] = useState([{ id:"tab-1", name:"Inicio", html:"", css:"" }]);
  const [activeTab, setActiveTab] = useState("tab-1");
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [editingTabId, setEditingTabId]     = useState(null);
  const [editingTabName, setEditingTabName] = useState("");
  const [isSaving, setIsSaving]             = useState(false);

  /* ---------- constantes ---------- */
  const navigate  = useNavigate();
  const projectId = localStorage.getItem("idProyecto");

  /* ---------- refs <-> state ---------- */
  useEffect(() => { tabsRef.current      = tabs;      }, [tabs]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  /* ---------- helper: update & broadcast ---------- */
  const emitTabsSnapshot = (list) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("tabsSnapshot", {
      socketId : mySocketIdRef.current,
      projectId,
      tabs     : list.map(({id,name}) => ({id,name}))
    });
  };

  const updateTabsAndEmit = (fn) => {
    setTabs(prev => {
      const next = fn(prev);
      tabsRef.current = next;
      emitTabsSnapshot(next);
      return next;
    });
  };

  /* ---------- snapshot de contenido ---------- */
  const emitContentSnapshot = throttle(() => {
    if (!socketRef.current?.connected || !editorRef.current) return;
    socketRef.current.emit("editorUpdate", {
      socketId : mySocketIdRef.current,
      projectId,
      tabId    : activeTabRef.current,
      html     : editorRef.current.getHtml(),
      css      : editorRef.current.getCss()
    });
  }, 250);

  /* ---------- socket ---------- */
  useEffect(() => {
    const sock = io("http://localhost:3000");
    socketRef.current = sock;

    sock.on("connect", () => {
      mySocketIdRef.current = sock.id;
      sock.emit("joinProject", { projectId });
    });

    /* contenido HTML/CSS */
    sock.on("editorUpdate", snap => {
      if (snap.projectId !== projectId || snap.socketId === mySocketIdRef.current) return;
      updateTabsAndEmit(prev =>
        prev.map(t => t.id === snap.tabId ? { ...t, html:snap.html, css:snap.css } : t)
      );
      if (snap.tabId === activeTabRef.current && editorRef.current) {
        remoteApplyRef.current = true;
        editorRef.current.setComponents(snap.html);
        editorRef.current.setStyle(snap.css);
      }
    });

    /* lista de pestañas */
    sock.on("tabsSnapshot", pkt => {
      if (pkt.projectId !== projectId || pkt.socketId === mySocketIdRef.current) return;
      setTabs(prev => {
        const cache  = Object.fromEntries(prev.map(t => [t.id, t]));
        const merged = pkt.tabs.map(({id,name}) =>
          cache[id] ? { ...cache[id], name } : { id,name,html:"",css:"" }
        );
        tabsRef.current = merged;

        /* si se eliminó mi pestaña activa => salto a la primera */
        if (!merged.find(t => t.id === activeTabRef.current)) {
          const first = merged[0];
          if (first) handleTabChange(first.id, merged);
        }
        return merged;
      });
    });

    return () => sock.disconnect();
  }, [projectId]);

  /* ---------- GrapesJS ---------- */
  useEffect(() => {
    const editor = grapesjs.init({
      container:"#editor",
      width:"100%",
      height:"calc(100vh - 102px)",
      storageManager:false
    });
    editorRef.current = editor;

    editor.on("update", () => {
      if (remoteApplyRef.current) { remoteApplyRef.current = false; return; }
      emitContentSnapshot();
    });

    /* --- NO autocorrección en contenteditable y sin text-transform --- */
    editor.CssComposer.getAll().add(`
      [contenteditable]{spellcheck:false;-webkit-text-size-adjust:none;}
      .gjs-cv-canvas *{text-transform:none!important;}
    `);

    /* estilos base */
    editor.addComponents(`<style>
      html,body{margin:0;padding:0;height:100%;width:100%}
      .gjs-cv-canvas{padding:0!important;margin:0!important}
      .gjs-row{margin:0!important}
      .gjs-container{margin:0!important;padding:0!important}
    </style>`);

    /* ---------- tipos ---------- */
    const colBase = {
      tagName:"div",
      droppable:true,
      draggable:true,
      classes:["gjs-column"],
      style:{flex:"1",padding:"10px",minHeight:"100px",border:"1px dashed #ccc"}
    };

    editor.DomComponents.addType("row",{model:{defaults:{
      tagName:"div",droppable:true,draggable:true,classes:["gjs-row"],
      style:{display:"flex",margin:"10px 0"}
    }}});
    editor.DomComponents.addType("column",{model:{defaults:colBase}});
    editor.DomComponents.addType("column-3-7-left",{model:{defaults:{
      ...colBase,style:{...colBase.style,flex:"3"}
    }}});
    editor.DomComponents.addType("column-3-7-right",{model:{defaults:{
      ...colBase,style:{...colBase.style,flex:"7"}
    }}});

    /* ---------- bloques (sin cambios) ---------- */
    const bm = editor.BlockManager;
    bm.add("one-column",{label:"1 Column",category:"Layout",
      content:{type:"row",components:[{type:"column"}]}});
    bm.add("two-columns",{label:"2 Columns",category:"Layout",
      content:{type:"row",components:[{type:"column"},{type:"column"}]}});
    bm.add("three-columns",{label:"3 Columns",category:"Layout",
      content:{type:"row",components:[{type:"column"},{type:"column"},{type:"column"}]}});
    bm.add("two-columns-3-7",{label:"2 Columns 3/7",category:"Layout",
      content:{type:"row",components:[{type:"column-3-7-left"},{type:"column-3-7-right"}]}});
    bm.add("text",{label:"Text",category:"Basic",content:"<p>Insert your text here</p>"});
    bm.add("link",{label:"Link",category:"Basic",content:'<a href="#">Insert link</a>'});
    bm.add("image",{label:"Image",category:"Basic",content:{type:"image"}});
    bm.add("video",{label:"Video",category:"Basic",content:{type:"video"}});
    bm.add("map",{label:"Map",category:"Basic",content:{type:"map"}});
    bm.add("link-block",{label:"Link Block",category:"Basic",
      content:{type:"link",editable:true,droppable:true}});
    bm.add("quote",{label:"Quote",category:"Basic",
      content:"<blockquote>Insert quote here</blockquote>"});
    bm.add("text-section",{label:"Text Section",category:"Basic",
      content:"<section><h1>Title</h1><p>Insert your text here</p></section>"});
    bm.add("layout-sidebar",{label:"Sidebar Layout",category:"Layout",
      content:`<div style="display:flex;min-height:100vh;width:100%">
        <aside style="flex:3;background:#1f2937;color:#fff;display:flex;flex-direction:column;padding:1rem">
          <h2 style="font-size:1.5rem;font-weight:bold;margin-bottom:1rem">Menú</h2>
          <nav style="display:flex;flex-direction:column;gap:.5rem">
            <a href="#">Dashboard</a><a href="#">Usuarios</a>
            <a href="#">Roles</a><a href="#">Permisos</a>
          </nav>
        </aside>
        <main style="flex:7;padding:1rem;box-sizing:border-box;min-height:100vh">
          <p>Arrastra aquí tu contenido...</p>
        </main></div>`});

    /* estado inicial */
    cargarProyectoGuardado();
    editor.Panels.getButton("options","sw-visibility")?.set("active",1);
  }, []);

  /* ---------- autoguardado ---------- */
  useEffect(() => {
    const id = setInterval(() => {
      if (!editorRef.current) return;
      const curr = tabsRef.current.find(t => t.id === activeTabRef.current);
      if (curr){
        curr.html = editorRef.current.getHtml();
        curr.css  = editorRef.current.getCss();
      }
      guardarProyecto();
    },10000);
    return () => clearInterval(id);
  },[]);

  /* ---------- API ---------- */
  const cargarProyectoGuardado = async () => {
    if (!projectId) return;
    try{
      const {data} = await axiosInstance.get(`/proyectos/${projectId}`);
      setNombreProyecto(data.nombre);
      if (!data.contenido) return;
      const parsed = JSON.parse(data.contenido);
      if (parsed.pestañas?.length){
        updateTabsAndEmit(()=>parsed.pestañas);
        setActiveTab(parsed.pestañas[0].id);
        editorRef.current.setComponents(parsed.pestañas[0].html||"");
        editorRef.current.setStyle     (parsed.pestañas[0].css ||"");
      }
    }catch(e){ console.error("load",e); }
  };

  const guardarProyecto = async () => {
    const token = localStorage.getItem("token");
    if (!token || !projectId) return;
    try{
      setIsSaving(true);
      await axiosInstance.put(`/proyectos/${projectId}`,{
        contenido: JSON.stringify({ pestañas: tabsRef.current })
      });
    }catch(e){
      console.error("save",e);
    }finally{
      setIsSaving(false);
    }
  };

  /* ---------- pestañas ---------- */
  const handleTabChange = (id,list=tabsRef.current) => {
    if (id === activeTabRef.current) return;
    const ed = editorRef.current;
    const prev = list.find(t=>t.id===activeTabRef.current);
    if (prev){ prev.html = ed.getHtml(); prev.css = ed.getCss(); }
    const next = list.find(t=>t.id===id);
    if (next){
      ed.setComponents(next.html||"");
      ed.setStyle     (next.css ||"");
      setActiveTab(id);
    }
  };

  const handleNewTab = () => {
    const idx  = tabsRef.current.length + 1;
    const tab  = { id:`tab-${idx}`, name:`Nueva Pestaña ${idx}`, html:"", css:"" };
    updateTabsAndEmit(prev => [...prev, tab]);
    setTimeout(() => handleTabChange(tab.id), 0);
  };

  const handleFinishEditing = () => {
    if (!editingTabId) return;
    updateTabsAndEmit(prev =>
      prev.map(t => t.id === editingTabId ? { ...t, name: editingTabName } : t)
    );
    setEditingTabId(null); setEditingTabName("");
  };

  const handleDeleteTab = id => {
    if (tabsRef.current.length === 1){
      alert("No puedes eliminar la única pestaña."); return;
    }
    updateTabsAndEmit(prev => prev.filter(t => t.id !== id));
    if (activeTabRef.current === id){
      setTimeout(() => handleTabChange(tabsRef.current[0].id), 0);
    }
  };

  /* ---------- exportar ---------- */
  const exportarProyecto = async () => {
    if (!projectId) return;
    try{
      const {data} = await axiosInstance.get(
        `/proyectos/exportar/${projectId}`,
        {responseType:"blob",timeout:300000});
      const url = URL.createObjectURL(new Blob([data],{type:"application/zip"}));
      const a = document.createElement("a");
      a.href = url; a.download = `${nombreProyecto}.zip`; a.click();
      URL.revokeObjectURL(url);
    }catch(e){ console.error("export",e); }
  };

  const volverInicio = () => navigate("/dashboard");

  /* ---------- UI ---------- */
  return (
    <div>
      {/* barra superior */}
      <div style={{
        display:"flex",alignItems:"center",background:"#1f2937",
        color:"#fff",padding:10,justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={volverInicio}
            style={{background:"#2563eb",color:"#fff",padding:"8px 12px",
              borderRadius:6,border:"none",cursor:"pointer"}}>← Volver</button>
          <h2 style={{margin:0,fontSize:"1.5rem"}}>{nombreProyecto || "Proyecto"}</h2>
        </div>

        <span style={{marginRight:16,color:isSaving?"#fbbf24":"#10b981"}}>
          {isSaving ? "Guardando…" : "Guardado"}
        </span>

        <button onClick={exportarProyecto}
          style={{background:"#10b981",color:"#fff",padding:"8px 12px",
            borderRadius:6,border:"none",cursor:"pointer"}}>Exportar</button>
      </div>

      {/* pestañas */}
      <div style={{display:"flex",gap:10,padding:10,background:"#f3f4f6"}}>
        {tabs.map(tab => (
          <div key={tab.id} style={{display:"flex",alignItems:"center"}}>
            {editingTabId === tab.id ? (
              <input value={editingTabName}
                onChange={e=>setEditingTabName(e.target.value)}
                onBlur={handleFinishEditing}
                onKeyDown={e=>e.key==="Enter" && handleFinishEditing()}
                spellCheck={false}
                autoCapitalize="off"
                autoFocus
                style={{padding:"8px 12px",background:"#e5e7eb",
                  border:"none",borderRadius:6,fontSize:14,minWidth:100}}/>
            ) : (
              <button
                onClick={()=>handleTabChange(tab.id)}
                onDoubleClick={()=>{setEditingTabId(tab.id);setEditingTabName(tab.name);}}
                style={{padding:"8px 12px",
                  background:activeTab===tab.id?"#2563eb":"#e5e7eb",
                  color:activeTab===tab.id?"#fff":"#000",
                  border:"none",borderRadius:6,cursor:"pointer",minWidth:100,textTransform:"none"}}>
                {tab.name}
              </button>
            )}
            <button onClick={()=>handleDeleteTab(tab.id)}
              style={{background:"transparent",border:"none",color:"red",
                fontWeight:"bold",marginLeft:4,cursor:"pointer",fontSize:16}}>❌</button>
          </div>
        ))}
        <button onClick={handleNewTab}
          style={{padding:"8px 12px",background:"#10b981",color:"#fff",
            border:"none",borderRadius:6,cursor:"pointer"}}>+ Nueva</button>
      </div>

      {/* canvas */}
      <div id="editor" style={{height:"calc(100vh - 102px)"}} />
    </div>
  );
}

export default Workspace;
