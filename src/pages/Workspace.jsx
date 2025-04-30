import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import axiosInstance from "../services/axiosInstance";
import { useNavigate } from "react-router-dom";

/* ---------- utilidades ---------- */
const throttle = (fn, delay = 60) => {
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
const CURSOR_Y_OFFSET = 180; 

const colorFromId = (id) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `hsl(${h} 90% 55%)`;
};

function Workspace() {
/* ---------- refs ---------- */
const editorRef      = useRef(null);
const editorDivRef   = useRef(null);   // div#editor en tu DOM
const canvasElRef    = useRef(null);   // .gjs-cv-canvas (scrollable)
const socketRef      = useRef(null);
const remoteApplyRef = useRef(false);
const tabsRef        = useRef([]);
const activeTabRef   = useRef("");
const mySocketIdRef  = useRef("");

/* ---------- cursors ---------- */
const cursorLayerRef = useRef(null);   // overlay absoluto
const cursorsRef     = useRef({});     // { socketId: HTMLElement }
const myName         = localStorage.getItem("nombre") || "Yo";

/* ---------- state ---------- */
const [tabs, setTabs]               = useState([{ id:"tab-1", name:"Inicio", html:"", css:"" }]);
const [activeTab, setActiveTab]     = useState("tab-1");
const [nombreProyecto, setNombreProyecto] = useState("");
const [editingTabId, setEditingTabId]     = useState(null);
const [editingTabName, setEditingTabName] = useState("");
const [isSaving, setIsSaving]             = useState(false);

/* ---- invitaciones ---- */
const [showInvite, setShowInvite]     = useState(false);
const [inviteUuid, setInviteUuid]     = useState("");
const [invitaciones, setInvitaciones] = useState([]);

/* ---------- constantes ---------- */
const navigate  = useNavigate();
const projectId = localStorage.getItem("idProyecto");

/* ---------- refs <-> state ---------- */
useEffect(() => { tabsRef.current      = tabs;      }, [tabs]);
useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

/* ---------- capa overlay ---------- */
useEffect(() => {
  const layer = document.createElement("div");
  Object.assign(layer.style, {position:"fixed",inset:"0",pointerEvents:"none",zIndex:"9999"});
  document.body.appendChild(layer);
  cursorLayerRef.current = layer;
  return () => layer.remove();
}, []);

const clearCursors = () => {
  Object.values(cursorsRef.current).forEach(el => el.remove());
  cursorsRef.current = {};
};

/* ---------- helper: update & broadcast ---------- */
const emitTabsSnapshot = list => {
  if (!socketRef.current?.connected) return;
  socketRef.current.emit("tabsSnapshot", {
    socketId: mySocketIdRef.current, projectId,
    tabs: list.map(({id,name}) => ({id,name}))
  });
};
const updateTabsAndEmit = fn => {
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
    socketId: mySocketIdRef.current,
    projectId,
    tabId:    activeTabRef.current,
    html:     editorRef.current.getHtml(),
    css:      editorRef.current.getCss()
  });
}, 250);

