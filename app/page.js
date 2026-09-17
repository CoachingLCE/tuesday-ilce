'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../lib/useSession';
import { tienePermisoEditarEstructura, tienePermisoReordenarGrupos } from '../lib/permisos';
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
  const [filtroTab, setFiltroTab] = useState('todos'); // id de pestaña ('todos' | 'revisar' | 'reels' | 'post' | colId:optId) | null
  const [filtroResponsables, setFiltroResponsables] = useState([]); // array de emails, o '__sin__' para "sin responsable"
  const [busquedaResponsable, setBusquedaResponsable] = useState('');

  const [itemSeleccionadoId, setItemSeleccionadoId] = useState(null);
  const [editandoColumnas, setEditandoColumnas] = useState(false);
  const [nuevoGrupoNombre, setNuevoGrupoNombre] = useState('');

  const [guardandoCount, setGuardandoCount] = useState(0);
  const [ultimoGuardado, setUltimoGuardado] = useState(null);

  const [actividadGlobal, setActividadGlobal] = useState([]);
  const [cargandoActividadGlobal, setCargandoActividadGlobal] = useState(false);
  const [mostrarActividadGlobal, setMostrarActividadGlobal] = useState(false);
  const [actividadVistaCount, setActividadVistaCount] = useState(0);

  const [cargandoEjemplo, setCargandoEjemplo] = useState(false);

  const puedeEditarEstructura = tienePermisoEditarEstructura(usuario);
  const puedeReordenarGrupos = tienePermisoReordenarGrupos(usuario);
  const [grupoArrastradoId, setGrupoArrastradoId] = useState(null);

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

      // Tablero recién creado (sin columnas ni grupos): se carga un ejemplo armado para
      // que se vea y se pueda probar de entrada, en vez de una pantalla vacía. Solo pasa
      // una vez — apenas exista una columna o un grupo, esto no se vuelve a disparar.
      if (!(dataTablero.grupos || []).length && !(dataTablero.columnas || []).length) {
        await sembrarTableroDeEjemplo();
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setCargandoTablero(false);
    }
  }

  // Carga el mismo calendario de contenidos de ejemplo que se usó para probar el diseño
  // (columnas, grupos y 7 contenidos), con las mismas personas/colores/fechas relativas.
  async function sembrarTableroDeEjemplo() {
    const colTipo = {
      id: 'col_tipo_ilce', nombre: 'Tipo', tipo: 'status', orden: 0,
      opciones: [
        { id: 'reel', label: 'Reel', color: '#4c6fff' },
        { id: 'carrusel', label: 'Carrusel', color: '#a25ddc' },
        { id: 'story', label: 'Story', color: '#00c2ce' },
        { id: 'post', label: 'Post', color: '#ffcb00' },
        { id: 'video', label: 'Video', color: '#e2445c' },
        { id: 'otro', label: 'Otro', color: '#808094' }
      ]
    };
    const colEstado = {
      id: 'col_estado_ilce', nombre: 'Estado', tipo: 'status', orden: 1,
      opciones: [
        { id: 'hacer', label: 'Hacer', color: '#808094' },
        { id: 'proceso', label: 'En proceso', color: '#fdab3d' },
        { id: 'pausado', label: 'Pausado', color: '#e2445c' },
        { id: 'corregir', label: 'Corregir', color: '#a25ddc' },
        { id: 'subir', label: 'Subir', color: '#4c6fff' },
        { id: 'listo', label: 'Listo', color: '#00c875' }
      ]
    };
    const colResponsable = { id: 'col_responsable_ilce', nombre: 'Responsable', tipo: 'person', orden: 2, opciones: [] };
    const colFecha = { id: 'col_fecha_ilce', nombre: 'Fecha', tipo: 'date', orden: 3, opciones: [] };
    const colArchivos = { id: 'col_archivos_ilce', nombre: 'Archivos', tipo: 'file', orden: 4, opciones: [] };

    await crearColumna(colTipo);
    await crearColumna(colEstado);
    await crearColumna(colResponsable);
    await crearColumna(colFecha);
    await crearColumna(colArchivos);

    await guardarGrupoNuevo({ id: 'gr_septiembre_ilce', nombre: 'Septiembre', color: '#e2445c', orden: 0 });
    await guardarGrupoNuevo({ id: 'gr_agosto_ilce', nombre: 'Agosto', color: '#5b5fef', orden: 1 });

    // Las 4 personas de ejemplo tienen que existir como Usuarios reales (con email) para
    // que el selector de Responsable las pueda mostrar — se crean si todavía no están.
    const personasEjemplo = [
      { nombre: 'Jenn', email: 'jennifer.rebasti@institutoilce.com' },
      { nombre: 'Giuli', email: 'giuliana@institutoilce.com' },
      { nombre: 'Valu', email: 'valentina@institutoilce.com' },
      { nombre: 'Diego', email: 'diego@institutoilce.com' }
    ];
    for (const p of personasEjemplo) {
      const yaExiste = usuariosEquipo.some((u) => u.email.toLowerCase() === p.email.toLowerCase());
      if (!yaExiste) {
        // eslint-disable-next-line no-await-in-loop
        await crearPersona(p.nombre, p.email);
      }
    }

    const ahora = Date.now();
    const dia = 86400000;
    const fechaHaceDias = (dias) => new Date(ahora - dias * dia).toISOString().slice(0, 10);

    const item = (id, grupoId, nombre, orden, tipo, estado, responsable, offsetDias, body, archivos) => ({
      id, grupoId, nombre, orden,
      cells: {
        [colTipo.id]: tipo, [colEstado.id]: estado, [colResponsable.id]: responsable,
        [colFecha.id]: fechaHaceDias(offsetDias), [colArchivos.id]: archivos || []
      },
      body: body || '', creadoPor: 'Ejemplo', creadoEn: new Date().toISOString()
    });

    const itemsEjemplo = [
      item('it_ilce_1', 'gr_agosto_ilce', 'Reel Diego efecto Florida', 0, 'reel', 'listo', 'giuliana@institutoilce.com', 30,
        '<p>En 1996, John Bargh le dio a un grupo de personas una tarea simple: armar oraciones con palabras como "lento", "arrugas", "olvidadizo".</p><p>Después midió cuánto tardaban en caminar por un pasillo.</p><p>Portada: <b>Efecto Florida</b></p>',
        [{ id: 'f_ilce_1', kind: 'link', name: '8_EFECTO_FLORIDA.mp4 (Drive)', url: 'https://drive.google.com/file/d/1c235L3LB460lF65MZFqCXwl9uU_2bi7F/view' }]
      ),
      item('it_ilce_2', 'gr_agosto_ilce', 'Testimonios con diplomas', 1, 'carrusel', 'listo', 'valentina@institutoilce.com', 24,
        '<p>Carrusel con foto de diploma + frase del alumno.</p>', []
      ),
      item('it_ilce_3', 'gr_agosto_ilce', 'ST ebook ontológico', 2, 'post', 'proceso', 'jennifer.rebasti@institutoilce.com', 5, '', []),
      item('it_ilce_4', 'gr_agosto_ilce', 'Nunca creí en el coaching', 3, 'video', 'listo', 'valentina@institutoilce.com', 20,
        '<p>Testimonio en cámara, edición dinámica con subtítulos grandes.</p>', []
      ),
      item('it_ilce_5', 'gr_agosto_ilce', 'Lanzamiento coaching inmobiliario reel', 4, 'reel', 'listo', 'diego@institutoilce.com', 35, '', []),
      item('it_ilce_6', 'gr_septiembre_ilce', 'Ebook deportivo', 0, 'post', 'corregir', 'jennifer.rebasti@institutoilce.com', -2, '', []),
      item('it_ilce_7', 'gr_septiembre_ilce', 'Invitación docentes casos reales', 1, 'story', 'hacer', 'giuliana@institutoilce.com', -4, '', [])
    ];
    for (const it of itemsEjemplo) {
      // eslint-disable-next-line no-await-in-loop
      await guardarItemNuevo(it);
    }
  }

  // El ejemplo automático (arriba) solo se dispara con el tablero totalmente vacío. Este
  // botón hace lo mismo a demanda, sin borrar nada de lo que ya haya cargado — para
  // tableros que ya tienen columnas o grupos propios y quieren sumar igual el ejemplo.
  const ejemploYaCargado = columnas.some((c) => c.id === 'col_estado_ilce');
  async function cargarEjemploManual() {
    if (ejemploYaCargado || cargandoEjemplo) return;
    if (!window.confirm('Esto agrega el calendario de contenidos de ejemplo (5 columnas, 2 grupos "Septiembre"/"Agosto" y 7 contenidos) sin borrar nada de lo que ya tenés cargado. ¿Continuar?')) return;
    setCargandoEjemplo(true);
    try {
      await sembrarTableroDeEjemplo();
    } finally {
      setCargandoEjemplo(false);
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
  async function guardarGrupoNuevo(grupo) {
    setGrupos((prev) => [...prev, grupo]);
    try {
      await conIndicadorGuardado(async () => {
        const res = await fetchAutenticado('/api/tablero/grupos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(grupo)
        });
        if (!res.ok) throw new Error();
      });
    } catch {
      setError('No se pudo crear el grupo. Refrescá la página.');
    }
  }

  async function crearGrupo(nombre) {
    const usados = grupos.map((g) => g.color);
    const id = nuevoId('gr');
    const color = colorSiguiente(usados);
    const orden = grupos.length;
    await guardarGrupoNuevo({ id, nombre, color, orden });
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

  // Reordenar grupos arrastrando (Super Admin): mueve el grupo soltado a la posición del
  // grupo destino y reacomoda el resto, persistiendo el nuevo "orden" de cada uno que cambió.
  function soltarGrupoSobre(grupoDestinoId) {
    const origenId = grupoArrastradoId;
    setGrupoArrastradoId(null);
    if (!origenId || origenId === grupoDestinoId) return;
    const ordenActual = [...grupos].sort((a, b) => a.orden - b.orden);
    const idxOrigen = ordenActual.findIndex((g) => g.id === origenId);
    const idxDestino = ordenActual.findIndex((g) => g.id === grupoDestinoId);
    if (idxOrigen === -1 || idxDestino === -1) return;
    const [movido] = ordenActual.splice(idxOrigen, 1);
    ordenActual.splice(idxDestino, 0, movido);
    const cambiados = ordenActual
      .map((g, i) => ({ id: g.id, orden: i, ordenAnterior: g.orden }))
      .filter((g) => g.orden !== g.ordenAnterior);
    setGrupos((prev) => prev.map((g) => {
      const nuevo = cambiados.find((c) => c.id === g.id);
      return nuevo ? { ...g, orden: nuevo.orden } : g;
    }));
    cambiados.forEach(({ id, orden }) => actualizarGrupo(id, { orden }));
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
  async function guardarItemNuevo(item) {
    setItems((prev) => [...prev, item]);
    try {
      await conIndicadorGuardado(async () => {
        const res = await fetchAutenticado('/api/tablero/items', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        if (!res.ok) throw new Error();
      });
    } catch {
      setError('No se pudo crear el contenido. Refrescá la página.');
    }
  }

  async function crearItem(grupoId, nombre) {
    const id = nuevoId('it');
    const orden = items.filter((it) => it.grupoId === grupoId).length;
    await guardarItemNuevo({ id, grupoId, nombre, orden, cells: {}, body: '', creadoPor: usuario.nombre, creadoEn: new Date().toISOString() });
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
  // Columna de tipo Estado llamada justo "Estado": gobierna los "chips" de filtro rápido
  // (si no hay ninguna con ese nombre, se usa la primera columna de tipo Estado que haya).
  const columnaEstado = useMemo(() => (
    columnas.find((c) => c.tipo === 'status' && (c.nombre || '').trim().toLowerCase() === 'estado')
    || columnas.find((c) => c.tipo === 'status')
  ), [columnas]);
  // Columna de tipo Estado llamada "Tipo": junto con "Estado" arma las Pestañas fijas
  // (Todos / Para revisar / Reels / Post), igual que en el diseño de referencia.
  const columnaTipo = useMemo(() => columnas.find((c) => c.tipo === 'status' && c.id !== columnaEstado?.id && (c.nombre || '').trim().toLowerCase() === 'tipo'), [columnas, columnaEstado]);
  const columnaResponsable = useMemo(() => columnas.find((c) => c.tipo === 'person'), [columnas]);

  // Un contenido puede tener uno o varios responsables (array de emails); sigue aceptando
  // el formato viejo (un email suelto) para no romper contenidos ya cargados.
  function responsablesDeItem(it) {
    if (!columnaResponsable) return [];
    const v = it.cells?.[columnaResponsable.id];
    return Array.isArray(v) ? v : (v ? [v] : []);
  }

  function idDeOpcion(columna, patron) {
    const op = (columna?.opciones || []).find((o) => patron.test((o.label || '').toLowerCase()) || patron.test((o.id || '').toLowerCase()));
    return op?.id;
  }

  // Pestañas fijas: solo aparecen si el tablero tiene columnas "Estado" y/o "Tipo".
  const pestanas = useMemo(() => {
    if (!columnaEstado && !columnaTipo) return null;
    const corregirId = idDeOpcion(columnaEstado, /corregir/);
    const subirId = idDeOpcion(columnaEstado, /subir/);
    const reelId = idDeOpcion(columnaTipo, /reel/);
    const postId = idDeOpcion(columnaTipo, /^post$/);
    return [
      { id: 'todos', label: 'Todos', test: () => true },
      { id: 'revisar', label: 'Para revisar', test: (it) => !!columnaEstado && (it.cells?.[columnaEstado.id] === corregirId || it.cells?.[columnaEstado.id] === subirId) },
      { id: 'reels', label: 'Reels', test: (it) => !!columnaTipo && it.cells?.[columnaTipo.id] === reelId },
      { id: 'post', label: 'Post', test: (it) => !!columnaTipo && it.cells?.[columnaTipo.id] === postId }
    ];
  }, [columnaEstado, columnaTipo]);

  // Pool base: solo búsqueda + responsable — sirve para calcular los contadores de chips/pestañas.
  const poolBase = useMemo(() => items.filter((it) => {
    if (busqueda && !(it.nombre || '').toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroResponsables.length && columnaResponsable) {
      const asignados = responsablesDeItem(it);
      const coincide = filtroResponsables.some((f) => (f === '__sin__' ? asignados.length === 0 : asignados.includes(f)));
      if (!coincide) return false;
    }
    return true;
  }), [items, busqueda, filtroResponsables, columnaResponsable]);

  const poolTrasChip = useMemo(() => poolBase.filter((it) => {
    if (filtroEstado && columnaEstado && it.cells?.[columnaEstado.id] !== filtroEstado) return false;
    return true;
  }), [poolBase, filtroEstado, columnaEstado]);

  const itemsFiltrados = useMemo(() => poolTrasChip.filter((it) => {
    if (!pestanas || !filtroTab || filtroTab === 'todos') return true;
    const tab = pestanas.find((t) => t.id === filtroTab);
    return tab ? tab.test(it) : true;
  }), [poolTrasChip, filtroTab, pestanas]);

  // Pools sin el filtro de responsable (pero con búsqueda/estado/pestaña) — para que el
  // contador de cada chip de responsable refleje "si eligiera este, combinado con lo demás".
  const poolBaseSinResponsable = useMemo(() => items.filter((it) => {
    if (busqueda && !(it.nombre || '').toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  }), [items, busqueda]);

  const poolTrasChipSinResponsable = useMemo(() => poolBaseSinResponsable.filter((it) => {
    if (filtroEstado && columnaEstado && it.cells?.[columnaEstado.id] !== filtroEstado) return false;
    return true;
  }), [poolBaseSinResponsable, filtroEstado, columnaEstado]);

  const poolParaContarResponsables = useMemo(() => poolTrasChipSinResponsable.filter((it) => {
    if (!pestanas || !filtroTab || filtroTab === 'todos') return true;
    const tab = pestanas.find((t) => t.id === filtroTab);
    return tab ? tab.test(it) : true;
  }), [poolTrasChipSinResponsable, filtroTab, pestanas]);

  const opcionesResponsable = useMemo(() => {
    if (!columnaResponsable) return [];
    const sinResponsable = poolParaContarResponsables.filter((it) => responsablesDeItem(it).length === 0).length;
    const personas = usuariosEquipo
      .map((u) => ({ ...u, cantidad: poolParaContarResponsables.filter((it) => responsablesDeItem(it).includes(u.email)).length }))
      .filter((u) => u.cantidad > 0 || filtroResponsables.includes(u.email));
    const resultado = [...personas];
    if (sinResponsable > 0 || filtroResponsables.includes('__sin__')) {
      resultado.push({ email: '__sin__', nombre: 'Sin responsable', cantidad: sinResponsable });
    }
    return resultado;
  }, [columnaResponsable, poolParaContarResponsables, usuariosEquipo, filtroResponsables]);

  const opcionesResponsableVisibles = useMemo(() => {
    if (!busquedaResponsable.trim()) return opcionesResponsable;
    return opcionesResponsable.filter((o) => o.nombre.toLowerCase().includes(busquedaResponsable.toLowerCase()));
  }, [opcionesResponsable, busquedaResponsable]);

  function alternarFiltroResponsable(email) {
    setFiltroResponsables((prev) => (prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]));
  }

  // Desglose por estado para la barra de estadísticas — sobre el resultado final visible.
  const desgloseEstado = useMemo(() => {
    if (!columnaEstado) return [];
    return (columnaEstado.opciones || []).map((o) => ({
      ...o, cantidad: itemsFiltrados.filter((it) => it.cells?.[columnaEstado.id] === o.id).length
    })).filter((o) => o.cantidad > 0);
  }, [columnaEstado, itemsFiltrados]);

  const gruposOrdenados = useMemo(() => [...grupos].sort((a, b) => a.orden - b.orden), [grupos]);
  const itemSeleccionado = items.find((it) => it.id === itemSeleccionadoId);
  const hayFiltrosActivos = busqueda || filtroEstado || (filtroTab && filtroTab !== 'todos') || filtroResponsables.length > 0;
  const actividadHoy = actividadGlobal.filter((a) => (a.fecha || '').slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  // Mientras el panel de actividad está abierto, lo damos por "visto" — el número del
  // 🔔 solo cuenta lo que pasó desde la última vez que se abrió.
  useEffect(() => {
    if (mostrarActividadGlobal) setActividadVistaCount(actividadHoy);
  }, [mostrarActividadGlobal, actividadHoy]);
  const actividadSinVer = Math.max(0, actividadHoy - actividadVistaCount);

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
        {hayFiltrosActivos && (
          <button onClick={() => { setBusqueda(''); setFiltroEstado(''); setFiltroTab('todos'); setFiltroResponsables([]); setBusquedaResponsable(''); }} className="text-xs text-textMuted hover:text-text underline">
            Limpiar filtros
          </button>
        )}
        {puedeEditarEstructura && !ejemploYaCargado && (
          <button
            onClick={cargarEjemploManual}
            disabled={cargandoEjemplo}
            className="text-xs text-accentTeal hover:underline disabled:opacity-50"
            title="Agrega columnas, grupos y contenidos de ejemplo sin borrar lo que ya tenés"
          >
            {cargandoEjemplo ? 'Cargando ejemplo…' : '🧪 Cargar contenido de ejemplo'}
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
            {actividadSinVer > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-accentMagenta text-white text-[10px] font-bold flex items-center justify-center">
                {actividadSinVer}
              </span>
            )}
          </button>
        </div>
      </div>

      {pestanas && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5 border-b border-border pb-2.5" data-tour="tablero-tabs">
          {pestanas.map((t) => {
            const activo = (filtroTab || 'todos') === t.id;
            const cantidad = poolTrasChip.filter((it) => t.test(it)).length;
            return (
              <button
                key={t.id}
                onClick={() => setFiltroTab(t.id)}
                className={`h-7 px-3 rounded-lg text-xs font-semibold ${activo ? 'bg-gradient-to-r from-accentPurple to-accentMagenta text-white' : 'bg-surface2 text-textSec hover:text-text'}`}
              >
                {t.label} <span className="opacity-70">{cantidad}</span>
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

      {columnaResponsable && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3" data-tour="tablero-filtro-responsable">
          <button
            onClick={() => setFiltroResponsables([])}
            className={`h-6 px-2.5 rounded-full text-[11px] font-medium border ${!filtroResponsables.length ? 'border-text' : 'border-border'} bg-surface2 hover:border-text`}
          >
            Todos <span className="text-textMuted">{poolParaContarResponsables.length}</span>
          </button>
          {usuariosEquipo.length > 8 && (
            <input
              value={busquedaResponsable} onChange={(e) => setBusquedaResponsable(e.target.value)}
              placeholder="🔎 responsable…" className="h-6 bg-surface2 border border-border rounded-full px-2.5 text-[11px] w-32 outline-none"
            />
          )}
          {opcionesResponsableVisibles.map((o) => {
            const activo = filtroResponsables.includes(o.email);
            return (
              <button
                key={o.email}
                onClick={() => alternarFiltroResponsable(o.email)}
                className={`h-6 pl-1 pr-2.5 rounded-full text-[11px] font-medium flex items-center gap-1 border ${activo ? 'border-text' : 'border-border'} bg-surface2 hover:border-text`}
              >
                <span className="w-4 h-4 rounded-full bg-accentPurple text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                  {o.email === '__sin__' ? '—' : o.nombre.slice(0, 1).toUpperCase()}
                </span>
                {o.nombre} <span className="text-textMuted">{o.cantidad}</span>
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
              puedeReordenarGrupos={puedeReordenarGrupos}
              arrastrando={grupoArrastradoId === grupo.id}
              onIniciarArrastre={() => setGrupoArrastradoId(grupo.id)}
              onTerminarArrastre={() => setGrupoArrastradoId(null)}
              onSoltarSobre={(e) => { e.preventDefault(); soltarGrupoSobre(grupo.id); }}
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
