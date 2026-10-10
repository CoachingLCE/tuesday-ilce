'use client';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../../lib/useSession';
import { tienePermisoAuditoria } from '../../lib/permisos';
import AccesoDenegado from '../../components/AccesoDenegado';
import { etiquetaMes, siguienteMes } from '../../lib/historialMeses';

const boxCls = 'bg-surface2 border border-border rounded-2xl p-5 mb-4';
const inputCls = 'bg-bg border border-border rounded-lg px-2.5 py-2 text-sm';
// El color del ícono nativo de <input type="date"> ya lo resuelve "color-scheme" en
// globals.css según el tema activo — no hace falta forzarlo ni invertirlo acá.
const inputFechaCls = inputCls;

// Colores distintos por persona, para reconocerla rápido en la lista sin leer el nombre —
// el mismo nombre siempre cae en el mismo color (hash simple sobre una paleta fija).
const PALETA_USUARIOS = [
  { bg: 'bg-accentPurple/20', text: 'text-accentPurpleTxt' },
  { bg: 'bg-accentTeal/20', text: 'text-accentTeal' },
  { bg: 'bg-successBg', text: 'text-successText' },
  { bg: 'bg-warningBg', text: 'text-warningText' },
  { bg: 'bg-infoBg', text: 'text-infoText' },
  { bg: 'bg-dangerBg', text: 'text-dangerText' },
  { bg: 'bg-accentMagenta/20', text: 'text-accentMagenta' }
];
function colorPorUsuario(nombre) {
  if (!nombre) return PALETA_USUARIOS[0];
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = (hash * 31 + nombre.charCodeAt(i)) % 997;
  return PALETA_USUARIOS[hash % PALETA_USUARIOS.length];
}