/* ---------- socket ---------- */
useEffect(() => {
  const sock = io("https://diagramador-backend.railway.app");
  socketRef.current = sock;

  sock.on("connect", () => {
    mySocketIdRef.current = sock.id;
    sock.emit("joinProject", { projectId });
  });

  /* --- contenido HTML/CSS --- */
  sock.on("editorUpdate", snap => {
    if (snap.projectId !== projectId || snap.socketId === mySocketIdRef.current) return;
    updateTabsAndEmit(prev =>
      prev.map(t => t.id === snap.tabId ? {...t,html:snap.html,css:snap.css}:t)
    );
    if (snap.tabId === activeTabRef.current && editorRef.current){
      remoteApplyRef.current = true;
      editorRef.current.setComponents(snap.html);
      editorRef.current.setStyle(snap.css);
    }
  });

  /* --- lista de pestañas --- */
  sock.on("tabsSnapshot", pkt => {
    if (pkt.projectId !== projectId || pkt.socketId === mySocketIdRef.current) return;
    setTabs(prev => {
      const cache = Object.fromEntries(prev.map(t=>[t.id,t]));
      const merged = pkt.tabs.map(({id,name})=>
        cache[id] ? {...cache[id],name}: {id,name,html:"",css:""});
      tabsRef.current = merged;
      if (!merged.find(t=>t.id===activeTabRef.current)){
        const first = merged[0]; if(first) handleTabChange(first.id, merged);
      }
      return merged;
    });
  });

  /* ---------------- CURSORES ---------------- */
  sock.on("cursorMove", pkt => {
    if (pkt.projectId !== projectId) return;
    if (pkt.tabId     !== activeTabRef.current) return;
    if (pkt.socketId  === mySocketIdRef.current) return;
    if (!canvasElRef.current) return;

    /*  reconstruir posición absoluta añadiendo el scroll del canvas destino */
    const canvas = canvasElRef.current;
    const rect   = canvas.getBoundingClientRect();
    const xAbs   = rect.left - canvas.scrollLeft + pkt.rx * canvas.scrollWidth;
    const yAbs   = rect.top  - canvas.scrollTop  + pkt.ry * canvas.scrollHeight;

    let el = cursorsRef.current[pkt.socketId];
    if (!el){
      el = document.createElement("div");
      Object.assign(el.style,{
        position:"absolute",pointerEvents:"none",
        fontSize:"12px",fontWeight:"600",whiteSpace:"nowrap",
        padding:"2px 6px",borderRadius:"9999px",color:"#fff",
        background:colorFromId(pkt.socketId),transform:"translate(-50%,-120%)"
      });
      el.textContent = pkt.name;
      cursorLayerRef.current.appendChild(el);
      cursorsRef.current[pkt.socketId]=el;
    }

    /* clamp: por seguridad */
    const x = Math.min(Math.max(xAbs, rect.left),  rect.right);
    const y = Math.min(Math.max(yAbs, rect.top ),  rect.bottom);
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
  });

  sock.on("cursorLeave", ({socketId})=>{
    const el = cursorsRef.current[socketId];
    if(el){el.remove(); delete cursorsRef.current[socketId];}
  });

  sock.on("disconnect",clearCursors);
  return ()=> sock.disconnect();
}, [projectId]);

/* ---------- emitir mi cursor ---------- */
useEffect(()=>{
  const sendPos = throttle(e=>{
    if(!socketRef.current?.connected) return;
    if(!canvasElRef.current) return;

    const canvas = canvasElRef.current;
    const rect   = canvas.getBoundingClientRect();
   if (
     e.clientX < rect.left || e.clientX > rect.right ||
     e.clientY < rect.top  - CURSOR_Y_OFFSET ||          //   ⬅ margen extra
     e.clientY > rect.bottom
   ) return;

    /* posición relativa al documento interno (scroll incluido) */
    const rx = (e.clientX - rect.left + canvas.scrollLeft)  / canvas.scrollWidth;
    const ry = (e.clientY - rect.top  + canvas.scrollTop + CURSOR_Y_OFFSET)  / canvas.scrollHeight;

    socketRef.current.emit("cursorMove",{
      projectId, tabId:activeTabRef.current, name:myName, rx, ry
    });
  },60);

  const leave = () => {
    socketRef.current?.emit("cursorLeave",{projectId,socketId:mySocketIdRef.current});
  };

  window.addEventListener("mousemove",sendPos);
  editorDivRef.current?.addEventListener("mouseleave",leave);
  return ()=>{
    window.removeEventListener("mousemove",sendPos);
    editorDivRef.current?.removeEventListener("mouseleave",leave);
  };
},[activeTab]);

