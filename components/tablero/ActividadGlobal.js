'use client';
import { useEffect, useState } from 'react';
import { marcarPanelAbierto, marcarPanelCerrado } from '../../lib/panelAbierto';

function formatearFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function claveDia(iso) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function etiquetaDia(clave) {
  const hoy = claveDia(new Date().toISOString());
  const ayerFecha = new Date(); ayerFecha.setDate(ayerFecha.getDate() - 1);
  const ayer = claveDia(ayerFecha.toISOString());
  if (clave === hoy) return 'Hoy';
  if (clave === ayer) return 'Ayer';
  try {
    return new Date(clave).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return clave; }
}

// Un color por tipo de acción (mismo criterio en toda la app: crear/agregar = verde, editar =
// celeste, comentar = turquesa, asignar = violeta, mover/cambiar = ámbar, quitar/eliminar =
// rojo) — así de un vistazo se distingue qué pasó, sin tener que leer el texto completo.
function colorPorAccion(texto) {
  const t = (texto || '').toLowerCase();
  if (t.startsWith('creó') || t.startsWith('agregó')) return 'text-successText';
  if (t.startsWith('editó')) return 'text-infoText';
  if (t.startsWith('publicó')) return 'text-accentTeal';
  if (t.startsWith('asignó')) return 'text-accentPurple';
  if (t.startsWith('movió') || t.startsWith('cambió')) return 'text-warningText';
  if (t.startsWith('quitó') || t.startsWith('eliminó') || t.startsWith('desactivó')) return 'text-dangerText';
  return 'text-textSec';
}

// Un color por persona (siempre el mismo para el mismo nombre, calculado a partir del texto
// — no hace falta guardar nada) — así se puede seguir de un vistazo lo que hizo cada uno,
// sobre todo cuando hay varias personas activas en el mismo período.
const PALETA_AUTORES = ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24', '#60a5fa', '#4ade80', '#fb923c', '#f87171'];
function colorAutor(nombre) {
  let hash = 0;
  for (let i = 0; i < (nombre || '').length; i++) hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
  return PALETA_AUTORES[hash % PALETA_AUTORES.length];
}

// Agrupa corridas consecutivas de la misma persona haciendo exactamente lo mismo sobre el
// mismo contenido (típico al guardar varias veces seguidas probando algo) en una sola línea
// con un "×N", en vez de repetir la fila una y otra vez.
function compaginarConsecutivos(lista) {
  const resultado = [];
  for (const a of lista) {
    const anterior = resultado[resultado.length - 1];
    if (anterior && anterior.autor === a.autor && anterior.texto === a.texto && anterior.itemId === a.itemId) {
      anterior._repeticiones = (anterior._repeticiones || 1) + 1;
    } else {
      resultado.push({ ...a, _repeticiones: 1 });
    }
  }
  return resultado;
}

function ListaActividad({ actividad, items, cargando, onAbrirItem, vacioTexto }) {
  const porDia = {};
  actividad.forEach((a) => {
    const k = claveDia(a.fecha);
    (porDia[k] = porDia[k] || []).push(a);
  });
  const dias = Object.keys(porDia).sort().reverse();

  if (cargando) return <p className="text-xs text-textMuted">Cargando…</p>;
  if (!dias.length) return <p className="text-xs text-textMuted">{vacioTexto}</p>;

  return dias.map((k) => (
    <div key={k} className="mb-4">
      <p className="text-[11px] font-semibold text-textMuted uppercase tracking-wide mb-1.5">{etiquetaDia(k)}</p>
      <div className="space-y-1.5">
        {compaginarConsecutivos(porDia[k]).map((a) => {
          const item = items.find((it) => it.id === a.itemId);
          return (
            <div key={a.id} className="flex items-start gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-accentTeal mt-1.5 shrink-0" />
              <div className="flex-1">
                <span className="text-textSec">
                  <span className="font-semibold" style={{ color: colorAutor(a.autor) }}>{a.autor}</span>{' '}
                  <span className={colorPorAccion(a.texto)}>{a.texto}</span>
                  {a._repeticiones > 1 && <span className="text-textMuted"> ×{a._repeticiones}</span>}
                  {item && (
                    <>
                      {' — '}
                      <button onClick={() => onAbrirItem(item.id)} className="text-accentTeal hover:underline italic">
                        {item.nombre || '(sin nombre)'}
                      </button>
                    </>
                  )}
                </span>
                <p className="text-[10px] text-textMuted">{formatearFecha(a.fecha)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ));
}

export default function ActividadGlobal({
  actividad, items, cargando, onCerrar, onAbrirItem, usuario,
  tabInicial, sinVerGeneral, sinVerParaMi, onCambiarTab
}) {
  const [tab, setTab] = useState(tabInicial || 'paraMi');

  useEffect(() => {
    onCambiarTab?.(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Mientras este panel está abierto, el botón flotante "❓ Necesito ayuda" se oculta para
  // no superponerse con sus botones.
  useEffect(() => {
    marcarPanelAbierto();
    return () => marcarPanelCerrado();
  }, []);

  const paraMi = (actividad || []).filter((a) => (a.para || []).includes(usuario?.email));

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex-1 bg-black/50" onClick={onCerrar} />
      <div className="w-full max-w-md h-full bg-surface border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 z-10">
          <div className="flex items-center gap-2 mb-2.5">
            <p className="text-sm font-bold flex-1">🔔 Actividad del tablero</p>
            <button onClick={onCerrar} className="text-textMuted hover:text-text text-lg leading-none" title="Cerrar">✕</button>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTab('paraMi')}
              className={`relative text-xs px-2.5 py-1.5 rounded-full border font-medium transition-colors ${
                tab === 'paraMi' ? 'bg-gradient-to-r from-accentPurple to-accentMagenta text-white border-transparent' : 'bg-surface2 border-border text-textSec hover:border-accentTeal'
              }`}
            >
              Para mí
              {sinVerParaMi > 0 && (
                <span className="ml-1.5 inline-flex min-w-[15px] h-[15px] px-1 rounded-full bg-accentMagenta text-white text-[9px] font-bold items-center justify-center align-middle">{sinVerParaMi}</span>
              )}
            </button>
            <button
              onClick={() => setTab('general')}
              className={`relative text-xs px-2.5 py-1.5 rounded-full border font-medium transition-colors ${
                tab === 'general' ? 'bg-gradient-to-r from-accentPurple to-accentMagenta text-white border-transparent' : 'bg-surface2 border-border text-textSec hover:border-accentTeal'
              }`}
            >
              General
              {sinVerGeneral > 0 && (
                <span className="ml-1.5 inline-flex min-w-[15px] h-[15px] px-1 rounded-full bg-accentMagenta text-white text-[9px] font-bold items-center justify-center align-middle">{sinVerGeneral}</span>
              )}
            </button>
          </div>
        </div>
        <div className="p-4">
          {tab === 'paraMi' ? (
            <ListaActividad
              actividad={paraMi} items={items} cargando={cargando} onAbrirItem={onAbrirItem}
              vacioTexto="Nada te mencionó ni te asignó todavía — acá vas a ver cuando alguien te @mencione en un comentario o en la descripción, o te asigne como responsable."
            />
          ) : (
            <ListaActividad
              actividad={actividad} items={items} cargando={cargando} onAbrirItem={onAbrirItem}
              vacioTexto="Sin actividad registrada todavía."
            />
          )}
        </div>
      </div>
    </div>
  );
}
