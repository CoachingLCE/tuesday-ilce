'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [ref, onOutside]);
}

function CeldaEstado({ columna, valor, onGuardar }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setAbierto(false));
  const opcion = (columna.opciones || []).find((o) => o.id === valor);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full h-9 rounded text-xs font-semibold text-white flex items-center justify-center px-2 truncate"
        style={{ background: opcion?.color || '#c4c4c4' }}
      >
        {opcion?.label || 'Sin estado'}
      </button>
      {abierto && (
        <div className="absolute z-20 top-full left-0 mt-1 w-44 bg-surface2 border border-border rounded-lg shadow-xl p-1">
          {(columna.opciones || []).map((o) => (
            <button
              key={o.id}
              onClick={() => { onGuardar(o.id, `cambió ${columna.nombre} a "${o.label}"`); setAbierto(false); }}
              className="w-full text-left text-xs rounded px-2 py-1.5 mb-0.5 text-white font-medium"
              style={{ background: o.color }}
            >
              {o.label}
            </button>
          ))}
          {!columna.opciones?.length && <p className="text-xs text-textMuted px-2 py-1">Sin opciones cargadas.</p>}
          {valor && (
            <button onClick={() => { onGuardar('', `quitó ${columna.nombre}`); setAbierto(false); }} className="w-full text-left text-xs text-textMuted px-2 py-1.5 border-t border-border mt-0.5 pt-1.5">
              Limpiar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Un contenido puede tener uno o varios responsables: el valor de la celda es un array de
// emails. Sigue aceptando el formato viejo (un email suelto como texto) para no romper
// contenidos ya cargados antes de este cambio.
function normalizarResponsables(valor) {
  if (Array.isArray(valor)) return valor;
  return valor ? [valor] : [];
}

function CeldaPersona({ columna, valor, usuariosEquipo, onGuardar, puedeCrearPersonas, onCrearPersona }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [emailNuevo, setEmailNuevo] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorCreando, setErrorCreando] = useState('');
  const [posicion, setPosicion] = useState(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const seleccionados = normalizarResponsables(valor);
  const personas = seleccionados.map((email) => usuariosEquipo.find((u) => u.email === email)).filter(Boolean);
  const filtrados = usuariosEquipo.filter((u) => u.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const hayCoincidenciaExacta = usuariosEquipo.some((u) => u.nombre.toLowerCase() === busqueda.trim().toLowerCase());

  // El menú se dibuja con un portal directo a <body> (no adentro de la celda), así no lo
  // recorta el ancho de la columna ni el scroll horizontal de la tabla.
  useEffect(() => {
    if (!abierto) return;
    function onClickFuera(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setAbierto(false);
      }
    }
    function cerrar() { setAbierto(false); }
    document.addEventListener('mousedown', onClickFuera);
    window.addEventListener('scroll', cerrar, true);
    window.addEventListener('resize', cerrar);
    return () => {
      document.removeEventListener('mousedown', onClickFuera);
      window.removeEventListener('scroll', cerrar, true);
      window.removeEventListener('resize', cerrar);
    };
  }, [abierto]);

  function abrir() {
    const r = triggerRef.current.getBoundingClientRect();
    const ancho = 280; // 250-300px pedido
    let left = r.left;
    if (left + ancho > window.innerWidth - 8) left = Math.max(8, window.innerWidth - ancho - 8);
    setPosicion({ top: r.bottom + 4, left, ancho });
    setBusqueda('');
    setFormularioAbierto(false);
    setAbierto(true);
  }

  function alternar(u) {
    const yaEsta = seleccionados.includes(u.email);
    const nuevos = yaEsta ? seleccionados.filter((e) => e !== u.email) : [...seleccionados, u.email];
    onGuardar(nuevos, yaEsta ? `quitó a ${u.nombre} de ${columna.nombre}` : `asignó ${columna.nombre} a ${u.nombre}`);
  }

  async function crear(e) {
    e.preventDefault();
    if (!busqueda.trim() || !emailNuevo.trim() || creando) return;
    setCreando(true);
    setErrorCreando('');
    try {
      const resultado = await onCrearPersona(busqueda.trim(), emailNuevo.trim());
      if (resultado?.email) {
        onGuardar([...seleccionados, resultado.email], `asignó ${columna.nombre} a ${busqueda.trim()} (persona nueva)`);
        setBusqueda(''); setFormularioAbierto(false); setEmailNuevo('');
      } else {
        setErrorCreando(resultado?.error || 'No se pudo crear.');
      }
    } finally {
      setCreando(false);
    }
  }

  return (
    <div ref={triggerRef}>
      <button onClick={() => (abierto ? setAbierto(false) : abrir())} className="w-full h-9 rounded text-xs flex items-center gap-1 px-2 hover:bg-surface2 overflow-hidden">
        {personas.length ? (
          <div className="flex items-center gap-1 overflow-hidden">
            <div className="flex items-center -space-x-1.5 shrink-0">
              {personas.slice(0, 3).map((p) => (
                <span key={p.email} title={p.nombre} className="w-6 h-6 rounded-full bg-accentPurple text-white flex items-center justify-center text-[10px] font-bold border-2 border-surface">
                  {p.nombre.slice(0, 1).toUpperCase()}
                </span>
              ))}
            </div>
            <span className="truncate">
              {personas.length > 2 ? `${personas[0].nombre} +${personas.length - 1}` : personas.map((p) => p.nombre).join(', ')}
            </span>
          </div>
        ) : <span className="text-textMuted">+ Asignar</span>}
      </button>
      {abierto && posicion && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'fixed', top: posicion.top, left: posicion.left, width: posicion.ancho, zIndex: 100 }}
          className="bg-surface2 border border-border rounded-lg shadow-xl p-1.5"
        >
          <input
            autoFocus value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar…" className="w-full bg-bg border border-border rounded px-2 py-1.5 text-xs mb-1.5"
          />
          <div className="max-h-56 overflow-y-auto">
            {filtrados.map((u) => {
              const activo = seleccionados.includes(u.email);
              return (
                <button
                  key={u.email}
                  onClick={() => alternar(u)}
                  className={`w-full text-left text-xs px-2 py-2 rounded flex items-center gap-2 mb-0.5 ${activo ? 'bg-accentTeal/15' : 'hover:bg-bg'}`}
                >
                  <span className="w-6 h-6 rounded-full bg-accentPurple text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {u.nombre.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">{u.nombre}</span>
                  {activo && <span className="text-accentTeal shrink-0">✓</span>}
                </button>
              );
            })}
            {!filtrados.length && <p className="text-xs text-textMuted px-2 py-1.5">Nadie coincide.</p>}
          </div>
          {puedeCrearPersonas && busqueda.trim() && !hayCoincidenciaExacta && (
            formularioAbierto ? (
              <form onSubmit={crear} className="mt-1 border-t border-border pt-1.5 space-y-1">
                <p className="text-[11px] text-textMuted px-1">Crear a &quot;{busqueda.trim()}&quot; en Usuarios:</p>
                <input
                  autoFocus value={emailNuevo} onChange={(e) => setEmailNuevo(e.target.value)}
                  type="email" placeholder="email@ilce.com"
                  className="w-full bg-bg border border-border rounded px-2 py-1 text-xs"
                />
                {errorCreando && <p className="text-[10px] text-dangerText px-1">{errorCreando}</p>}
                <div className="flex gap-1">
                  <button type="submit" disabled={creando || !emailNuevo.trim()} className="flex-1 bg-accentTeal text-white rounded px-2 py-1 text-xs font-semibold disabled:opacity-50">
                    {creando ? 'Creando…' : 'Crear'}
                  </button>
                  <button type="button" onClick={() => { setFormularioAbierto(false); setErrorCreando(''); }} className="text-xs text-textMuted px-2">Cancelar</button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setFormularioAbierto(true)}
                className="w-full text-left text-xs text-accentTeal px-2 py-1.5 mt-1 border-t border-border pt-1.5"
              >
                {`+ Crear persona "${busqueda.trim()}"`}
              </button>
            )
          )}
          <div className="flex items-center justify-between mt-1 border-t border-border pt-1.5">
            {seleccionados.length > 0 ? (
              <button onClick={() => onGuardar([], `quitó a todos de ${columna.nombre}`)} className="text-xs text-textMuted hover:text-dangerText px-1">
                Quitar todos
              </button>
            ) : <span />}
            <button onClick={() => setAbierto(false)} className="text-xs text-accentTeal font-semibold px-2 py-1">Listo ✓</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function CeldaFecha({ columna, valor, onGuardar }) {
  return (
    <input
      type="date"
      value={valor || ''}
      onChange={(e) => onGuardar(e.target.value, e.target.value ? `cambió ${columna.nombre} a ${e.target.value}` : `quitó ${columna.nombre}`)}
      className="w-full h-9 bg-transparent hover:bg-surface2 rounded text-xs px-2 border-none outline-none text-text"
    />
  );
}

function detectarTipoAdjunto(url) {
  const u = (url || '').toLowerCase().split('?')[0];
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(u)) return 'image';
  if (/\.(mp4|webm|mov)$/.test(u)) return 'video';
  if (/\.pdf$/.test(u)) return 'pdf';
  return 'link';
}

function iconoAdjunto(kind) {
  if (kind === 'video') return '🎬';
  if (kind === 'pdf') return '📄';
  return '🔗';
}

function CeldaArchivo({ columna, valor, onGuardar }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [url, setUrl] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const ref = useRef(null);
  useClickOutside(ref, () => setAbierto(false));
  const archivos = Array.isArray(valor) ? valor : [];

  function agregar(e) {
    e.preventDefault();
    if (!nombre.trim() || !url.trim()) return;
    const nuevo = { id: `f_${Date.now()}`, kind: detectarTipoAdjunto(url.trim()), name: nombre.trim(), url: url.trim() };
    onGuardar([...archivos, nuevo], `agregó un archivo a ${columna.nombre}: ${nuevo.name}`);
    setNombre(''); setUrl('');
  }

  function quitar(id) {
    onGuardar(archivos.filter((a) => a.id !== id), `quitó un archivo de ${columna.nombre}`);
  }

  function abrir(a) {
    if (a.kind === 'link') { window.open(a.url, '_blank', 'noreferrer'); return; }
    setLightbox(a);
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setAbierto((v) => !v)} className="w-full h-9 rounded flex items-center gap-1 px-2 hover:bg-surface2 overflow-hidden">
        {archivos.slice(0, 3).map((a) => (
          <span key={a.id} className="w-5 h-5 rounded bg-bg border border-border flex items-center justify-center text-[10px] shrink-0 overflow-hidden">
            {a.kind === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
            ) : iconoAdjunto(a.kind)}
          </span>
        ))}
        {archivos.length > 3 && <span className="text-[10px] text-textMuted">+{archivos.length - 3}</span>}
        {!archivos.length && <span className="text-textMuted text-xs">+ archivo</span>}
      </button>
      {abierto && (
        <div className="absolute z-20 top-full left-0 mt-1 w-56 bg-surface2 border border-border rounded-lg shadow-xl p-2">
          {archivos.length ? (
            <div className="space-y-1 mb-2 max-h-40 overflow-y-auto">
              {archivos.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 text-xs">
                  <button onClick={() => abrir(a)} className="flex-1 flex items-center gap-1.5 text-left truncate hover:underline">
                    <span className="w-5 h-5 rounded bg-bg border border-border flex items-center justify-center text-[10px] shrink-0 overflow-hidden">
                      {a.kind === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                      ) : iconoAdjunto(a.kind)}
                    </span>
                    <span className="truncate">{a.name}</span>
                  </button>
                  <button onClick={() => quitar(a.id)} className="text-textMuted hover:text-dangerText shrink-0">✕</button>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-textMuted mb-2">Sin archivos todavía.</p>}
          <form onSubmit={agregar} className="space-y-1">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className="w-full bg-bg border border-border rounded px-2 py-1 text-xs" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="w-full bg-bg border border-border rounded px-2 py-1 text-xs" />
            <button type="submit" className="w-full bg-accentTeal text-white rounded px-2 py-1 text-xs font-semibold">+ Agregar</button>
          </form>
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-5 text-white text-2xl leading-none">✕</button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-2">
            {lightbox.kind === 'image' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lightbox.url} alt={lightbox.name} className="max-w-[90vw] max-h-[78vh] rounded-lg object-contain" />
            )}
            {lightbox.kind === 'video' && (
              <video src={lightbox.url} controls autoPlay className="max-w-[90vw] max-h-[78vh] rounded-lg" />
            )}
            {lightbox.kind === 'pdf' && (
              <embed src={lightbox.url} type="application/pdf" className="w-[82vw] h-[78vh] rounded-lg bg-white" />
            )}
            <p className="text-white text-xs">{lightbox.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CeldaTexto({ columna, valor, onGuardar }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(valor || '');

  useEffect(() => { setTexto(valor || ''); }, [valor]);

  function guardar() {
    setEditando(false);
    if (texto !== (valor || '')) onGuardar(texto, `cambió ${columna.nombre}`);
  }

  if (editando) {
    return (
      <input
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={guardar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.target.blur();
          if (e.key === 'Escape') { setTexto(valor || ''); setEditando(false); }
        }}
        className="w-full h-9 bg-bg border border-accentTeal rounded px-2 text-xs outline-none"
      />
    );
  }
  return (
    <button onClick={() => setEditando(true)} className="w-full h-9 text-left px-2 rounded hover:bg-surface2 text-xs truncate">
      {valor || <span className="text-textMuted">—</span>}
    </button>
  );
}

export default function Celda({ columna, valor, usuariosEquipo, onGuardar, puedeCrearPersonas, onCrearPersona }) {
  if (columna.tipo === 'status') return <CeldaEstado columna={columna} valor={valor} onGuardar={onGuardar} />;
  if (columna.tipo === 'person') return (
    <CeldaPersona
      columna={columna} valor={valor} usuariosEquipo={usuariosEquipo || []} onGuardar={onGuardar}
      puedeCrearPersonas={puedeCrearPersonas} onCrearPersona={onCrearPersona}
    />
  );
  if (columna.tipo === 'date') return <CeldaFecha columna={columna} valor={valor} onGuardar={onGuardar} />;
  if (columna.tipo === 'file') return <CeldaArchivo columna={columna} valor={valor} onGuardar={onGuardar} />;
  return <CeldaTexto columna={columna} valor={valor} onGuardar={onGuardar} />;
}
