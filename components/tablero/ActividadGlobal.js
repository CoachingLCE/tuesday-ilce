'use client';

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

export default function ActividadGlobal({ actividad, items, cargando, onCerrar, onAbrirItem }) {
  const porDia = {};
  actividad.forEach((a) => {
    const k = claveDia(a.fecha);
    (porDia[k] = porDia[k] || []).push(a);
  });
  const dias = Object.keys(porDia).sort().reverse();

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex-1 bg-black/50" onClick={onCerrar} />
      <div className="w-full max-w-md h-full bg-surface border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border px-4 py-3 flex items-center gap-2 z-10">
          <p className="text-sm font-bold flex-1">🔔 Actividad del tablero</p>
          <button onClick={onCerrar} className="text-textMuted hover:text-text text-lg leading-none" title="Cerrar">✕</button>
        </div>
        <div className="p-4">
          {cargando ? (
            <p className="text-xs text-textMuted">Cargando…</p>
          ) : dias.length ? (
            dias.map((k) => (
              <div key={k} className="mb-4">
                <p className="text-[11px] font-semibold text-textMuted uppercase tracking-wide mb-1.5">{etiquetaDia(k)}</p>
                <div className="space-y-1.5">
                  {porDia[k].map((a) => {
                    const item = items.find((it) => it.id === a.itemId);
                    return (
                      <div key={a.id} className="flex items-start gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-accentTeal mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <span className="text-textSec">
                            <span className="font-semibold text-text">{a.autor}</span> {a.texto}
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
            ))
          ) : (
            <p className="text-xs text-textMuted">Sin actividad registrada todavía.</p>
          )}
        </div>
      </div>
    </div>
  );
}
