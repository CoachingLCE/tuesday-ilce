'use client';
import { useEffect, useRef, useState } from 'react';
import Celda from './Celda';
import { PALETA_COLORES } from '../../lib/paletaTablero';

export default function GrupoTabla({
  grupo, columnas, items, usuariosEquipo, puedeEditarEstructura,
  onRenombrarGrupo, onRecolorearGrupo, onEliminarGrupo,
  onCrearItem, onActualizarCelda, onAbrirItem, onMoverItem, onEliminarItem, onAbrirEditorColumnas,
  onCrearPersona
}) {
  const [colapsado, setColapsado] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombre, setNombre] = useState(grupo.nombre);
  const [colorAbierto, setColorAbierto] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const colorRef = useRef(null);

  useEffect(() => { setNombre(grupo.nombre); }, [grupo.nombre]);
  useEffect(() => {
    function onClick(e) { if (colorRef.current && !colorRef.current.contains(e.target)) setColorAbierto(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function guardarNombre() {
    setEditandoNombre(false);
    if (nombre.trim() && nombre !== grupo.nombre) onRenombrarGrupo(nombre.trim());
    else setNombre(grupo.nombre);
  }

  function crear(e) {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    onCrearItem(nuevoNombre.trim());
    setNuevoNombre('');
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface overflow-hidden" data-tour="tablero-grupo">
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderLeft: `4px solid ${grupo.color}` }}>
        <button onClick={() => setColapsado((v) => !v)} className="text-textMuted hover:text-text text-xs w-5">
          {colapsado ? '▸' : '▾'}
        </button>
        <div className="relative" ref={colorRef}>
          <button onClick={() => setColorAbierto((v) => !v)} className="w-4 h-4 rounded-full shrink-0" style={{ background: grupo.color }} title="Cambiar color" />
          {colorAbierto && (
            <div className="absolute z-20 top-full left-0 mt-1 bg-surface2 border border-border rounded-lg shadow-xl p-2 flex flex-wrap gap-1.5 w-40">
              {PALETA_COLORES.map((c) => (
                <button key={c} onClick={() => { onRecolorearGrupo(c); setColorAbierto(false); }} className="w-5 h-5 rounded-full" style={{ background: c }} />
              ))}
            </div>
          )}
        </div>
        {editandoNombre ? (
          <input
            autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)}
            onBlur={guardarNombre} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            className="bg-bg border border-accentTeal rounded px-2 py-1 text-sm font-semibold outline-none"
          />
        ) : (
          <button onClick={() => setEditandoNombre(true)} className="text-sm font-semibold hover:underline">{grupo.nombre}</button>
        )}
        <span className="text-xs text-textMuted">{items.length}</span>
        <div className="flex-1" />
        {puedeEditarEstructura && (
          <button onClick={onEliminarGrupo} className="text-xs text-textMuted hover:text-dangerText" title="Eliminar grupo">🗑</button>
        )}
      </div>

      {!colapsado && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-t border-border">
                  <th className="text-left text-xs text-textMuted font-medium px-3 py-1.5 min-w-[220px]">Nombre</th>
                  {columnas.map((c) => (
                    <th key={c.id} className="text-left text-xs text-textMuted font-medium px-2 py-1.5 min-w-[140px]">{c.nombre}</th>
                  ))}
                  {puedeEditarEstructura && (
                    <th className="px-2 py-1.5 w-8">
                      <button onClick={onAbrirEditorColumnas} title="Agregar/editar columnas" className="text-textMuted hover:text-accentTeal" data-tour="tablero-editar-columnas">＋</button>
                    </th>
                  )}
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-t border-border hover:bg-surface2/60 group">
                    <td className="px-3 py-1">
                      <button onClick={() => onAbrirItem(item.id)} className="text-left text-sm hover:underline truncate max-w-[280px] block" data-tour="tablero-item-nombre">
                        {item.nombre || '(sin nombre)'}
                      </button>
                    </td>
                    {columnas.map((c) => (
                      <td key={c.id} className="px-1 py-1">
                        <Celda
                          columna={c} valor={item.cells?.[c.id]} usuariosEquipo={usuariosEquipo}
                          onGuardar={(v, txt) => onActualizarCelda(item, c, v, txt)}
                          puedeCrearPersonas={puedeEditarEstructura} onCrearPersona={onCrearPersona}
                        />
                      </td>
                    ))}
                    {puedeEditarEstructura && <td></td>}
                    <td className="px-1 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1 justify-end pr-1">
                        <button onClick={() => onMoverItem(item, -1)} disabled={i === 0} className="text-textMuted hover:text-text disabled:opacity-20 text-xs">↑</button>
                        <button onClick={() => onMoverItem(item, 1)} disabled={i === items.length - 1} className="text-textMuted hover:text-text disabled:opacity-20 text-xs">↓</button>
                        <button onClick={() => onEliminarItem(item)} className="text-textMuted hover:text-dangerText text-xs">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={columnas.length + 2} className="px-3 py-3 text-xs text-textMuted">Todavía no hay contenidos en este grupo.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <form onSubmit={crear} className="px-3 py-2 border-t border-border">
            <input
              value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="+ Agregar contenido"
              className="w-full bg-transparent text-sm px-2 py-1 outline-none placeholder:text-textMuted"
              data-tour="tablero-agregar-item"
            />
          </form>
        </>
      )}
    </div>
  );
}
