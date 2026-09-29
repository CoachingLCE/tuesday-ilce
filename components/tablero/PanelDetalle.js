'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Celda from './Celda';
import { marcarPanelAbierto, marcarPanelCerrado } from '../../lib/panelAbierto';

// Ancho del panel de detalle: el usuario puede arrastrar el borde izquierdo para agrandarlo
// (se guarda en localStorage para que quede como lo dejó). Solo aplica en escritorio — en
// mobile el panel siempre ocupa el ancho completo.
const ANCHO_PANEL_MIN = 420;
const ANCHO_PANEL_MAX = 1000;
const ANCHO_PANEL_DEFAULT = 512;
const CLAVE_ANCHO_PANEL = 'tuesday_panelDetalle_ancho';

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

// Cada Descripción es un bloque independiente: arranca bloqueada si ya tiene contenido
// guardado (no se toca por accidente), y solo se puede volver a editar tocando "Editar".
// Al guardar, queda fija de nuevo. Tiene su propio "Comentar" — los comentarios quedan
// agrupados por descripción, no todos juntos.
function DescripcionCard({
  descripcion, numero, esUltima, comentarios, usuariosEquipo, fetchAutenticado, itemId,
  onGuardarTexto, onAgregarDescripcion, onComentarioPublicado
}) {
  const [bloqueada, setBloqueada] = useState(!!descripcion.bloqueada);
  const [modificado, setModificado] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [mentionAbierto, setMentionAbierto] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPos, setMentionPos] = useState(null);
  const bodyRef = useRef(null);

  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [mentionComentAbierto, setMentionComentAbierto] = useState(false);
  const [mentionComentQuery, setMentionComentQuery] = useState('');
  const [mentionComentPos, setMentionComentPos] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setBloqueada(!!descripcion.bloqueada);
    if (bodyRef.current) bodyRef.current.innerHTML = descripcion.texto || '';
    setModificado(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descripcion.id]);

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

  // Un click normal en un link dentro de un contentEditable NO lo abre por defecto (el
  // navegador asume que querés editar el texto, no navegar) — así que lo abrimos a mano.
  function onClickBody(e) {
    const link = e.target.closest?.('a');
    if (link && bodyRef.current?.contains(link)) {
      e.preventDefault();
      window.open(link.href, '_blank', 'noopener,noreferrer');
    }
  }

  // Detecta "@algo" justo antes del cursor (con la Selection API porque este campo es un
  // contentEditable) y abre el menú de sugerencias en esa posición.
  function onInputBody() {
    setModificado(true);
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    if (!sel || sel.rangeCount === 0 || !bodyRef.current?.contains(sel.anchorNode)) {
      setMentionAbierto(false);
      return;
    }
    const range = sel.getRangeAt(0);
    const nodo = range.startContainer;
    if (nodo.nodeType !== Node.TEXT_NODE) { setMentionAbierto(false); return; }
    const hastaCursor = nodo.textContent.slice(0, range.startOffset);
    const match = hastaCursor.match(/@([a-zA-ZÀ-ÿ0-9]*)$/);
    if (!match) { setMentionAbierto(false); return; }
    setMentionQuery(match[1].toLowerCase());
    const rect = range.getClientRects()[0] || range.getBoundingClientRect();
    setMentionPos(rect && (rect.top || rect.left) ? { top: rect.bottom + 4, left: rect.left } : null);
    setMentionAbierto(true);
  }

  // Reemplaza el "@query" que quedó antes del cursor por la mención elegida, resaltada y
  // no editable como una sola unidad, y deja el cursor justo después.
  function elegirMencion(nombrePersona) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) { setMentionAbierto(false); return; }
    const range = sel.getRangeAt(0);
    const nodo = range.startContainer;
    if (nodo.nodeType !== Node.TEXT_NODE) { setMentionAbierto(false); return; }
    const texto = nodo.textContent;
    const cursor = range.startOffset;
    const match = texto.slice(0, cursor).match(/@([a-zA-ZÀ-ÿ0-9]*)$/);
    if (!match) { setMentionAbierto(false); return; }
    const inicio = cursor - match[0].length;

    const nodoAntes = document.createTextNode(texto.slice(0, inicio));
    const mencion = document.createElement('strong');
    mencion.className = 'text-accentTeal';
    mencion.textContent = `@${nombrePersona}`;
    const espacio = document.createTextNode(' ');
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

    setMentionAbierto(false);
    setModificado(true);
    bodyRef.current?.focus();
  }

  function comando(cmd) {
    document.execCommand(cmd, false, null);
    bodyRef.current?.focus();
  }

  function activarEdicion() {
    setBloqueada(false);
    setTimeout(() => bodyRef.current?.focus(), 0);
  }

  function guardar() {
    // Antes de guardar, convertimos cualquier URL suelta que haya quedado como texto
    // plano (tipeada a mano, o pegada junto con más texto) en un link clickeable.
    if (bodyRef.current) {
      const conLinks = linkificarHtml(bodyRef.current.innerHTML);
      if (conLinks !== bodyRef.current.innerHTML) bodyRef.current.innerHTML = conLinks;
    }
    const html = bodyRef.current?.innerHTML || '';
    setModificado(false);
    setBloqueada(true);
    onGuardarTexto(descripcion.id, html, numero);
    setGuardadoOk(true);
    setTimeout(() => setGuardadoOk(false), 2000);
  }

  function onChangeComentario(e) {
    const val = e.target.value;
    setNuevoComentario(val);
    const cursor = e.target.selectionStart;
    const hastaCursor = val.slice(0, cursor);
    const match = hastaCursor.match(/@([a-zA-ZÀ-ÿ0-9]*)$/);
    if (match) {
      setMentionComentQuery(match[1].toLowerCase());
      const r = e.target.getBoundingClientRect();
      setMentionComentPos({ bottom: window.innerHeight - r.top + 4, left: r.left });
      setMentionComentAbierto(true);
    } else setMentionComentAbierto(false);
  }

  function elegirMentionComentario(nombrePersona) {
    const ta = textareaRef.current;
    const cursor = ta ? ta.selectionStart : nuevoComentario.length;
    const hasta = nuevoComentario.slice(0, cursor).replace(/@([a-zA-ZÀ-ÿ0-9]*)$/, `@${nombrePersona} `);
    const despues = nuevoComentario.slice(cursor);
    setNuevoComentario(hasta + despues);
    setMentionComentAbierto(false);
    ta?.focus();
  }

  async function enviarComentario(e) {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      const html = comentarioAHtml(nuevoComentario.trim(), usuariosEquipo);
      const res = await fetchAutenticado(`/api/tablero/items/${encodeURIComponent(itemId)}/comentarios`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, descripcionId: descripcion.id, etiqueta: `Descripción ${numero}` })
      });
      if (res.ok) {
        setNuevoComentario('');
        onComentarioPublicado();
      }
    } finally {
      setEnviandoComentario(false);
    }
  }

  const sugeridos = usuariosEquipo.filter((u) => u.nombre.toLowerCase().includes(mentionQuery)).slice(0, 6);
  const sugeridosComentario = usuariosEquipo.filter((u) => u.nombre.toLowerCase().includes(mentionComentQuery)).slice(0, 6);

  return (
    <div className="mb-4 bg-bg border border-border rounded-xl p-3">
      <div className="flex items-center gap-1 mb-1.5">
        <p className="text-xs font-semibold text-textMuted flex-1">Descripción {numero}</p>
        {bloqueada ? (
          <button type="button" onClick={activarEdicion} className="text-xs px-2.5 py-1 rounded-md border border-border text-textSec hover:text-text hover:border-accentTeal">
            ✏️ Editar
          </button>
        ) : (
          <>
            <button type="button" onClick={() => comando('bold')} className="w-7 h-7 rounded border border-border text-xs font-bold hover:bg-surface2">B</button>
            <button type="button" onClick={() => comando('italic')} className="w-7 h-7 rounded border border-border text-xs italic hover:bg-surface2">I</button>
            <button type="button" onClick={() => comando('insertUnorderedList')} className="w-7 h-7 rounded border border-border text-xs hover:bg-surface2">•≡</button>
            {modificado && (
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={guardar}
                className="ml-2 text-xs px-3 py-1 rounded-md bg-accentTeal text-white font-semibold">
                💾 Guardar
              </button>
            )}
          </>
        )}
        {guardadoOk && <span className="ml-2 text-xs text-successText font-semibold">✓ Guardado</span>}
      </div>
      <div
        ref={bodyRef}
        contentEditable={!bloqueada}
        suppressContentEditableWarning
        onPaste={onPasteBody}
        onClick={onClickBody}
        onInput={onInputBody}
        onKeyUp={onInputBody}
        className={`min-h-[80px] rounded-lg px-3 py-2 text-sm outline-none [&_a]:text-accentTeal [&_a]:underline [&_a]:cursor-pointer ${
          bloqueada ? 'bg-surface2/60 text-textSec cursor-default' : 'bg-surface border border-border focus:border-accentTeal'
        }`}
        data-tour={numero === 1 ? 'tablero-descripcion' : undefined}
      />
      {!bloqueada && <p className="text-[10px] text-textMuted mt-1">Usá @ para mencionar a alguien del equipo y avisarle.</p>}
      {mentionAbierto && sugeridos.length > 0 && mentionPos && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: mentionPos.top, left: mentionPos.left, zIndex: 100 }} className="w-52 bg-surface2 border border-border rounded-lg shadow-xl p-1">
          {sugeridos.map((u) => (
            <button key={u.email} type="button" onMouseDown={(e) => { e.preventDefault(); elegirMencion(u.nombre); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-bg">
              {u.nombre}
            </button>
          ))}
        </div>,
        document.body
      )}

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-[11px] font-semibold text-textMuted mb-1.5">Comentarios de esta descripción</p>
        <div className="space-y-2 mb-2 max-h-40 overflow-y-auto">
          {comentarios.map((c) => (
            <div key={c.id} className="bg-surface border border-border rounded-lg px-2.5 py-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold">{c.autor}</span>
                <span className="text-[10px] text-textMuted">{formatearFecha(c.fecha)}</span>
              </div>
              <p className="text-xs text-textSec" dangerouslySetInnerHTML={{ __html: c.html }} />
            </div>
          ))}
          {!comentarios.length && <p className="text-xs text-textMuted">Todavía no hay comentarios acá.</p>}
        </div>
        <form onSubmit={enviarComentario} className="relative">
          <textarea
            ref={textareaRef}
            value={nuevoComentario}
            onChange={onChangeComentario}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarComentario(e); } }}
            placeholder="Escribí un comentario… usá @ para mencionar"
            rows={2}
            className="w-full bg-surface border border-border rounded-lg px-2.5 py-2 text-xs outline-none focus:border-accentTeal resize-none"
            data-tour={numero === 1 ? 'tablero-comentarios' : undefined}
          />
          {mentionComentAbierto && sugeridosComentario.length > 0 && mentionComentPos && typeof document !== 'undefined' && createPortal(
            <div style={{ position: 'fixed', bottom: mentionComentPos.bottom, left: mentionComentPos.left, zIndex: 100 }} className="w-52 bg-surface2 border border-border rounded-lg shadow-xl p-1">
              {sugeridosComentario.map((u) => (
                <button key={u.email} type="button" onMouseDown={(e) => { e.preventDefault(); elegirMentionComentario(u.nombre); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-bg">
                  {u.nombre}
                </button>
              ))}
            </div>,
            document.body
          )}
          <div className="flex justify-end mt-1.5">
            <button type="submit" disabled={enviandoComentario || !nuevoComentario.trim()} className="bg-gradient-to-r from-accentPurple to-accentMagenta text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40">
              {enviandoComentario ? 'Enviando…' : 'Comentar'}
            </button>
          </div>
        </form>
      </div>

      {esUltima && bloqueada && (
        <button type="button" onClick={onAgregarDescripcion} className="mt-3 text-xs px-3 py-1.5 rounded-lg border border-dashed border-border text-textSec hover:text-text hover:border-accentTeal w-full">
          ＋ Agregar otra descripción
        </button>
      )}
    </div>
  );
}

