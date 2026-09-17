'use client';
import { useEffect, useRef, useState } from 'react';
import Celda from './Celda';

function escaparHtml(texto) {
  return texto.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function comentarioAHtml(texto, usuariosEquipo) {
  let html = escaparHtml(texto);
  usuariosEquipo.forEach((u) => {
    const escapado = u.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`@${escapado}`, 'g'), `<strong class="text-accentTeal">@${u.nombre}</strong>`);
  });
  return html.replace(/\n/g, '<br/>');
}

function formatearFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function detectarTipoAdjunto(url) {
  const u = url.toLowerCase().split('?')[0];
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(u)) return 'image';
  if (/\.(mp4|webm|mov)$/.test(u)) return 'video';
  if (/\.pdf$/.test(u)) return 'pdf';
  return 'link';
}

function iconoAdjunto(kind) {
  if (kind === 'image') return null; // se muestra la miniatura real
  if (kind === 'video') return '🎬';
  if (kind === 'pdf') return '📄';
  return '🔗';
}

export default function PanelDetalle({
  item, columnas, usuariosEquipo, grupos, fetchAutenticado, usuario,
  onCerrar, onActualizarItem, onEliminarItem, puedeCrearPersonas, onCrearPersona
}) {
  const [nombre, setNombre] = useState(item.nombre || '');
  const [comentarios, setComentarios] = useState([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(true);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [mentionAbierto, setMentionAbierto] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [mostrarActividad, setMostrarActividad] = useState(false);
  const [actividad, setActividad] = useState([]);
  const [cargandoActividad, setCargandoActividad] = useState(false);
  const [nuevoAdjuntoAbierto, setNuevoAdjuntoAbierto] = useState(false);
  const [adjNombre, setAdjNombre] = useState('');
  const [adjUrl, setAdjUrl] = useState('');
  const [lightbox, setLightbox] = useState(null); // { url, kind, name }

  const bodyRef = useRef(null);
  const textareaRef = useRef(null);

  const adjuntos = Array.isArray(item.cells?.__adjuntos) ? item.cells.__adjuntos : [];

  useEffect(() => {
    setNombre(item.nombre || '');
    if (bodyRef.current) bodyRef.current.innerHTML = item.body || '';
    setMostrarActividad(false);
    setActividad([]);
    cargarComentarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  async function cargarComentarios() {
    setCargandoComentarios(true);
    try {
      const res = await fetchAutenticado(`/api/tablero/items/${encodeURIComponent(item.id)}/comentarios`);
      const data = await res.json();
      if (res.ok) setComentarios(data.comentarios || []);
    } finally {
      setCargandoComentarios(false);
    }
  }

  async function cargarActividad() {
    setCargandoActividad(true);
    try {
      const res = await fetchAutenticado(`/api/tablero/items/${encodeURIComponent(item.id)}/actividad`);
      const data = await res.json();
      if (res.ok) setActividad(data.actividad || []);
    } finally {
      setCargandoActividad(false);
    }
  }

  function toggleActividad() {
    const nuevo = !mostrarActividad;
    setMostrarActividad(nuevo);
    if (nuevo && !actividad.length) cargarActividad();
  }

  function guardarNombre() {
    if (nombre.trim() && nombre !== item.nombre) onActualizarItem({ nombre: nombre.trim() }, 'cambió el nombre del contenido');
    else setNombre(item.nombre || '');
  }

  function guardarBody() {
    const html = bodyRef.current?.innerHTML || '';
    if (html !== (item.body || '')) onActualizarItem({ body: html }, 'editó la descripción');
  }

  function comando(cmd) {
    document.execCommand(cmd, false, null);
    bodyRef.current?.focus();
  }

  function actualizarCelda(columna, valor, actividadTexto) {
    const cellsNuevas = { ...item.cells, [columna.id]: valor };
    onActualizarItem({ cells: cellsNuevas }, actividadTexto);
  }

  function cambiarGrupo(grupoId) {
    const g = grupos.find((x) => x.id === grupoId);
    onActualizarItem({ grupoId }, `movió el contenido al grupo "${g?.nombre || grupoId}"`);
  }

  function agregarAdjunto(e) {
    e.preventDefault();
    if (!adjNombre.trim() || !adjUrl.trim()) return;
    const nuevo = { id: `adj_${Date.now()}`, kind: detectarTipoAdjunto(adjUrl.trim()), name: adjNombre.trim(), url: adjUrl.trim() };
    const cellsNuevas = { ...item.cells, __adjuntos: [...adjuntos, nuevo] };
    onActualizarItem({ cells: cellsNuevas }, `agregó un enlace: ${nuevo.name}`);
    setAdjNombre(''); setAdjUrl(''); setNuevoAdjuntoAbierto(false);
  }

  function quitarAdjunto(id) {
    const cellsNuevas = { ...item.cells, __adjuntos: adjuntos.filter((a) => a.id !== id) };
    onActualizarItem({ cells: cellsNuevas }, 'quitó un enlace');
  }

  function abrirAdjunto(a) {
    if (a.kind === 'link') { window.open(a.url, '_blank', 'noreferrer'); return; }
    setLightbox(a);
  }

  function onChangeComentario(e) {
    const val = e.target.value;
    setNuevoComentario(val);
    const cursor = e.target.selectionStart;
    const hastaCursor = val.slice(0, cursor);
    const match = hastaCursor.match(/@([a-zA-ZÀ-ÿ0-9]*)$/);
    if (match) { setMentionQuery(match[1].toLowerCase()); setMentionAbierto(true); }
    else setMentionAbierto(false);
  }

  function elegirMention(nombrePersona) {
    const ta = textareaRef.current;
    const cursor = ta ? ta.selectionStart : nuevoComentario.length;
    const hasta = nuevoComentario.slice(0, cursor).replace(/@([a-zA-ZÀ-ÿ0-9]*)$/, `@${nombrePersona} `);
    const despues = nuevoComentario.slice(cursor);
    setNuevoComentario(hasta + despues);
    setMentionAbierto(false);
    ta?.focus();
  }

  async function enviarComentario(e) {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      const html = comentarioAHtml(nuevoComentario.trim(), usuariosEquipo);
      const res = await fetchAutenticado(`/api/tablero/items/${encodeURIComponent(item.id)}/comentarios`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html })
      });
      if (res.ok) {
        setNuevoComentario('');
        await cargarComentarios();
      }
    } finally {
      setEnviandoComentario(false);
    }
  }

  function eliminar() {
    if (!window.confirm(`¿Eliminar "${item.nombre || 'este contenido'}"? Esta acción no se puede deshacer.`)) return;
    onEliminarItem(item);
  }

  const sugeridos = usuariosEquipo.filter((u) => u.nombre.toLowerCase().includes(mentionQuery)).slice(0, 6);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" data-tour="tablero-slideover">
      <div className="flex-1 bg-black/50" onClick={onCerrar} />
      <div className="w-full max-w-lg h-full bg-surface border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center gap-2 z-10">
          <select
            value={item.grupoId}
            onChange={(e) => cambiarGrupo(e.target.value)}
            className="text-xs bg-surface2 border border-border rounded-lg px-2 py-1"
          >
            {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
          <div className="flex-1" />
          <button onClick={eliminar} className="text-textMuted hover:text-dangerText text-sm" title="Eliminar">🗑</button>
          <button onClick={onCerrar} className="text-textMuted hover:text-text text-lg leading-none" title="Cerrar">✕</button>
        </div>

        <div className="p-5">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={guardarNombre}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            placeholder="Nombre del contenido"
            className="w-full bg-transparent text-lg font-bold outline-none border-b border-transparent focus:border-accentTeal pb-1 mb-4"
          />

          <div className="flex flex-wrap gap-3 mb-5">
            {columnas.map((c) => (
              <div key={c.id} className="w-40">
                <p className="text-[11px] text-textMuted mb-1">{c.nombre}</p>
                <Celda
                  columna={c} valor={item.cells?.[c.id]} usuariosEquipo={usuariosEquipo}
                  onGuardar={(v, txt) => actualizarCelda(c, v, txt)}
                  puedeCrearPersonas={puedeCrearPersonas} onCrearPersona={onCrearPersona}
                />
              </div>
            ))}
          </div>

          <div className="mb-5">
            <p className="text-xs font-semibold text-textMuted mb-1.5">Descripción</p>
            <div className="flex gap-1 mb-1.5">
              <button type="button" onClick={() => comando('bold')} className="w-7 h-7 rounded border border-border text-xs font-bold hover:bg-surface2">B</button>
              <button type="button" onClick={() => comando('italic')} className="w-7 h-7 rounded border border-border text-xs italic hover:bg-surface2">I</button>
              <button type="button" onClick={() => comando('insertUnorderedList')} className="w-7 h-7 rounded border border-border text-xs hover:bg-surface2">•≡</button>
            </div>
            <div
              ref={bodyRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={guardarBody}
              className="min-h-[100px] bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accentTeal"
              data-tour="tablero-descripcion"
            />
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-textMuted">Archivos y enlaces</p>
              <button onClick={() => setNuevoAdjuntoAbierto((v) => !v)} className="text-xs text-accentTeal hover:underline">+ Agregar enlace</button>
            </div>
            {nuevoAdjuntoAbierto && (
              <form onSubmit={agregarAdjunto} className="flex gap-1.5 mb-2">
                <input value={adjNombre} onChange={(e) => setAdjNombre(e.target.value)} placeholder="Nombre" className="flex-1 bg-bg border border-border rounded-lg px-2 py-1.5 text-xs" />
                <input value={adjUrl} onChange={(e) => setAdjUrl(e.target.value)} placeholder="https://…" className="flex-[2] bg-bg border border-border rounded-lg px-2 py-1.5 text-xs" />
                <button className="bg-accentTeal text-white rounded-lg px-2.5 text-xs font-semibold">OK</button>
              </form>
            )}
            {adjuntos.length ? (
              <div className="flex flex-wrap gap-2">
                {adjuntos.map((a) => (
                  <div key={a.id} className="w-24">
                    <div
                      onClick={() => abrirAdjunto(a)}
                      className="relative w-24 h-20 rounded-lg border border-border bg-bg flex items-center justify-center text-2xl cursor-pointer overflow-hidden hover:border-accentTeal"
                      title={a.name}
                    >
                      {a.kind === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{iconoAdjunto(a.kind)}</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); quitarAdjunto(a.id); }}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-dangerText"
                      >✕</button>
                    </div>
                    <p className="text-[10px] text-textMuted truncate mt-0.5" title={a.name}>{a.name}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-textMuted">Sin archivos todavía.</p>}
          </div>

          <div className="mb-5">
            <p className="text-xs font-semibold text-textMuted mb-1.5">Comentarios</p>
            {cargandoComentarios ? (
              <p className="text-xs text-textMuted">Cargando…</p>
            ) : (
              <div className="space-y-2 mb-2 max-h-56 overflow-y-auto">
                {comentarios.map((c) => (
                  <div key={c.id} className="bg-bg border border-border rounded-lg px-2.5 py-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold">{c.autor}</span>
                      <span className="text-[10px] text-textMuted">{formatearFecha(c.fecha)}</span>
                    </div>
                    <p className="text-xs text-textSec" dangerouslySetInnerHTML={{ __html: c.html }} />
                  </div>
                ))}
                {!comentarios.length && <p className="text-xs text-textMuted">Todavía no hay comentarios.</p>}
              </div>
            )}
            <form onSubmit={enviarComentario} className="relative">
              <textarea
                ref={textareaRef}
                value={nuevoComentario}
                onChange={onChangeComentario}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarComentario(e); } }}
                placeholder="Escribí un comentario… usá @ para mencionar"
                rows={2}
                className="w-full bg-bg border border-border rounded-lg px-2.5 py-2 text-xs outline-none focus:border-accentTeal resize-none"
                data-tour="tablero-comentarios"
              />
              {mentionAbierto && sugeridos.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-52 bg-surface2 border border-border rounded-lg shadow-xl p-1 z-10">
                  {sugeridos.map((u) => (
                    <button key={u.email} type="button" onClick={() => elegirMention(u.nombre)} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-bg">
                      {u.nombre}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-end mt-1.5">
                <button type="submit" disabled={enviandoComentario || !nuevoComentario.trim()} className="bg-gradient-to-r from-accentPurple to-accentMagenta text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40">
                  {enviandoComentario ? 'Enviando…' : 'Comentar'}
                </button>
              </div>
            </form>
          </div>

          <div>
            <button onClick={toggleActividad} className="text-xs font-semibold text-textMuted hover:text-text" data-tour="tablero-actividad">
              {mostrarActividad ? '▾' : '▸'} Actividad
            </button>
            {mostrarActividad && (
              <div className="mt-2 space-y-1.5">
                {cargandoActividad ? (
                  <p className="text-xs text-textMuted">Cargando…</p>
                ) : actividad.length ? (
                  actividad.map((a) => (
                    <p key={a.id} className="text-xs text-textSec">
                      <span className="font-semibold">{a.autor}</span> {a.texto} <span className="text-textMuted">· {formatearFecha(a.fecha)}</span>
                    </p>
                  ))
                ) : <p className="text-xs text-textMuted">Sin actividad registrada.</p>}
              </div>
            )}
          </div>
        </div>
      </div>

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
