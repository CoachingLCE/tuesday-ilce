'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../lib/useSession';
import { tienePermisoEditarEstructura } from '../lib/permisos';
import { colorSiguiente } from '../lib/paletaTablero';
import GrupoTabla from '../components/tablero/GrupoTabla';
import PanelDetalle from '../components/tablero/PanelDetalle';
import EditorColumnas from '../components/tablero/EditorColumnas';
import ActividadGlobal from '../components/tablero/ActividadGlobal';

function nuevoId(prefijo) {
  return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function horaCorta(fecha) {
  return fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function TableroPage() {
  const { usuario, cargando, fetchAutenticado } = useSession();
  const router = useRouter();

  const [grupos, setGrupos] = useState([]);
  const [columnas, setColumnas] = useState([]);
  const [items, setItems] = useState([]);
  const [usuariosEquipo, setUsuariosEquipo] = useState([]);
  const [cargandoTablero, setCargandoTablero] = useState(true);
  const [error, setError] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTab, setFiltroTab] = useState(null); // { colId, optId } | null
  const [filtroResponsable, setFiltroResponsable] = useState('');

  const [itemSeleccionadoId, setItemSeleccionadoId] = useState(null);
  const [editandoColumnas, setEditandoColumnas] = useState(false);
  const [nuevoGrupoNombre, setNuevoGrupoNombre] = useState('');

  const [guardandoCount, setGuardandoCount] = useState(0);
  const [ultimoGuardado, setUltimoGuardado] = useState(null);

  const [actividadGlobal, setActividadGlobal] = useState([]);
  const [cargandoActividadGlobal, setCargandoActividadGlobal] = useState(false);
  const [mostrarActividadGlobal, setMostrarActividadGlobal] = useState(false);

  const puedeEditarEstructura = tienePermisoEditarEstructura(usuario);

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login');
  }, [cargando, usuario, router]);

  useEffect(() => {
    if (usuario) cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  async function cargarTodo() {
    setCargandoTablero(true);
    setError('');
    try {
      const [resTablero, resUsuarios, resActividad] = await Promise.all([
        fetchAutenticado('/api/tablero'),
        fetchAutenticado('/api/tablero/usuarios'),
        fetchAutenticado('/api/tablero/actividad')
      ]);
      const dataTablero = await resTablero.json();
      const dataUsuarios = await resUsuarios.json();
      const dataActividad = await resActividad.json().catch(() => ({}));
      if (!resTablero.ok) { setError(dataTablero.error || 'No se pudo cargar el tablero.'); return; }
      setGrupos(dataTablero.grupos || []);
      setColumnas(dataTablero.columnas || []);
      setItems(dataTablero.items || []);
      setUsuariosEquipo(dataUsuarios.usuarios || []);
      setActividadGlobal(dataActividad.actividad || []);
    } catch {
      setError('Error de conexión.');
    } finally {
      setCargandoTablero(false);
    }
  }

  async function refrescarActividadGlobal() {
    setCargandoActividadGlobal(true);
    try {
      const res = await fetchAutenticado('/api/tablero/actividad');
      const data = await res.json();
      if (res.ok) setActividadGlobal(data.actividad || []);
    } finally {
      setCargandoActividadGlobal(false);
    }
  }

  function abrirActividadGlobal() {
    setMostrarActividadGlobal(true);
    refrescarActividadGlobal();
  }

  /* Indicador de guardado ("Guardando… / ✓ Guardado hh:mm") — envuelve las mutaciones
     de red para mostrar el estado global sin tocar cada función una por una. */
  async function conIndicadorGuardado(fn) {
    setGuardandoCount((n) => n + 1);
    try {
      return await fn();
    } finally {
      setGuardandoCount((n) => Math.max(0, n - 1));
      setUltimoGuardado(new Date());
    }
  }

  /* ---------------- grupos ---------------- */
  async function crearGrupo(nombre) {
    const usados = grupos.map((g) => g.color);
    const id = nuevoId('gr');
    const color = colorSiguiente(usados);
    const orden = grupos.length;
    setGrupos((prev) => [...prev, { id, nombre, color, orden }]);
    try {
      await conIndicadorGuardado(async () => {
        const res = await fetchAutenticado('/api/tablero/grupos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, nombre, color, orden })
        });
        if (!res.ok) throw new Error();
      });
    } catch {
      setError('No se pudo crear el grupo. Refrescá la página.');
    }
  }

  async function actualizarGrupo(id, cambios) {
    setGrupos((prev) => prev.map((g) => (g.id === id ? { ...g, ...cambios } : g)));
    try {
      await conIndicadorGuardado(async () => {
        const res = await fetchAutenticado(`/api/tablero/grupos/${encodeURIComponent(id)}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cambios)
        });
        if (!res.ok) throw new Error();
      });
    } catch {
      setError('No se pudo guardar el grupo. Refrescá la página.');
    }
  }

  async function eliminarGrupo(grupo) {
    const cantidad = items.filter((it) => it.grupoId === grupo.id).length;
    const aviso = cantidad
      ? `¿Eliminar el grupo "${grupo.nombre}" y sus ${cantidad} contenido(s)? Esta acción no se puede deshacer.`
      : `¿Eliminar el grupo "${grupo.nombre}"?`;
    if (!window.confirm(aviso)) return;
    setGrupos((prev) => prev.filter((g) => g.id !== grupo.id));
    setItems((prev) => prev.filter((it) => it.grupoId !== grupo.id));
    try {
      await conIndicadorGuardado(async () => {
        const res = await fetchAutenticado(`/api/tablero/grupos/${encodeURIComponent(grupo.id)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
      });
    } catch {
      setError('No se pudo eliminar el grupo. Refrescá la página.');
    }
  }

  function crearGrupoDesdeInput(e) {
    e.preventDefault();
    if (!nuevoGrupoNombre.trim()) return;
    crearGrupo(nuevoGrupoNombre.trim());
    setNuevoGrupoNombre('');
  }

  /* ---------------- items ---------------- */
  async function crearItem(grupoId, nombre) {
    const id = nuevoId('it');
    const orden = items.filter((it) => it.grupoId === grupoId).length;
    const itemNuevo = { id, grupoId, nombre, orden, cells: {}, body: '', creadoPor: usuario.nombre, creadoEn: new Date().toISOString() };
    setItems((prev) => [...prev, itemNuevo]);
    try {
      await conIndicadorGuardado(async () => {
        const res = await fetchAutenticado('/api/tablero/items', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, grupoId, nombre, orden, cells: {}, body: '' })
        });
        if (!res.ok) throw new Error();
      });
    } catch {
      setError('No se pudo crear el contenido. Refrescá la página.');
    }
  }

  async function actualizarItem(itemId, cambios, actividadTexto) {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...cambios } : it)));
    try {
      await conIndicadorGuardado(async () => {
        const res = await fetchAutenticado(`/api/tablero/items/${encodeURIComponent(itemId)}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...cambios, actividadTexto })
        });
        if (!res.ok) throw new Error();
        if (actividadTexto) refrescarActividadGlobal();
      });
    } catch {
      setError('No se pudo guardar el cambio. Refrescá la página.');
    }
  }

  function actualizarCeldaDesdeGrupo(item, columna, valor, actividadTexto) {
    const cellsNuevas = { ...item.cells, [columna.id]: valor };
    actualizarItem(item.id, { cells: cellsNuevas }, actividadTexto);
  }

  async function eliminarItem(item) {
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    if (itemSeleccionadoId === item.id) setItemSeleccionadoId(null);
    try {
      await conIndicadorGuardado(async () => {
        const res = await fetchAutenticado(`/api/tablero/items/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
      });
    } catch {
      setError('No se pudo eliminar el contenido. Refrescá la página.');
    }
  }

  async function eliminarItemConfirmado(item) {
    if (!window.confirm(`¿Eliminar "${item.nombre || 'este contenido'}"?`)) return;
    eliminarItem(item);
  }

  async function moverItem(item, direccion) {
    const delGrupo = items.filter((it) => it.grupoId === item.grupoId).sort((a, b) => a.orden - b.orden);
    const idx = delGrupo.findIndex((it) => it.id === item.id);
    const otroIdx = idx + direccion;
    if (otroIdx < 0 || otroIdx >= delGrupo.length) return;
    const otro = delGrupo[otroIdx];
    const ordenA = item.orden, ordenB = otro.orden;
    setItems((prev) => prev.map((it) => {
      if (it.id === item.id) return { ...it, orden: ordenB };
      if (it.id === otro.id) return { ...it, orden: ordenA };
      return it;
    }));
    try {
      await conIndicadorGuardado(() => Promise.all([
        fetchAutenticado(`/api/tablero/items/${encodeURIComponent(item.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orden: ordenB }) }),
        fetchAutenticado(`/api/tablero/items/${encodeURIComponent(otro.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orden: ordenA }) })
      ]));
    } catch {
      setError('No se pudo reordenar. Refrescá la página.');
    }
  }

  /* ---------------- columnas ---------------- */
  async function crearColumna(columna) {
    setColumnas((prev) => [...prev, columna]);
    try {
      await conIndicadorGuardado(async () => {
        const res = await fetchAutenticado('/api/tablero/columnas', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(columna)
        });
        if (!res.ok) throw new Error();
      });
    } catch {
      setError('No se pudo crear la columna. Refrescá la página.');
    }
  }

  async function actualizarColumna(id, cambios) {
    setColumnas((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambios } : c)));
    try {
      await conIndicadorGuardado(async () => {
        const res = await fetchAutenticado(`/api/tablero/columnas/${encodeURIComponent(id)}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cambios)
        });
        if (!res.ok) throw new Error();
      });
    } catch {
      setError('No se pudo guardar la columna. Refrescá la página.');
    }
  }

  async function eliminarColumna(id) {
    if (!window.confirm('¿Eliminar esta columna? Los valores cargados en ella se van a perder.')) return;
    setColumnas((prev) => prev.filter((c) => c.id !== id));
    try {
      await conIndicadorGuardado(async () => {
        const res = await fetchAutenticado(`/api/tablero/columnas/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
      });
    } catch {
      setError('No se pudo eliminar la columna. Refrescá la página.');
    }
  }

  /* ---------------- personas (crear desde el selector "Responsable") ---------------- */
  async function crearPersona(nombre, email) {
    try {
      const res = await fetchAutenticado('/api/usuarios', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nombre, roles: ['Colaborador'] })
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'No se pudo crear.' };
      setUsuariosEquipo((prev) => [...prev, { email, nombre }]);
      return { email };
    } catch {
      return { error: 'Error de conexión.' };
    }
  }

  /* ---------------- filtros ---------------- */
  // Primera columna de tipo Estado: gobierna los "chips" de filtro rápido.
  const columnaEstado = useMemo(() => columnas.find((c) => c.tipo === 'status'), [columnas]);
  // Cualquier otra columna de tipo Estado (por ej. "Tipo") alimenta la fila de Pestañas.
  const columnasTabs = useMemo(() => columnas.filter((c) => c.tipo === 'status' && c.id !== columnaEstado?.id), [columnas, columnaEstado]);
  const opcionesTabs = useMemo(() => columnasTabs.flatMap((c) => (c.opciones || []).map((o) => ({ colId: c.id, optId: o.id, label: o.label, color: o.color }))), [columnasTabs]);
  const columnaResponsable = useMemo(() => columnas.find((c) => c.tipo === 'person'), [columnas]);

  // Pool base: solo búsqueda + responsable — sirve para calcular los contadores de chips/pestañas.
  const poolBase = useMemo(() => items.filter((it) => {
    if (busqueda && !(it.nombre || '').toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroResponsable && columnaResponsable && it.cells?.[columnaResponsable.id] !== filtroResponsable) return false;
    return true;
  }), [items, busqueda, filtroResponsable, columnaResponsable]);

  const poolTrasChip = useMemo(() => poolBase.filter((it) => {
    if (filtroEstado && columnaEstado && it.cells?.[columnaEstado.id] !== filtroEstado) return false;
    return true;
  }), [poolBase, filtroEstado, columnaEstado]);

  const itemsFiltrados = useMemo(() => poolTrasChip.filter((it) => {
    if (filtroTab && it.cells?.[filtroTab.colId] !== filtroTab.optId) return false;
    return true;
  }), [poolTrasChip, filtroTab]);

  // Desglose por estado para la barra de estadísticas — sobre el resultado final visible.
  const desgloseEstado = useMemo(() => {
    if (!columnaEstado) return [];
    return (columnaEstado.opciones || []).map((o) => ({
      ...o, cantidad: itemsFiltrados.filter((it) => it.cells?.[columnaEstado.id] === o.id).length
    })).filter((o) => o.cantidad > 0);
  }, [columnaEstado, itemsFiltrados]);

  const gruposOrdenados = useMemo(() => [...grupos].sort((a, b) => a.orden - b.orden), [grupos]);
  const itemSeleccionado = items.find((it) => it.id === itemSeleccionadoId);
  const hayFiltrosActivos = busqueda || filtroEstado || filtroTab || filtroResponsable;
  const actividadHoy = actividadGlobal.filter((a) => (a.fecha || '').slice(0, 10) === new Date().toISOString().slice(0, 10)).length;

  if (cargando || !usuario) return null;

  return (
    <div className="max-w-[1440px] mx-auto px-6 pb-16">
      {error && (
        <div className="mb-4 bg-dangerBg text-dangerText text-sm rounded-lg px-3 py-2 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs underline">Cerrar</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔎 Buscar contenido…"
          className="bg-surface2 border border-border rounded-lg px-3 py-1.5 text-sm w-56"
          data-tour="tablero-buscar"
        />
        {columnaResponsable && (
          <select
            value={filtroResponsable} onChange={(e) => setFiltroResponsable(e.target.value)}
            className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-sm"
          >
            <option value="">Todos los responsables</option>
            {usuariosEquipo.map((u) => <option key={u.email} value={u.email}>{u.nombre}</option>)}
          </select>
        )}
        {hayFiltrosActivos && (
          <button onClick={() => { setBusqueda(''); setFiltroEstado(''); setFiltroTab(null); setFiltroResponsable(''); }} className="text-xs text-textMuted hover:text-text underline">
            Limpiar filtros
          </button>
        )}

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-xs text-textMuted" title={ultimoGuardado ? `Guardado a las ${horaCorta(ultimoGuardado)}` : ''}>
            {guardandoCount > 0 ? (
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accentTeal animate-pulse" /> Guardando…</span>
            ) : ultimoGuardado ? (
              <span>✓ Guardado · {horaCorta(ultimoGuardado)}</span>
            ) : null}
          </div>
          <button
            onClick={abrirActividadGlobal}
            className="relative w-8 h-8 rounded-lg bg-surface2 border border-border flex items-center justify-center hover:border-accentTeal"
            title="Actividad del tablero" data-tour="tablero-actividad-global"
          >
            🔔
            {actividadHoy > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-accentMagenta text-white text-[10px] font-bold flex items-center justify-center">
                {actividadHoy}
              </span>
            )}
          </button>
        </div>
      </div>

      {opcionesTabs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5 border-b border-border pb-2.5" data-tour="tablero-tabs">
          <button
            onClick={() => setFiltroTab(null)}
            className={`h-7 px-3 rounded-lg text-xs font-semibold ${!filtroTab ? 'bg-gradient-to-r from-accentPurple to-accentMagenta text-white' : 'bg-surface2 text-textSec hover:text-text'}`}
          >
            Todos <span className="opacity-70">{poolTrasChip.length}</span>
          </button>
          {opcionesTabs.map((o) => {
            const activo = filtroTab?.colId === o.colId && filtroTab?.optId === o.optId;
            const cantidad = poolTrasChip.filter((it) => it.cells?.[o.colId] === o.optId).length;
            return (
              <button
                key={`${o.colId}:${o.optId}`}
                onClick={() => setFiltroTab(activo ? null : { colId: o.colId, optId: o.optId })}
                className={`h-7 px-3 rounded-lg text-xs font-semibold ${activo ? 'bg-gradient-to-r from-accentPurple to-accentMagenta text-white' : 'bg-surface2 text-textSec hover:text-text'}`}
              >
                {o.label} <span className="opacity-70">{cantidad}</span>
              </button>
            );
          })}
        </div>
      )}

      {columnaEstado && (columnaEstado.opciones || []).length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3" data-tour="tablero-filtro-estado">
          {(columnaEstado.opciones || []).map((o) => {
            const activo = filtroEstado === o.id;
            const cantidad = poolBase.filter((it) => it.cells?.[columnaEstado.id] === o.id).length;
            return (
              <button
                key={o.id}
                onClick={() => setFiltroEstado(activo ? '' : o.id)}
                className={`h-6 pl-1.5 pr-2.5 rounded-full text-[11px] font-medium flex items-center gap-1 border ${activo ? 'border-text' : 'border-border'} bg-surface2 hover:border-text`}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: o.color }} />
                {o.label} <span className="text-textMuted">{cantidad}</span>
              </button>
            );
          })}
        </div>
      )}

      {columnaEstado && desgloseEstado.length > 0 && (
        <p className="text-xs text-textMuted mb-3">
          {itemsFiltrados.length} contenido{itemsFiltrados.length === 1 ? '' : 's'}
          {desgloseEstado.map((o) => ` · ${o.cantidad} ${o.label.toLowerCase()}`).join('')}
        </p>
      )}
      {(!columnaEstado || desgloseEstado.length === 0) && (
        <p className="text-xs text-textMuted mb-3">{itemsFiltrados.length} de {items.length} contenidos</p>
      )}

      {cargandoTablero ? (
        <p className="text-sm text-textMuted">Cargando tablero…</p>
      ) : (
        <>
          {gruposOrdenados.map((grupo) => (
            <GrupoTabla
              key={grupo.id}
              grupo={grupo}
              columnas={columnas}
              items={itemsFiltrados.filter((it) => it.grupoId === grupo.id).sort((a, b) => a.orden - b.orden)}
              usuariosEquipo={usuariosEquipo}
              puedeEditarEstructura={puedeEditarEstructura}
              onRenombrarGrupo={(nombre) => actualizarGrupo(grupo.id, { nombre })}
              onRecolorearGrupo={(color) => actualizarGrupo(grupo.id, { color })}
              onEliminarGrupo={() => eliminarGrupo(grupo)}
              onCrearItem={(nombre) => crearItem(grupo.id, nombre)}
              onActualizarCelda={actualizarCeldaDesdeGrupo}
              onAbrirItem={setItemSeleccionadoId}
              onMoverItem={moverItem}
              onEliminarItem={eliminarItemConfirmado}
              onAbrirEditorColumnas={() => setEditandoColumnas(true)}
              onCrearPersona={crearPersona}
            />
          ))}

          {!grupos.length && (
            <p className="text-sm text-textMuted mb-4">Todavía no hay grupos. Creá el primero abajo.</p>
          )}

          <form onSubmit={crearGrupoDesdeInput} className="flex items-center gap-2" data-tour="tablero-nuevo-grupo">
            <input
              value={nuevoGrupoNombre}
              onChange={(e) => setNuevoGrupoNombre(e.target.value)}
              placeholder="+ Agregar grupo"
              className="bg-surface2 border border-border rounded-lg px-3 py-1.5 text-sm w-56"
            />
            <button type="submit" className="text-xs text-accentTeal hover:underline">Crear</button>
          </form>
        </>
      )}

      {itemSeleccionado && (
        <PanelDetalle
          item={itemSeleccionado}
          columnas={columnas}
          usuariosEquipo={usuariosEquipo}
          grupos={gruposOrdenados}
          fetchAutenticado={fetchAutenticado}
          usuario={usuario}
          onCerrar={() => setItemSeleccionadoId(null)}
          onActualizarItem={(cambios, actividadTexto) => actualizarItem(itemSeleccionado.id, cambios, actividadTexto)}
          onEliminarItem={eliminarItem}
          puedeCrearPersonas={puedeEditarEstructura}
          onCrearPersona={crearPersona}
        />
      )}

      {editandoColumnas && puedeEditarEstructura && (
        <EditorColumnas
          columnas={columnas}
          onCrear={crearColumna}
          onActualizar={actualizarColumna}
          onEliminar={eliminarColumna}
          onCerrar={() => setEditandoColumnas(false)}
        />
      )}

      {mostrarActividadGlobal && (
        <ActividadGlobal
          actividad={actividadGlobal}
          items={items}
          cargando={cargandoActividadGlobal}
          onCerrar={() => setMostrarActividadGlobal(false)}
          onAbrirItem={(id) => { setMostrarActividadGlobal(false); setItemSeleccionadoId(id); }}
        />
      )}
    </div>
  );
}