export default function PanelDetalle({
  item, columnas, usuariosEquipo, grupos, fetchAutenticado, usuario,
  onCerrar, onActualizarItem, onEliminarItem, puedeCrearPersonas, onCrearPersona, onAgregarOpcion
}) {
  const [nombre, setNombre] = useState(item.nombre || '');
  const [comentarios, setComentarios] = useState([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(true);
  const [mostrarActividad, setMostrarActividad] = useState(false);
  const [actividad, setActividad] = useState([]);
  const [cargandoActividad, setCargandoActividad] = useState(false);
  const [anchoPanel, setAnchoPanel] = useState(ANCHO_PANEL_DEFAULT);
  const [escritorio, setEscritorio] = useState(true);
  const anchoRef = useRef(ANCHO_PANEL_DEFAULT);

  // Mientras este panel está abierto, avisamos para que el botón flotante "❓ Necesito
  // ayuda" se oculte y no se superponga con "Comentar" ni con el resto de los botones.
  useEffect(() => {
    marcarPanelAbierto();
    return () => marcarPanelCerrado();
  }, []);

  useEffect(() => {
    try {
      const guardado = parseInt(localStorage.getItem(CLAVE_ANCHO_PANEL), 10);
      if (guardado && guardado >= ANCHO_PANEL_MIN && guardado <= ANCHO_PANEL_MAX) {
        setAnchoPanel(guardado);
        anchoRef.current = guardado;
      }
    } catch { /* ignorar */ }
    const chequearAncho = () => setEscritorio(window.innerWidth >= 768);
    chequearAncho();
    window.addEventListener('resize', chequearAncho);
    return () => window.removeEventListener('resize', chequearAncho);
  }, []);

  function iniciarResizePanel(e) {
    e.preventDefault();
    function mover(ev) {
      const nuevo = Math.min(ANCHO_PANEL_MAX, Math.max(ANCHO_PANEL_MIN, window.innerWidth - ev.clientX));
      anchoRef.current = nuevo;
      setAnchoPanel(nuevo);
    }
    function soltar() {
      window.removeEventListener('mousemove', mover);
      window.removeEventListener('mouseup', soltar);
      document.body.style.userSelect = '';
      try { localStorage.setItem(CLAVE_ANCHO_PANEL, String(anchoRef.current)); } catch { /* ignorar */ }
    }
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', soltar);
  }

  useEffect(() => {
    setNombre(item.nombre || '');
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

  function cambiarGrupo(grupoId) {
    const g = grupos.find((x) => x.id === grupoId);
    onActualizarItem({ grupoId }, `movió el contenido al grupo "${g?.nombre || grupoId}"`);
  }

  function eliminar() {
    if (!window.confirm(`¿Eliminar "${item.nombre || 'este contenido'}"? Esta acción no se puede deshacer.`)) return;
    onEliminarItem(item);
  }

  function actualizarCelda(columna, valor, actividadTexto) {
    const cellsNuevas = { ...item.cells, [columna.id]: valor };
    onActualizarItem({ cells: cellsNuevas }, actividadTexto);
  }

  // Las Descripciones son varios bloques de texto independientes (no solo uno): cada uno se
  // guarda y queda fijo hasta que se lo vuelve a poner en edición. Si el contenido todavía es
  // viejo (una sola Descripción sin este formato), lo tratamos como la primera.
  const descripciones = (item.descripciones && item.descripciones.length)
    ? item.descripciones
    : [{ id: 'd1', texto: item.body || '', bloqueada: !!item.body }];

  function guardarDescripcion(id, html, numero) {
    const actualizadas = descripciones.map((d) => (d.id === id ? { ...d, texto: html, bloqueada: true } : d));
    onActualizarItem({ descripciones: actualizadas, textoMencionado: html }, `editó la Descripción ${numero}`);
  }

  function agregarDescripcion() {
    const nuevoIdDesc = `d${descripciones.length + 1}-${Date.now().toString(36)}`;
    const actualizadas = [...descripciones, { id: nuevoIdDesc, texto: '', bloqueada: false }];
    onActualizarItem({ descripciones: actualizadas });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" data-tour="tablero-slideover">
      <div className="flex-1 bg-black/50" onClick={onCerrar} />
      <div
        className="relative w-full max-w-[95vw] h-full bg-surface border-l border-border overflow-y-auto"
        style={escritorio ? { width: anchoPanel, maxWidth: '95vw' } : undefined}
      >
        {/* Tirador para agrandar/achicar el panel arrastrando — solo en escritorio. */}
        <div
          onMouseDown={iniciarResizePanel}
          title="Arrastrar para agrandar"
          className="hidden md:block absolute top-0 bottom-0 left-0 w-1.5 -ml-0.5 cursor-col-resize z-20 hover:bg-accentTeal/50 active:bg-accentTeal/70 transition-colors"
        />
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
                  onAgregarOpcion={onAgregarOpcion}
                />
              </div>
            ))}
          </div>

          <div className="mb-5">
            {descripciones.map((d, i) => (
              <DescripcionCard
                key={d.id}
                descripcion={d}
                numero={i + 1}
                esUltima={i === descripciones.length - 1}
                comentarios={comentarios.filter((c) => (c.descripcionId ? c.descripcionId === d.id : i === 0))}
                usuariosEquipo={usuariosEquipo}
                fetchAutenticado={fetchAutenticado}
                itemId={item.id}
                onGuardarTexto={guardarDescripcion}
                onAgregarDescripcion={agregarDescripcion}
                onComentarioPublicado={cargarComentarios}
              />
            ))}
            {cargandoComentarios && <p className="text-xs text-textMuted">Cargando comentarios…</p>}
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
