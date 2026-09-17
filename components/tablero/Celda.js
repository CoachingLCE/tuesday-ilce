'use client';
import { useEffect, useRef, useState } from 'react';

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [ref, onOutside]);
}

function CeldaEstado({ columna, valor, onGuardar }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setAbierto(false));
  const opcion = (columna.opciones || []).find((o) => o.id === valor);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full h-8 rounded text-xs font-semibold text-white flex items-center justify-center px-2 truncate"
        style={{ background: opcion?.color || '#c4c4c4' }}
      >
        {opcion?.label || 'Sin estado'}
      </button>
      {abierto && (
        <div className="absolute z-20 top-full left-0 mt-1 w-44 bg-surface2 border border-border rounded-lg shadow-xl p-1">
          {(columna.opciones || []).map((o) => (
            <button
              key={o.id}
              onClick={() => { onGuardar(o.id, `cambió ${columna.nombre} a "${o.label}"`); setAbierto(false); }}
              className="w-full text-left text-xs rounded px-2 py-1.5 mb-0.5 text-white font-medium"
              style={{ background: o.color }}
            >
              {o.label}
            </button>
          ))}
          {!columna.opciones?.length && <p className="text-xs text-textMuted px-2 py-1">Sin opciones cargadas.</p>}
          {valor && (
            <button onClick={() => { onGuardar('', `quitó ${columna.nombre}`); setAbierto(false); }} className="w-full text-left text-xs text-textMuted px-2 py-1.5 border-t border-border mt-0.5 pt-1.5">
              Limpiar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CeldaPersona({ columna, valor, usuariosEquipo, onGuardar }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const ref = useRef(null);
  useClickOutside(ref, () => setAbierto(false));
  const persona = usuariosEquipo.find((u) => u.email === valor);
  const filtrados = usuariosEquipo.filter((u) => u.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setAbierto((v) => !v)} className="w-full h-8 rounded text-xs flex items-center gap-1.5 px-2 hover:bg-surface2 truncate">
        {persona ? (
          <>
            <span className="w-5 h-5 rounded-full bg-accentPurple text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {persona.nombre.slice(0, 1).toUpperCase()}
            </span>
            <span className="truncate">{persona.nombre}</span>
          </>
        ) : <span className="text-textMuted">+ Asignar</span>}
      </button>
      {abierto && (
        <div className="absolute z-20 top-full left-0 mt-1 w-52 bg-surface2 border border-border rounded-lg shadow-xl p-1.5">
          <input
            autoFocus value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar…" className="w-full bg-bg border border-border rounded px-2 py-1 text-xs mb-1.5"
          />
          <div className="max-h-48 overflow-y-auto">
            {filtrados.map((u) => (
              <button
                key={u.email}
                onClick={() => { onGuardar(u.email, `asignó ${columna.nombre} a ${u.nombre}`); setAbierto(false); setBusqueda(''); }}
                className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-bg flex items-center gap-1.5"
              >
                <span className="w-5 h-5 rounded-full bg-accentPurple text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {u.nombre.slice(0, 1).toUpperCase()}
                </span>
                {u.nombre}
              </button>
            ))}
            {!filtrados.length && <p className="text-xs text-textMuted px-2 py-1.5">Nadie coincide.</p>}
          </div>
          {valor && (
            <button onClick={() => { onGuardar('', `quitó ${columna.nombre}`); setAbierto(false); }} className="w-full text-left text-xs text-textMuted px-2 py-1 mt-1 border-t border-border pt-1.5">
              Quitar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CeldaFecha({ columna, valor, onGuardar }) {
  return (
    <input
      type="date"
      value={valor || ''}
      onChange={(e) => onGuardar(e.target.value, e.target.value ? `cambió ${columna.nombre} a ${e.target.value}` : `quitó ${columna.nombre}`)}
      className="w-full h-8 bg-transparent hover:bg-surface2 rounded text-xs px-2 border-none outline-none text-text"
    />
  );
}

function CeldaTexto({ columna, valor, onGuardar }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(valor || '');

  useEffect(() => { setTexto(valor || ''); }, [valor]);

  function guardar() {
    setEditando(false);
    if (texto !== (valor || '')) onGuardar(texto, `cambió ${columna.nombre}`);
  }

  if (editando) {
    return (
      <input
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={guardar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.target.blur();
          if (e.key === 'Escape') { setTexto(valor || ''); setEditando(false); }
        }}
        className="w-full h-8 bg-bg border border-accentTeal rounded px-2 text-xs outline-none"
      />
    );
  }
  return (
    <button onClick={() => setEditando(true)} className="w-full h-8 text-left px-2 rounded hover:bg-surface2 text-xs truncate">
      {valor || <span className="text-textMuted">—</span>}
    </button>
  );
}

export default function Celda({ columna, valor, usuariosEquipo, onGuardar }) {
  if (columna.tipo === 'status') return <CeldaEstado columna={columna} valor={valor} onGuardar={onGuardar} />;
  if (columna.tipo === 'person') return <CeldaPersona columna={columna} valor={valor} usuariosEquipo={usuariosEquipo || []} onGuardar={onGuardar} />;
  if (columna.tipo === 'date') return <CeldaFecha columna={columna} valor={valor} onGuardar={onGuardar} />;
  return <CeldaTexto columna={columna} valor={valor} onGuardar={onGuardar} />;
}
