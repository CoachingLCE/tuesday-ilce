'use client';
import { useMemo, useState } from 'react';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function isoDeHoy() {
  return new Date().toISOString().slice(0, 10);
}

// Arma la grilla de un mes (siempre semanas completas, empezando en lunes) — un array de
// arrays de 7 fechas ISO ('' para los días que no pertenecen al mes, para dejar el hueco).
function grillaDelMes(anio, mes) {
  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);
  const offsetInicio = (primerDia.getDay() + 6) % 7; // 0 = lunes
  const dias = [];
  for (let i = 0; i < offsetInicio; i++) dias.push('');
  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const iso = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dias.push(iso);
  }
  while (dias.length % 7 !== 0) dias.push('');
  const semanas = [];
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
  return semanas;
}

export default function VistaCalendario({ items, grupos, columnaFecha, columnaEstado, onAbrirItem }) {
  const hoy = isoDeHoy();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { anio: d.getFullYear(), mes: d.getMonth() }; });

  const gruposPorId = useMemo(() => new Map(grupos.map((g) => [g.id, g])), [grupos]);

  const itemsPorFecha = useMemo(() => {
    const mapa = new Map();
    const sinFecha = [];
    for (const it of items) {
      const fecha = columnaFecha ? it.cells?.[columnaFecha.id] : '';
      if (!fecha) { sinFecha.push(it); continue; }
      if (!mapa.has(fecha)) mapa.set(fecha, []);
      mapa.get(fecha).push(it);
    }
    return { mapa, sinFecha };
  }, [items, columnaFecha]);

  const semanas = useMemo(() => grillaDelMes(cursor.anio, cursor.mes), [cursor]);

  function irA(delta) {
    setCursor((c) => {
      const d = new Date(c.anio, c.mes + delta, 1);
      return { anio: d.getFullYear(), mes: d.getMonth() };
    });
  }

  if (!columnaFecha) {
    return <p className="text-sm text-textMuted">Este tablero todavía no tiene una columna de tipo Fecha — agregá una para poder usar la vista calendario.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => irA(-1)} className="w-7 h-7 rounded-lg bg-surface2 border border-border hover:border-accentTeal text-sm">‹</button>
        <p className="text-sm font-semibold w-36 text-center">{MESES[cursor.mes]} {cursor.anio}</p>
        <button onClick={() => irA(1)} className="w-7 h-7 rounded-lg bg-surface2 border border-border hover:border-accentTeal text-sm">›</button>
        <button
          onClick={() => { const d = new Date(); setCursor({ anio: d.getFullYear(), mes: d.getMonth() }); }}
          className="text-xs text-accentTeal hover:underline ml-1"
        >
          Hoy
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DIAS.map((d) => (
          <div key={d} className="text-[11px] font-semibold text-textMuted text-center py-1">{d}</div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {semanas.map((semana, i) => (
          <div key={i} className="grid grid-cols-7 gap-1.5">
            {semana.map((iso, j) => {
              const itemsDelDia = iso ? (itemsPorFecha.mapa.get(iso) || []) : [];
              const esHoy = iso === hoy;
              return (
                <div
                  key={j}
                  className={`min-h-[92px] rounded-lg border p-1.5 ${iso ? 'bg-surface2 border-border' : 'bg-transparent border-transparent'} ${esHoy ? 'ring-2 ring-accentTeal' : ''}`}
                >
                  {iso && (
                    <>
                      <p className={`text-[10.5px] mb-1 ${esHoy ? 'text-accentTeal font-bold' : 'text-textMuted'}`}>{parseInt(iso.slice(8, 10), 10)}</p>
                      <div className="flex flex-col gap-1">
                        {itemsDelDia.slice(0, 3).map((it) => {
                          const grupo = gruposPorId.get(it.grupoId);
                          const estadoOpcion = columnaEstado ? (columnaEstado.opciones || []).find((o) => o.id === it.cells?.[columnaEstado.id]) : null;
                          return (
                            <button
                              key={it.id}
                              onClick={() => onAbrirItem(it.id)}
                              title={it.nombre}
                              className="text-left text-[10.5px] leading-tight rounded px-1.5 py-1 truncate hover:opacity-80"
                              style={{ background: estadoOpcion?.color || grupo?.color || '#808094', color: 'white' }}
                            >
                              {it.nombre}
                            </button>
                          );
                        })}
                        {itemsDelDia.length > 3 && (
                          <span className="text-[10px] text-textMuted px-1.5">+{itemsDelDia.length - 3} más</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {itemsPorFecha.sinFecha.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-textMuted mb-1.5">Sin fecha ({itemsPorFecha.sinFecha.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {itemsPorFecha.sinFecha.map((it) => {
              const grupo = gruposPorId.get(it.grupoId);
              return (
                <button
                  key={it.id}
                  onClick={() => onAbrirItem(it.id)}
                  className="text-[11px] rounded-full px-2.5 py-1 border border-border bg-surface2 hover:border-accentTeal"
                  style={{ borderLeft: `3px solid ${grupo?.color || '#808094'}` }}
                >
                  {it.nombre}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