function exportarCSV(registros) {
  const filas = [['Fecha', 'Usuario', 'Accion', 'Detalle']].concat(
    registros.map((r) => [
      new Date(r.fecha).toLocaleString('es-AR', { hour12: false }),
      r.usuario || '', r.accion || '', (r.detalle || '').replace(/\n/g, ' ')
    ])
  );
  const csv = filas.map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `historial-acciones-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditoriaPage() {
  const { usuario, cargando, fetchAutenticado } = useSession();
  const router = useRouter();

  const [registros, setRegistros] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  // Historial mes a mes: se carga el mes actual y "Ver más" abre el anterior. Con filtros o una búsqueda se mira TODO (de cualquier mes).
  const [meses, setMeses] = useState([]);                 // [{ mes: '2026-10', n: 120 }] meses con movimientos
  const [mesesCargados, setMesesCargados] = useState([]);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [totalServidor, setTotalServidor] = useState(0);
  const [truncado, setTruncado] = useState(false);
  const modoTodo = !!(filtroUsuario || desde || hasta || busqueda.trim());
  const cargaRef = useRef(0); // si se piden dos cargas seguidas (escribir y borrar rápido), solo vale la última: la lenta no pisa a la nueva

  const puedeVer = tienePermisoAuditoria(usuario);

  useEffect(() => { if (!cargando && !usuario) router.push('/login'); }, [cargando, usuario, router]);

  useEffect(() => {
    if (!usuario || !puedeVer) return;
    cargar();
  }, [usuario, filtroUsuario, desde, hasta, modoTodo]);

  async function cargar() {
    const mia = ++cargaRef.current;
    setCargandoDatos(true);
    setErrorCarga('');
    const params = new URLSearchParams();
    if (filtroUsuario) params.set('usuario', filtroUsuario);
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    if (modoTodo) params.set('todo', '1');
    try {
      const res = await fetchAutenticado(`/api/historial?${params.toString()}`);
      const r = await res.json();
      if (mia !== cargaRef.current) return;
      if (!res.ok || r.error) { setErrorCarga(r.error || 'No se pudo cargar el historial.'); setRegistros([]); }
      else {
        setRegistros(r.historial || []);
        setMeses(r.meses || []); setMesesCargados(r.mes ? [r.mes] : []);
        setUsuariosLista(r.usuarios || []); setTotalServidor(r.total || 0); setTruncado(!!r.truncado);
      }
    } catch {
      if (mia !== cargaRef.current) return;
      setErrorCarga('No se pudo conectar con el servidor.');
      setRegistros([]);
    }
    if (mia === cargaRef.current) setCargandoDatos(false);
  }

  async function verMas() {
    const sig = siguienteMes(meses, mesesCargados);
    if (!sig || cargandoMas) return;
    const mia = cargaRef.current;
    setCargandoMas(true);
    try {
      const res = await fetchAutenticado(`/api/historial?mes=${encodeURIComponent(sig.mes)}`);
      const r = await res.json();
      if (mia !== cargaRef.current) { setCargandoMas(false); return; } // mientras tanto cambió el filtro: este mes ya no corresponde
      if (res.ok && !r.error) {
        setRegistros((prev) => [...prev, ...(r.historial || [])]);
        setMesesCargados((prev) => [...prev, sig.mes]);
      } else setErrorCarga(r.error || 'No se pudo cargar el mes anterior.');
    } catch { setErrorCarga('No se pudo conectar con el servidor.'); }
    setCargandoMas(false);
  }

  const usuariosUnicos = useMemo(() => (usuariosLista.length ? usuariosLista : [...new Set(registros.map((r) => r.usuario).filter(Boolean))].sort()), [usuariosLista, registros]);
  const registrosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return registros;
    const q = busqueda.trim().toLowerCase();
    return registros.filter((r) => `${r.usuario} ${r.accion} ${r.detalle}`.toLowerCase().includes(q));
  }, [registros, busqueda]);

  if (cargando || !usuario) return null;

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
      {!puedeVer ? (
        <AccesoDenegado seccion="Historial de cambios" />
      ) : (
        <>
          <h1 className="text-xl mb-1">Historial de cambios</h1>
          <p className="text-textSec text-sm mb-4">Historial de acciones registradas por el equipo en la app (reservas, postergaciones, ediciones, altas y bajas de usuarios, etc.).</p>

          <div className="flex items-end gap-3 flex-wrap mb-4">
            <div>
              <label className="text-xs text-textSec block mb-1">Usuario</label>
              <select value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} className={inputCls}>
                <option value="">Todos</option>
                {usuariosUnicos.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-textSec block mb-1">Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} onClick={(e) => e.target.showPicker?.()} className={inputFechaCls} />
            </div>
            <div>
              <label className="text-xs text-textSec block mb-1">Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} onClick={(e) => e.target.showPicker?.()} className={inputFechaCls} />
            </div>
            <div>
              <label className="text-xs text-textSec block mb-1">Buscar</label>
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder=" Usuario, acción o detalle…" className={`${inputCls} w-64`} />
            </div>
            <button onClick={() => exportarCSV(registrosFiltrados)} disabled={registrosFiltrados.length === 0}
              className="bg-surface2 border border-border rounded-lg px-4 py-2 text-sm disabled:opacity-40">
               Exportar a CSV
            </button>
          </div>

          <div className={boxCls}>
            {errorCarga ? (
              <div className="text-center py-6">
                <p className="text-dangerText text-sm font-semibold mb-3"> {errorCarga}</p>
                <button onClick={cargar} className="boton boton-solido bg-accentPurple text-white">Reintentar</button>
              </div>
            ) : cargandoDatos ? (
              <p className="text-textSec text-sm">Cargando…</p>
            ) : registrosFiltrados.length === 0 ? (
              <p className="vacio">Sin registros para este filtro.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-textSec text-left border-b border-border">
                      <th className="py-2 pr-3">Fecha</th><th className="pr-3">Usuario</th><th className="pr-3">Acción</th><th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosFiltrados.map((r, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="py-2 pr-3 whitespace-nowrap text-textMuted text-xs">{new Date(r.fecha).toLocaleString('es-AR', { hour12: false })}</td>
                        <td className="pr-3 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorPorUsuario(r.usuario).bg} ${colorPorUsuario(r.usuario).text}`}>
                            {r.usuario || '—'}
                          </span>
                        </td>
                        <td className="pr-3 whitespace-nowrap">{r.accion}</td>
                        <td className="text-textSec">{r.detalle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!errorCarga && !cargandoDatos && (() => {
              const sig = modoTodo ? null : siguienteMes(meses, mesesCargados);
              return (
                <div className="flex flex-col items-center gap-2 mt-5 no-print" aria-live="polite">
                  {modoTodo ? (
                    <p className="text-textMuted text-[12px]">Mostrando todos los meses, porque hay un filtro o una búsqueda activa.{truncado ? ` Se muestran los 2000 más recientes de ${totalServidor}: acotá por fechas para ver el resto.` : ''}</p>
                  ) : (
                    <>
                      <p className="text-textMuted text-[12px]">Mostrando {mesesCargados.length ? [...mesesCargados].sort().reverse().map(etiquetaMes).join(', ') : 'el historial'}.</p>
                      {sig ? (
                        <button onClick={verMas} disabled={cargandoMas} className="boton bg-surface2 border border-border disabled:opacity-60">
                          {cargandoMas ? 'Cargando…' : `Ver más · ${etiquetaMes(sig.mes)} (${sig.n})`}
                        </button>
                      ) : meses.length > 0 && <p className="text-textMuted text-[12px]">No hay movimientos más antiguos.</p>}
                    </>
                  )}
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
