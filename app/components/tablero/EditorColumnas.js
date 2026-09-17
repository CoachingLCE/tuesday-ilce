'use client';
import { useState } from 'react';
import { colorSiguiente } from '../../lib/paletaTablero';

const TIPOS = [
  { id: 'status', label: 'Estado' },
  { id: 'person', label: 'Persona' },
  { id: 'date', label: 'Fecha' },
  { id: 'text', label: 'Texto' }
];

// Sugiere un tipo de columna a partir de palabras clave en el nombre — el usuario
// puede corregirlo manualmente en el desplegable, y ahí deja de auto-sugerir.
function sugerirTipoColumna(nombre) {
  const n = (nombre || '').toLowerCase();
  if (/fecha|vencimiento|entrega|deadline/.test(n)) return 'date';
  if (/estado|prioridad|etapa|status/.test(n)) return 'status';
  if (/responsable|persona|asignad|encargad/.test(n)) return 'person';
  return 'text';
}

export default function EditorColumnas({ columnas, onCrear, onActualizar, onEliminar, onCerrar }) {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('text');
  const [tipoTocado, setTipoTocado] = useState(false);

  function onCambiarNombre(valor) {
    setNuevoNombre(valor);
    if (!tipoTocado) setNuevoTipo(sugerirTipoColumna(valor));
  }

  function crear(e) {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    const id = `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    onCrear({ id, nombre: nuevoNombre.trim(), tipo: nuevoTipo, orden: columnas.length, opciones: [] });
    setNuevoNombre(''); setNuevoTipo('text'); setTipoTocado(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onCerrar}>
      <div className="bg-surface2 border border-border rounded-2xl p-5 w-full max-w-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-bold">Columnas del tablero</p>
          <button onClick={onCerrar} className="text-textMuted hover:text-text">✕</button>
        </div>

        <div className="space-y-4">
          {columnas.map((c) => (
            <ColumnaEditable
              key={c.id}
              columna={c}
              onActualizar={(cambios) => onActualizar(c.id, cambios)}
              onEliminar={() => onEliminar(c.id)}
            />
          ))}
        </div>

        <form onSubmit={crear} className="mt-4 flex gap-2">
          <input
            value={nuevoNombre} onChange={(e) => onCambiarNombre(e.target.value)}
            placeholder="Nombre de la nueva columna"
            className="flex-1 bg-bg border border-border rounded-lg px-2.5 py-2 text-sm"
          />
          <select
            value={nuevoTipo} onChange={(e) => { setNuevoTipo(e.target.value); setTipoTocado(true); }}
            className="bg-bg border border-border rounded-lg px-2 py-2 text-xs"
            title="Tipo de columna (se sugiere solo según el nombre, pero lo podés cambiar)"
          >
            {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <button className="bg-gradient-to-r from-accentPurple to-accentMagenta text-white rounded-lg px-4 py-2 text-sm font-semibold">+ Agregar</button>
        </form>
      </div>
    </div>
  );
}

function ColumnaEditable({ columna, onActualizar, onEliminar }) {
  const [nombre, setNombre] = useState(columna.nombre);

  function agregarOpcion() {
    const usados = (columna.opciones || []).map((o) => o.color);
    const nueva = { id: `op_${Date.now()}`, label: 'Nueva opción', color: colorSiguiente(usados) };
    onActualizar({ opciones: [...(columna.opciones || []), nueva] });
  }
  function actualizarOpcion(id, cambios) {
    onActualizar({ opciones: columna.opciones.map((o) => (o.id === id ? { ...o, ...cambios } : o)) });
  }
  function quitarOpcion(id) {
    onActualizar({ opciones: columna.opciones.filter((o) => o.id !== id) });
  }

  return (
    <div className="border border-border rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <input
          value={nombre} onChange={(e) => setNombre(e.target.value)}
          onBlur={() => { if (nombre.trim() && nombre !== columna.nombre) onActualizar({ nombre: nombre.trim() }); }}
          className="flex-1 bg-bg border border-border rounded-lg px-2 py-1.5 text-sm font-medium"
        />
        <select
          value={columna.tipo} onChange={(e) => onActualizar({ tipo: e.target.value, opciones: e.target.value === 'status' ? (columna.opciones?.length ? columna.opciones : []) : [] })}
          className="bg-bg border border-border rounded-lg px-2 py-1.5 text-xs"
        >
          {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <button onClick={onEliminar} className="text-textMuted hover:text-dangerText text-sm px-1" title="Eliminar columna">🗑</button>
      </div>

      {columna.tipo === 'status' && (
        <div className="pl-1">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {(columna.opciones || []).map((o) => (
              <div key={o.id} className="flex items-center gap-1 rounded-lg px-2 py-1" style={{ background: o.color }}>
                <input
                  value={o.label}
                  onChange={(e) => actualizarOpcion(o.id, { label: e.target.value })}
                  className="bg-transparent text-white text-xs font-medium outline-none w-20"
                />
                <button onClick={() => quitarOpcion(o.id)} className="text-white/80 hover:text-white text-xs">✕</button>
              </div>
            ))}
          </div>
          <button onClick={agregarOpcion} className="text-xs text-accentTeal hover:underline">+ Agregar opción</button>
        </div>
      )}
    </div>
  );
}
