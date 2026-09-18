'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Celda from './Celda';
import { PALETA_COLORES } from '../../lib/paletaTablero';

export default function GrupoTabla({
  grupo, columnas, items, usuariosEquipo, puedeEditarEstructura,
  onRenombrarGrupo, onRecolorearGrupo, onEliminarGrupo,
  onCrearItem, onActualizarCelda, onAbrirItem, onMoverItem, onEliminarItem, onAbrirEditorColumnas,
  onCrearPersona, onAgregarOpcion, puedeReordenarGrupos, arrastrando, hayArrastreActivo, sobreDestino, recienMovido,
  onIniciarArrastre, onTerminarArrastre, onSobreDestino, onSalirDestino, onSoltarSobre
}) {
  const [colapsado, setColapsado] = useState(false);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombre, setNombre] = useState(grupo.nombre);
  const [colorAbierto, setColorAbierto] = useState(false);
  const [colorPos, setColorPos] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const colorTriggerRef = useRef(null);
  const colorPopoverRef = useRef(null);

  useEffect(() => { setNombre(grupo.nombre); }, [grupo.nombre]);

  // El selector de color se dibuja con un portal a <body> (igual que los desplegables de
  // celda) — antes quedaba "adentro" del grupo con position: absolute, y como el grupo
  // tiene overflow-hidden (para las esquinas redondeadas), el selector se cortaba o
  // directamente no se veía bien al abrirlo con el grupo colapsado.
  useEffect(() => {
    if (!colorAbierto) return;
    function onClickFuera(e) {
      if (
        colorTriggerRef.current && !colorTriggerRef.current.contains(e.target) &&
        colorPopoverRef.current && !colorPopoverRef.current.contains(e.target)
      ) {
        setColorAbierto(false);
      }
    }
    function cerrar() { setColorAbierto(false); }
    document.addEventListener('mousedown', onClickFuera);
    window.addEventListener('scroll', cerrar, true);
    window.addEventListener('resize', cerrar);
    return () => {
      document.removeEventListener('mousedown', onClickFuera);
      window.removeEventListener('scroll', cerrar, true);
      window.removeEventListener('resize', cerrar);
    };
  }, [colorAbierto]);

  function abrirColor() {
    const r = colorTriggerRef.current.getBoundingClientRect();
    setColorPos({ top: r.bottom + 4, left: r.left });
    setColorAbierto(true);
  }

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
    <div className="relative mb-6">
      {/* Línea de inserción: se dibuja ARRIBA de este grupo mientras se arrastra otro por
          encima, para que quede clarísimo dónde va a quedar al soltar (antes la única señal
          era que el grupo arrastrado se ponía semitransparente, y no se entendía dónde iba
          a caer hasta soltarlo). */}
      {sobreDestino && (
        <div className="absolute -top-3.5 left-0 right-0 h-0.5 bg-accentTeal rounded-full shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
      )}
      <div
        className={`rounded-xl border bg-surface overflow-hidden transition-all ${
          arrastrando
            ? 'opacity-40 border-dashed border-accentTeal'
            : recienMovido
              ? 'border-accentTeal ring-2 ring-accentTeal/50'
              : hayArrastreActivo
                ? 'border-dashed border-textMuted/50'
                : 'border-border'
        }`}
        data-tour="tablero-grupo"
        onDragEnter={puedeReordenarGrupos ? (e) => { e.preventDefault(); onSobreDestino?.(); } : undefined}
        onDragOver={puedeReordenarGrupos ? (e) => e.preventDefault() : undefined}
        onDragLeave={puedeReordenarGrupos ? (e) => { if (!e.currentTarget.contains(e.relatedTarget)) onSalirDestino?.(); } : undefined}
        onDrop={puedeReordenarGrupos ? onSoltarSobre : undefined}
      >
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        style={{ borderLeft: `4px solid ${grupo.color}` }}
        onClick={() => setColapsado((v) => !v)}
        title={colapsado ? 'Mostrar contenidos' : 'Ocultar contenidos'}
      >
        {puedeReordenarGrupos && (
          <span
            draggable
            onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('text/plain', grupo.id); onIniciarArrastre?.(); }}
            onDragEnd={(e) => { e.stopPropagation(); onTerminarArrastre?.(); }}
            onClick={(e) => e.stopPropagation()}
            className="text-textMuted hover:text-text text-base cursor-grab active:cursor-grabbing px-1 -mx-1 rounded hover:bg-surface2"
            title="Arrastrar para reordenar"
          >
            ⠿⠿
          </span>
        )}
        <span className="text-textMuted hover:text-text text-xs w-5">
          {colapsado ? '▸' : '▾'}
        </span>
        <div ref={colorTriggerRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => (colorAbierto ? setColorAbierto(false) : abrirColor())}
            className="w-4 h-4 rounded-full shrink-0 outline-none"
            style={{ background: grupo.color }}
            title="Cambiar color"
          />
        </div>
        {colorAbierto && colorPos && typeof document !== 'undefined' && createPortal(
          <div
            ref={colorPopoverRef}
            style={{ position: 'fixed', top: colorPos.top, left: colorPos.left, zIndex: 100 }}
            className="bg-surface2 border border-border rounded-lg shadow-xl p-2 flex flex-wrap gap-1.5 w-40"
            onClick={(e) => e.stopPropagation()}
          >
            {PALETA_COLORES.map((c) => (
              <button key={c} onClick={() => { onRecolorearGrupo(c); setColorAbierto(false); }} className="w-5 h-5 rounded-full" style={{ background: c }} />
            ))}
          </div>,
          document.body
        )}
        {editandoNombre ? (
          <input
            autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)}
            onBlur={guardarNombre} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            onClick={(e) => e.stopPropagation()}
            className="bg-bg border border-accentTeal rounded px-2 py-1 text-sm font-semibold outline-none"
          />
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setEditandoNombre(true); }} className="text-sm font-semibold hover:underline">{grupo.nombre}</button>
        )}
        <span className="text-xs text-textMuted">{items.length}</span>
        <div className="flex-1" />
        {puedeEditarEstructura && (
          <button
            onClick={(e) => { e.stopPropagation(); onEliminarGrupo(); }}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-surface2 border border-border text-textSec hover:bg-dangerBg/50 hover:border-dangerText hover:text-dangerText transition-colors"
            title="Eliminar grupo"
          >
            🗑
          </button>
        )}
      </div>

      {!colapsado && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse table-fixed">
              <thead>
                <tr className="border-t border-border">
                  <th className="text-left text-xs text-textMuted font-medium px-4 py-2.5 w-[220px]">Nombre</th>
                  {columnas.map((c) => (
                    <th key={c.id} className="text-left text-xs text-textMuted font-medium px-3 py-2.5">{c.nombre}</th>
                  ))}
                  {puedeEditarEstructura && (
                    <th className="px-3 py-2.5 w-10">
                      <button onClick={onAbrirEditorColumnas} title="Agregar/editar columnas" className="text-textMuted hover:text-accentTeal" data-tour="tablero-editar-columnas">＋</button>
                    </th>
                  )}
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} className="border-t border-border hover:bg-surface2/60 group">
                    <td className="px-4 py-2">
                      <button onClick={() => onAbrirItem(item.id)} className="text-left text-sm hover:underline truncate max-w-[280px] block" data-tour="tablero-item-nombre">
                        {item.nombre || '(sin nombre)'}
                      </button>
                    </td>
                    {columnas.map((c) => (
                      <td key={c.id} className="px-2 py-2 overflow-visible">
                        <Celda
                          columna={c} valor={item.cells?.[c.id]} usuariosEquipo={usuariosEquipo}
                          onGuardar={(v, txt) => onActualizarCelda(item, c, v, txt)}
                          puedeCrearPersonas={puedeEditarEstructura} onCrearPersona={onCrearPersona}
                          onAgregarOpcion={onAgregarOpcion}
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
    </div>
  );
}
