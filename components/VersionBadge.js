'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { APP_VERSION, APP_UPDATED_AT } from '../lib/version';
import { CHANGELOG } from '../lib/changelog';

const CLAVE_ULTIMA_VISTA = 'ilce-tuesday-ultima-version-vista';

export default function VersionBadge() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [hayNovedades, setHayNovedades] = useState(false);
  const [verAnteriores, setVerAnteriores] = useState(false);
  const fecha = new Date(APP_UPDATED_AT + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  // Parpadea mientras la última versión vista sea distinta de la actual; al hacer clic se
  // marca como vista y se apaga solo.
  useEffect(() => {
    try {
      if (localStorage.getItem(CLAVE_ULTIMA_VISTA) !== APP_VERSION) setHayNovedades(true);
    } catch { /* ignorar */ }
  }, []);

  function abrir() {
    setAbierto(true);
    setHayNovedades(false);
    try { localStorage.setItem(CLAVE_ULTIMA_VISTA, APP_VERSION); } catch { /* ignorar */ }
  }

  if (pathname === '/confirmar-recepcion') return null;

  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const delMes = CHANGELOG.filter((e) => (e.fecha || '').slice(0, 7) === mesActual);
  const paraMostrar = verAnteriores ? CHANGELOG : (delMes.length ? delMes : CHANGELOG.slice(0, 1));
  const hayMasParaVer = !verAnteriores && paraMostrar.length < CHANGELOG.length;

  return (
    <>
      <button
        onClick={abrir}
        className={`fixed bottom-5 right-5 text-[11px] text-textMuted bg-surface2/90 border border-border rounded-full px-3 py-1 z-40 no-print hover:text-text hover:border-accentTeal transition-colors${hayNovedades ? ' version-badge-novedad' : ''}`}
        title="Ver novedades"
      >
        v{APP_VERSION} · Actualizado {fecha}
      </button>
      {abierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setAbierto(false)}>
          <div className="bg-surface2 border border-border rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold">📋 Novedades de la app</p>
              <button onClick={() => setAbierto(false)} className="text-textMuted hover:text-text">✕</button>
            </div>
            <div className="space-y-5">
              {paraMostrar.map((entrada) => (
                <div key={entrada.version}>
                  <p className="text-sm font-semibold text-accentTeal mb-1.5">
                    v{entrada.version} · {new Date(entrada.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                  <ul className="space-y-1">
                    {entrada.cambios.map((c, i) => (
                      <li key={i} className="text-textSec text-xs flex gap-2">
                        <span className="text-accentPurple">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {hayMasParaVer && (
              <button onClick={() => setVerAnteriores(true)} className="mt-4 text-xs text-accentTeal hover:underline">Ver novedades anteriores →</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
