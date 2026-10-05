'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../../lib/useSession';
import { useDialogos } from '../../components/Dialogos';

const inputCls = 'w-full bg-bg border border-border rounded-lg px-2.5 py-2 text-sm';
const btnCls = 'bg-gradient-to-r from-accentPurple to-accentMagenta text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50';
const btnSecCls = 'bg-transparent text-textSec border border-border rounded-lg px-3 py-1.5 text-xs';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const FORM_VACIO = {
  tipo: 'recordatorio_vencimiento', nombre: '', columnaFechaId: '', diasAntes: 2,
  columnaEstadoId: '', estadosExcluidos: [], destinatarios: '', frecuencia: 'diaria', diaSemana: 1
};

export default function AutomatizacionesPage() {
  const { confirmar } = useDialogos();
  const { usuario, cargando, fetchAutenticado } = useSession();
  const router = useRouter();
  const [columnas, setColumnas] = useState([]);
  const [automatizaciones, setAutomatizaciones] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [form, setForm] = useState(FORM_VACIO);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login');
  }, [cargando, usuario, router]);

  useEffect(() => {
    if (usuario) cargarTodo();
  }, [usuario]);

  async function cargarTodo() {
    setCargandoLista(true);
    setError('');
    try {
      const [rt, ra] = await Promise.all([
        fetchAutenticado('/api/tablero'),
        fetchAutenticado('/api/tablero/automatizaciones')
      ]);
      const [dt, da] = await Promise.all([rt.json(), ra.json()]);
      if (!rt.ok) { setError(dt.error || 'No se pudo cargar el tablero.'); return; }
      if (!ra.ok) { setError(da.error || 'No se pudo cargar la lista de automatizaciones.'); return; }
      setColumnas(dt.columnas);
      setAutomatizaciones(da.automatizaciones);
    } catch {
      setError('Error de conexión.');
    } finally {
      setCargandoLista(false);
    }
  }

  const columnasFecha = columnas.filter((c) => c.tipo === 'date');
  const columnasEstado = columnas.filter((c) => c.tipo === 'status');
  const columnaEstadoElegida = columnas.find((c) => c.id === form.columnaEstadoId);

  async function crear(e) {
    e.preventDefault();
    setError(''); setMensaje('');
    setCreando(true);
    try {
      const res = await fetchAutenticado('/api/tablero/automatizaciones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMensaje(`"${form.nombre}" creada.`);
      setForm(FORM_VACIO);
      cargarTodo();
    } catch {
      setError('Error de conexión.');
    } finally {
      setCreando(false);
    }
  }

  async function actualizar(id, cambios) {
    setError(''); setMensaje('');
    try {
      const res = await fetchAutenticado(`/api/tablero/automatizaciones/${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cambios)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      cargarTodo();
    } catch {
      setError('Error de conexión.');
    }
  }

  async function eliminar(id, nombre) {
    if (!(await confirmar({ titulo: 'Eliminar automatización', mensaje: `¿Eliminar la automatización "${nombre}"?`, textoConfirmar: 'Eliminar', peligro: true }))) return;
    setError(''); setMensaje('');
    try {
      const res = await fetchAutenticado(`/api/tablero/automatizaciones/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      cargarTodo();
    } catch {
      setError('Error de conexión.');
    }
  }

  function alternarEstadoExcluido(id) {
    setForm((f) => ({
      ...f,
      estadosExcluidos: f.estadosExcluidos.includes(id)
        ? f.estadosExcluidos.filter((x) => x !== id)
        : [...f.estadosExcluidos, id]
    }));
  }

  if (cargando || !usuario) return null;

  return (
    <div className="max-w-[900px] mx-auto px-6 pb-16 pt-10">
      <h1 className="text-xl mb-1"> Automatizaciones</h1>
      <p className="text-textSec text-sm mb-5">
        La app manda mails sola todos los días a las 8:00 (hora Argentina): recordatorios de vencimiento, o un resumen periódico. Se pueden armar varias reglas a la vez.
      </p>

      {error && <p className="text-dangerText text-sm mb-3">{error}</p>}
      {mensaje && <p className="text-successText text-sm mb-3">{mensaje}</p>}

      <div className="bg-surface2 border border-border rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3"> Nueva automatización</h2>
        <form onSubmit={crear} className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs text-textSec block mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} className={inputCls}>
                <option value="recordatorio_vencimiento">Recordatorio de vencimiento (por contenido)</option>
                <option value="resumen_periodico">Resumen periódico (un solo mail con todo)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-textSec block mb-1">Nombre</label>
              <input type="text" required placeholder="Ej: Aviso 2 días antes" value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs text-textSec block mb-1">Columna de fecha</label>
              <select value={form.columnaFechaId} onChange={(e) => setForm((f) => ({ ...f, columnaFechaId: e.target.value }))} className={inputCls}>
                <option value="">— Elegir —</option>
                {columnasFecha.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              {columnasFecha.length === 0 && <p className="text-textMuted text-[12px] mt-1">El tablero todavía no tiene ninguna columna de tipo Fecha.</p>}
            </div>
            <div>
              <label className="text-xs text-textSec block mb-1">
                {form.tipo === 'recordatorio_vencimiento' ? 'Avisar con cuántos días de anticipación' : 'Horizonte a incluir en el resumen (días)'}
              </label>
              <input type="number" min="0" value={form.diasAntes}
                onChange={(e) => setForm((f) => ({ ...f, diasAntes: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="text-xs text-textSec block mb-1">No avisar si el contenido ya está en (opcional)</label>
            <select value={form.columnaEstadoId} onChange={(e) => setForm((f) => ({ ...f, columnaEstadoId: e.target.value, estadosExcluidos: [] }))} className={inputCls}>
              <option value="">— No filtrar por estado —</option>
              {columnasEstado.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            {columnaEstadoElegida && (
              <div className="flex flex-wrap gap-2 mt-2">
                {(columnaEstadoElegida.opciones || []).map((o) => (
                  <label key={o.id} className="text-xs flex items-center gap-1.5 bg-bg border border-border rounded-full px-2.5 py-1 cursor-pointer">
                    <input type="checkbox" checked={form.estadosExcluidos.includes(o.id)} onChange={() => alternarEstadoExcluido(o.id)} />
                    <span className="w-2 h-2 rounded-full" style={{ background: o.color }} />
                    {o.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {form.tipo === 'resumen_periodico' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs text-textSec block mb-1">Frecuencia</label>
                <select value={form.frecuencia} onChange={(e) => setForm((f) => ({ ...f, frecuencia: e.target.value }))} className={inputCls}>
                  <option value="diaria">Todos los días</option>
                  <option value="semanal">Una vez por semana</option>
                </select>
              </div>
              {form.frecuencia === 'semanal' && (
                <div>
                  <label className="text-xs text-textSec block mb-1">Día</label>
                  <select value={form.diaSemana} onChange={(e) => setForm((f) => ({ ...f, diaSemana: Number(e.target.value) }))} className={inputCls}>
                    {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs text-textSec block mb-1">Destinatarios</label>
            <input type="text" required
              placeholder={form.tipo === 'recordatorio_vencimiento' ? 'responsable  —  o mails separados por coma' : 'mails separados por coma'}
              value={form.destinatarios} onChange={(e) => setForm((f) => ({ ...f, destinatarios: e.target.value }))} className={inputCls} />
            {form.tipo === 'recordatorio_vencimiento' && (
              <p className="text-textMuted text-[12px] mt-1">Escribí <b>responsable</b> para avisarle a quien esté asignado en la columna Responsable de cada contenido, o poné uno o más mails separados por coma para avisar siempre a las mismas personas.</p>
            )}
          </div>

          <button type="submit" className={btnCls} disabled={creando}>{creando ? 'Creando…' : 'Crear automatización'}</button>
        </form>
      </div>

      <h2 className="text-sm font-semibold mb-3">Automatizaciones activas ({automatizaciones.length})</h2>
      {cargandoLista ? (
        <p className="text-textSec text-sm">Cargando…</p>
      ) : automatizaciones.length === 0 ? (
        <p className="text-textMuted text-sm">Todavía no hay ninguna automatización creada.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {automatizaciones.map((a) => (
            <FilaAutomatizacion key={a.id} a={a} columnas={columnas} onActualizar={actualizar} onEliminar={eliminar} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilaAutomatizacion({ a, columnas, onActualizar, onEliminar }) {
  const columnaFecha = columnas.find((c) => c.id === a.columnaFechaId);
  const columnaEstado = columnas.find((c) => c.id === a.columnaEstadoId);
  const detalle = a.tipo === 'recordatorio_vencimiento'
    ? `Avisa ${a.diasAntes} día${a.diasAntes === 1 ? '' : 's'} antes (o si ya venció) según "${columnaFecha?.nombre || a.columnaFechaId}" → ${a.destinatarios}`
    : `Resumen ${a.frecuencia === 'semanal' ? `semanal (${DIAS_SEMANA[a.diaSemana]})` : 'diario'}${columnaFecha ? ` de "${columnaFecha.nombre}"` : ''} → ${a.destinatarios}`;

  return (
    <div className="bg-surface2 border border-border rounded-xl p-3.5">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-semibold text-sm">{a.nombre}</span>
            <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${a.activo ? 'bg-successBg text-successText' : 'bg-surface text-textMuted'}`}>
              {a.activo ? 'Activa' : 'Pausada'}
            </span>
          </div>
          <p className="text-textSec text-xs">{detalle}</p>
          {columnaEstado && (
            <p className="text-textMuted text-[12px] mt-0.5">No avisa si "{columnaEstado.nombre}" está en: {(a.estadosExcluidos || []).map((id) => columnaEstado.opciones?.find((o) => o.id === id)?.label || id).join(', ') || '—'}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className={btnSecCls} onClick={() => onActualizar(a.id, { activo: !a.activo })}>{a.activo ? 'Pausar' : 'Reactivar'}</button>
          <button className={`${btnSecCls} text-dangerText`} onClick={() => onEliminar(a.id, a.nombre)}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}
