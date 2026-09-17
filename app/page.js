'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../lib/useSession';
import { tienePermisoEditarEstructura } from '../lib/permisos';
import { colorSiguiente } from '../lib/paletaTablero';
import GrupoTabla from '../components/tablero/GrupoTabla';
import PanelDetalle from '../components/tablero/PanelDetalle';
import EditorColumnas from '../components/tablero/EditorColumnas';

function nuevoId(prefijo) {
  return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
  const [filtroResponsable, setFiltroResponsable] = useState('');

  const [itemSeleccionadoId, setItemSeleccionadoId] = useState(null);
  const [editandoColumnas, setEditandoColumnas] = useState(false);
  const [nuevoGrupoNombre, setNuevoGrupoNombre] = useState('');

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
      const [resTablero, resUsuarios] = await Promise.all([
        fetchAutenticado('/api/tablero'),
        fetchAutenticado('/api/tablero/usuarios')
      ]);
      const dataTablero = await resTablero.json();
      const dataUsuarios = await resUsuarios.json();
      if (!resTablero.ok) { setError(dataTablero.error || 'No se pudo cargar el tablero.'); return; }
      setGrupos(dataTablero.grupos || []);
      setColumnas(dataTablero.columnas || []);
      setItems(dataTablero.items || []);
      setUsuariosEquipo(dataUsuarios.usuarios || []);
    } catch {
      setError('Error de conexión.');
    } finally {
      setCargandoTablero(false);
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
      const res = await fetchAutenticado('/api/tablero/grupos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, nombre, color, orden })
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('No se pudo crear el grupo. Refrescá la página.');
    }
  }

  async function actualizarGrupo(id, cambios) {
    setGrupos((prev) => prev.map((g) => (g.id === id ? { ...g, ...cambios } : g)));
    try {
      const res = await fetchAutenticado(`/api/tablero/grupos/${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cambios)
      });
      if (!res.ok) throw new Error();
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
      const res = await fetchAutenticado(`/api/tablero/grupos/${encodeURIComponent(grupo.id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
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
      const res = await fetchAutenticado('/api/tablero/items', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, grupoId, nombre, orden, cells: {}, body: '' })
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('No se pudo crear el contenido. Refrescá la página.');
    }
  }

  async function actualizarItem(itemId, cambios, actividadTexto) {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...cambios } : it)));
    try {
      const res = await fetchAutenticado(`/api/tablero/items/${encodeURIComponent(itemId)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cambios, actividadTexto })
      });
      if (!res.ok) throw new Error();
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
      const res = await fetchAutenticado(`/api/tablero/items/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
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
      await Promise.all([
        fetchAutenticado(`/api/tablero/items/${encodeURIComponent(item.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orden: ordenB }) }),
        fetchAutenticado(`/api/tablero/items/${encodeURIComponent(otro.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orden: ordenA }) })
      ]);
    } catch {
      setError('No se pudo reordenar. Refrescá la página.');
    }
  }

  /* ---------------- columnas ---------------- */
  async function crearColumna(columna) {
    setColumnas((prev) => [...prev, columna]);
    try {
      const res = await fetchAutenticado('/api/tablero/columnas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(columna)
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('No se pudo crear la columna. Refrescá la página.');
    }
  }

  async function actualizarColumna(id, cambios) {
    setColumnas((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambios } : c)));
    try {
      const res = await fetchAutenticado(`/api/tablero/columnas/${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cambios)
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('No se pudo guardar la columna. Refrescá la página.');
    }
  }

  async function eliminarColumna(id) {
    if (!window.confirm('¿Eliminar esta columna? Los valores cargados en ella se van a perder.')) return;
    setColumnas((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await fetchAutenticado(`/api/tablero/columnas/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setError('No se pudo eliminar la columna. Refrescá la página.');
    }
  }

  /* ---------------- filtros ---------------- */
  const columnaEstado = useMemo(() => columnas.find((c) => c.tipo === 'status'), [columnas]);
  const columnaResponsable = useMemo(() => columnas.find((c) => c.tipo === 'person'), [columnas]);

  const itemsFiltrados = useMemo(() => items.filter((it) => {
    if (busqueda && !(it.nombre || '').toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroEstado && columnaEstado && it.cells?.[columnaEstado.id] !== filtroEstado) return false;
    if (filtroResponsable && columnaResponsable && it.cells?.[columnaResponsable.id] !== filtroResponsable) return false;
    return true;
  }), [items, busqueda, filtroEstado, filtroResponsable, columnaEstado, columnaResponsable]);

  const gruposOrdenados = useMemo(() => [...grupos].sort((a, b) => a.orden - b.orden), [grupos]);
  const itemSeleccionado = items.find((it) => it.id === itemSeleccionadoId);

  if (cargando || !usuario) return null;

  return (
    <div className="max-w-[1440px] mx-auto px-6 pb-16">
      {error && (
        <div className="mb-4 bg-dangerBg text-dangerText text-sm rounded-lg px-3 py-2 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs underline">Cerrar</button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔎 Buscar contenido…"
          className="bg-surface2 border border-border rounded-lg px-3 py-1.5 text-sm w-56"
          data-tour="tablero-buscar"
        />
        {columnaEstado && (
          <select
            value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-sm"
            data-tour="tablero-filtro-estado"
          >
            <option value="">Todos los estados</option>
            {(columnaEstado.opciones || []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        )}
        {columnaResponsable && (
          <select
            value={filtroResponsable} onChange={(e) => setFiltroResponsable(e.target.value)}
            className="bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-sm"
          >
            <option value="">Todos los responsables</option>
            {usuariosEquipo.map((u) => <option key={u.email} value={u.email}>{u.nombre}</option>)}
          </select>
        )}
        {(busqueda || filtroEstado || filtroResponsable) && (
          <button onClick={() => { setBusqueda(''); setFiltroEstado(''); setFiltroResponsable(''); }} className="text-xs text-textMuted hover:text-text underline">
            Limpiar filtros
          </button>
        )}
        <span className="text-xs text-textMuted ml-auto">{itemsFiltrados.length} de {items.length} contenidos</span>
      </div>

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
    </div>
  );
}