/* ---------- GrapesJS ---------- */
useEffect(()=>{
  const editor = grapesjs.init({
    container:"#editor",
    width:"100%",
    height:"calc(100vh - 102px)",
    storageManager:false
  });
  editorRef.current   = editor;
  editorDivRef.current= document.getElementById("editor");

  /* canvas interno para scroll/size */
  setTimeout(()=>{canvasElRef.current =
    editorDivRef.current.querySelector(".gjs-cv-canvas");},0);

  editor.on("update",()=>{
    if(remoteApplyRef.current){remoteApplyRef.current=false;return;}
    emitContentSnapshot();
  });

  /* estilos y bloques …  (NO SE MODIFICÓ) */
  editor.CssComposer.getAll().add(`
    [contenteditable]{spellcheck:false;-webkit-text-size-adjust:none;}
    .gjs-cv-canvas *{text-transform:none!important;}
  `);

  editor.addComponents(`<style>
    html,body{margin:0;padding:0;height:100%;width:100%}
    .gjs-cv-canvas{padding:0!important;margin:0!important}
    .gjs-row{margin:0!important}
    .gjs-container{margin:0!important;padding:0!important}
  </style>`);

  /* ---------- tipos ---------- */
  const colBase={tagName:"div",droppable:true,draggable:true,classes:["gjs-column"],
                 style:{flex:"1",padding:"10px",minHeight:"100px",border:"1px dashed #ccc"}};

  editor.DomComponents.addType("row",{model:{defaults:{
    tagName:"div",droppable:true,draggable:true,classes:["gjs-row"],
    style:{display:"flex",margin:"10px 0"}}}});
  editor.DomComponents.addType("column",{model:{defaults:colBase}});
  editor.DomComponents.addType("column-3-7-left",
    {model:{defaults:{...colBase,style:{...colBase.style,flex:"3"}}}});
  editor.DomComponents.addType("column-3-7-right",
    {model:{defaults:{...colBase,style:{...colBase.style,flex:"7"}}}});

  /* ---------- bloques (igual que antes) ---------- */
  const bm=editor.BlockManager;
  bm.add("one-column",{label:"1 Column",category:"Layout",
    content:{type:"row",components:[{type:"column"}]}});
  bm.add("two-columns",{label:"2 Columns",category:"Layout",
    content:{type:"row",components:[{type:"column"},{type:"column"}]}});
  bm.add("three-columns",{label:"3 Columns",category:"Layout",
    content:{type:"row",components:[
      {type:"column"},{type:"column"},{type:"column"}]}});
  bm.add("two-columns-3-7",{label:"2 Columns 3/7",category:"Layout",
    content:{type:"row",components:[
      {type:"column-3-7-left"},{type:"column-3-7-right"}]}});
  bm.add("text",{label:"Text",category:"Basic",
    content:"<p>Insert your text here</p>"});
  bm.add("link",{label:"Link",category:"Basic",
    content:'<a href="#">Insert link</a>'});
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
},[]);

