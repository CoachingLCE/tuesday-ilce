'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Celda from './Celda';

function escaparHtml(texto) {
  return texto.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

const URL_REGEX = /(https?:\/\/[^\s<>"']+)/g;

// Convierte URLs sueltas en texto a links <a> clickeables, sin tocar lo que ya está
// dentro de una etiqueta <a> (para no terminar con links anidados al pasarlo dos veces).
function linkificarHtml(html) {
  const partes = html.split(/(<a\b[^>]*>[\s\S]*?<\/a>)/gi);
  return partes
    .map((parte) => {
      if (/^<a\b/i.test(parte)) return parte;
      return parte.replace(URL_REGEX, (url) => {
        const limpio = url.replace(/[.,;:!?)]+$/, ''); // no arrastrar puntuación final
        const sobra = url.slice(limpio.length);
        return `<a href="${limpio}" target="_blank" rel="noreferrer" class="text-accentTeal underline">${limpio}</a>${sobra}`;
      });
    })
    .join('');
}

function comentarioAHtml(texto, usuariosEquipo) {
  let html = escaparHtml(texto);
  usuariosEquipo.forEach((u) => {
    const escapado = u.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`@${escapado}`, 'g'), `<strong class="text-accentTeal">@${u.nombre}</strong>`);
  });
  html = html.replace(/\n/g, '<br/>');
  return linkificarHtml(html);
}

function formatearFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
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

  // @menciones dentro de la Descripción (mismo mecanismo que en Comentarios, pero acá el
  // campo es un contentEditable en vez de un <textarea>, así que hace falta ubicar el
  // cursor con la Selection API en vez de con selectionStart).
  const [mentionBodyAbierto, setMentionBodyAbierto] = useState(false);
  const [mentionBodyQuery, setMentionBodyQuery] = useState('');
  const [mentionBodyPos, setMentionBodyPos] = useState(null);

  const bodyRef = useRef(null);
  const textareaRef = useRef(null);

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
    // Antes de guardar, convertimos cualquier URL suelta que haya quedado como texto
    // plano (tipeada a mano, o pegada junto con más texto) en un link clickeable.
    if (bodyRef.current) {
      const conLinks = linkificarHtml(bodyRef.current.innerHTML);
      if (conLinks !== bodyRef.current.innerHTML) bodyRef.current.innerHTML = conLinks;
    }
    const html = bodyRef.current?.innerHTML || '';
    if (html !== (item.body || '')) onActualizarItem({ body: html }, 'editó la descripción');
  }

  // Si se pega SOLO una URL (el caso más común: copiar un link de Calendar, Drive, etc.),
  // se inserta directamente como link clickeable en vez de texto plano.
  function onPasteBody(e) {
    const texto = e.clipboardData?.getData('text/plain') || '';
    if (/^https?:\/\/\S+$/.test(texto.trim())) {
      e.preventDefault();
      const url = texto.trim();
      document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noreferrer" class="text-accentTeal underline">${url}</a>`);
    }
  }

  // Detecta "@algo" justo antes del cursor en la Descripción (igual que en Comentarios,
  // pero con la Selection API porque este campo es un contentEditable) y abre el menú de
  // sugerencias en esa posición.
  function onInputBody() {
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    if (!sel || sel.rangeCount === 0 || !bodyRef.current?.contains(sel.anchorNode)) {
      setMentionBodyAbierto(false);
      return;
    }
    const range = sel.getRangeAt(0);
    const nodo = range.startContainer;
    if (nodo.nodeType !== Node.TEXT_NODE) { setMentionBodyAbierto(false); return; }
    const hastaCursor = nodo.textContent.slice(0, range.startOffset);
    const match = hastaCursor.match(/@([a-zA-ZÀ-ÿ0-9]*)$/);
    if (!match) { setMentionBodyAbierto(false); return; }
    setMentionBodyQuery(match[1].toLowerCase());
    const rect = range.getClientRects()[0] || range.getBoundingClientRect();
    setMentionBodyPos(rect && (rect.top || rect.left) ? { top: rect.bottom + 4, left: rect.left } : null);
    setMentionBodyAbierto(true);
  }

  // Reemplaza el "@query" que quedó antes del cursor por la mención elegida, resaltada y
  // no editable como una sola unidad, y deja el cursor justo después.
  function elegirMencionBody(nombrePersona) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { setMentionBodyAbierto(false); return; }
    const range = sel.getRangeAt(0);
    const nodo = range.startContainer;
    if (nodo.nodeType !== Node.TEXT_NODE) { setMentionBodyAbierto(false); return; }
    const texto = nodo.textContent;
    const cursor = range.startOffset;
    const match = texto.slice(0, cursor).match(/@([a-zA-ZÀ-ÿ0-9]*)$/);
    if (!match) { setMentionBodyAbierto(false); return; }
    const inicio = cursor - match[0].length;

    const nodoAntes = document.createTextNode(texto.slice(0, inicio));
    const mencion = document.createElement('strong');
    mencion.className = 'text-accentTeal';
    mencion.textContent = `@${nombrePersona}`;
    const espacio = document.createTextNode(' ');
    const nodoDespues = document.createTextNode(texto.slice(cursor));

    const padre = nodo.parentNode;
    padre.insertBefore(nodoAntes, nodo);
    padre.insertBefore(mencion, nodo);
    padre.insertBefore(espacio, nodo);
    padre.insertBefore(nodoDespues, nodo);
    padre.removeChild(nodo);

    const nuevoRange = document.createRange();
    nuevoRange.setStart(nodoDespues, 0);
    nuevoRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nuevoRange);

    setMentionBodyAbierto(false);
    bodyRef.current?.focus();
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
  const sugeridosBody = usuariosEquipo.filter((u) => u.nombre.toLowerCase().includes(mentionBodyQuery)).slice(0, 6);

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
              onPaste={onPasteBody}
              onInput={onInputBody}
              onKeyUp={onInputBody}
              className="min-h-[100px] bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accentTeal [&_a]:text-accentTeal [&_a]:underline"
              data-tour="tablero-descripcion"
            />
            <p className="text-[10px] text-textMuted mt-1">Usá @ para mencionar a alguien del equipo y avisarle.</p>
            {mentionBodyAbierto && sugeridosBody.length > 0 && mentionBodyPos && typeof document !== 'undefined' && createPortal(
              <div
                style={{ position: 'fixed', top: mentionBodyPos.top, left: mentionBodyPos.left, zIndex: 100 }}
                className="w-52 bg-surface2 border border-border rounded-lg shadow-xl p-1"
              >
                {sugeridosBody.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); elegirMencionBody(u.nombre); }}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-bg"
                  >
                    {u.nombre}
                  </button>
                ))}
              </div>,
              document.body
            )}
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
    </div>
  );
}