/* ---------- autoguardado (sin cambios) ---------- */
useEffect(()=>{
  const id=setInterval(()=>{
    if(!editorRef.current) return;
    const curr=tabsRef.current.find(t=>t.id===activeTabRef.current);
    if(curr){
      curr.html=editorRef.current.getHtml();
      curr.css =editorRef.current.getCss();
    }
    guardarProyecto();
  },10000);
  return()=>clearInterval(id);
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
    }catch(e){ console.error("save",e); }
    finally{ setIsSaving(false); }
  };

  /* ---------- pestañas ---------- */
  const handleTabChange = (id,list=tabsRef.current) => {
    if (id === activeTabRef.current) return;
    clearCursors();                           /* 💡 limpia cursores al cambiar */
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
      const {data} = await axiosInstance.get(`/proyectos/exportar/${projectId}`,{responseType:"blob",timeout:300000});
      const url = URL.createObjectURL(new Blob([data],{type:"application/zip"}));
      const a = document.createElement("a");
      a.href = url; a.download = `${nombreProyecto}.zip`; a.click();
      URL.revokeObjectURL(url);
    }catch(e){ console.error("export",e); }
  };

  /* ---------- invitaciones ---------- */
  const cargarInvitaciones = async () => {
    try{
      const {data} = await axiosInstance.get(`/invitaciones/proyecto/${projectId}`);
      setInvitaciones(data);
    }catch(e){ console.error("invites",e); }
  };

  const enviarInvitacion = async () => {
    if (!inviteUuid.trim()) return;
    try{
      await axiosInstance.post("/invitaciones",{ idProyecto: projectId, idUsuario: inviteUuid.trim() });
      setInviteUuid(""); await cargarInvitaciones(); alert("✅ Invitación enviada");
    }catch(e){ console.error("invite",e); alert("❌ Error al enviar invitación"); }
  };
  useEffect(()=>{ if (showInvite) cargarInvitaciones(); }, [showInvite]);

  const volverInicio = () => navigate("/dashboard");

  /* ---------- UI ---------- */
  return (
    <div>
      {/* barra superior */}
      <div style={{display:"flex",alignItems:"center",background:"#1f2937",color:"#fff",padding:10,justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={volverInicio} style={{background:"#2563eb",color:"#fff",padding:"8px 12px",borderRadius:6,border:"none",cursor:"pointer"}}>← Volver</button>
          <h2 style={{margin:0,fontSize:"1.5rem"}}>{nombreProyecto || "Proyecto"}</h2>
        </div>
        <span style={{marginRight:16,color:isSaving?"#fbbf24":"#10b981"}}>{isSaving ? "Guardando…" : "Guardado"}</span>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowInvite(true)} style={{background:"#3b82f6",color:"#fff",padding:"8px 12px",border:"none",borderRadius:6,cursor:"pointer"}}>Compartir</button>
          <button onClick={exportarProyecto} style={{background:"#10b981",color:"#fff",padding:"8px 12px",borderRadius:6,border:"none",cursor:"pointer"}}>Exportar</button>
        </div>
      </div>

      {/* pestañas */}
      <div style={{display:"flex",gap:10,padding:10,background:"#f3f4f6"}}>
        {tabs.map(tab => (
          <div key={tab.id} style={{display:"flex",alignItems:"center"}}>
            {editingTabId === tab.id ? (
              <input value={editingTabName} onChange={e=>setEditingTabName(e.target.value)}
                     onBlur={handleFinishEditing} onKeyDown={e=>e.key==="Enter" && handleFinishEditing()}
                     spellCheck={false} autoCapitalize="off" autoFocus
                     style={{padding:"8px 12px",background:"#e5e7eb",border:"none",borderRadius:6,fontSize:14,minWidth:100}}/>
            ) : (
              <button onClick={()=>handleTabChange(tab.id)}
                      onDoubleClick={()=>{setEditingTabId(tab.id);setEditingTabName(tab.name);}}
                      style={{padding:"8px 12px",background:activeTab===tab.id?"#2563eb":"#e5e7eb",
                              color:activeTab===tab.id?"#fff":"#000",border:"none",borderRadius:6,
                              cursor:"pointer",minWidth:100,textTransform:"none"}}>
                {tab.name}
              </button>
            )}
            <button onClick={()=>handleDeleteTab(tab.id)}
                    style={{background:"transparent",border:"none",color:"red",
                      fontWeight:"bold",marginLeft:4,cursor:"pointer",fontSize:16}}>❌</button>
          </div>
        ))}
        <button onClick={handleNewTab} style={{padding:"8px 12px",background:"#10b981",color:"#fff",border:"none",borderRadius:6,cursor:"pointer"}}>+ Nueva</button>
      </div>

      {/* canvas */}
      <div id="editor" style={{height:"calc(100vh - 102px)"}} />

      {/* modal invitaciones */}
      {showInvite && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
          <div style={{background:"#fff",padding:24,borderRadius:8,width:380,maxHeight:"80vh",display:"flex",flexDirection:"column",gap:16,overflowY:"auto"}}>
            <h3 style={{margin:0}}>Compartir proyecto</h3>
            <div style={{display:"flex",gap:8}}>
              <input placeholder="UUID del usuario…" value={inviteUuid} onChange={e=>setInviteUuid(e.target.value)}
                     style={{flex:1,padding:"8px 10px",borderRadius:6,border:"1px solid #d1d5db"}}/>
              <button onClick={enviarInvitacion} style={{background:"#2563eb",color:"#fff",padding:"8px 12px",border:"none",borderRadius:6,cursor:"pointer"}}>Invitar</button>
            </div>
            <hr/>
            <h4 style={{margin:"4px 0"}}>Invitaciones</h4>
            {invitaciones.length === 0 && <p>No hay invitaciones.</p>}
            {invitaciones.map(inv => (
              <div key={inv.idInvitacion} style={{padding:6,borderBottom:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",fontSize:14}}>
                <span>{inv.usuario?.nombre || inv.idUsuario}</span>
                <span style={{fontWeight:"bold"}}>
                  {inv.estado === "pendiente" ? "🟡 Pendiente" : inv.estado === "aceptada" ? "🟢 Aceptada" : "🔴 Rechazada"}
                </span>
              </div>
            ))}
            <button onClick={()=>setShowInvite(false)} style={{marginTop:8,alignSelf:"flex-end",background:"#ef4444",color:"#fff",padding:"8px 12px",border:"none",borderRadius:6,cursor:"pointer"}}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Workspace;
