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

function CeldaPersona({ columna, valor, usuariosEquipo, onGuardar, puedeCrearPersonas, onCrearPersona }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [emailNuevo, setEmailNuevo] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorCreando, setErrorCreando] = useState('');
  const ref = useRef(null);
  useClickOutside(ref, () => setAbierto(false));
  const persona = usuariosEquipo.find((u) => u.email === valor);
  const filtrados = usuariosEquipo.filter((u) => u.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const hayCoincidenciaExacta = usuariosEquipo.some((u) => u.nombre.toLowerCase() === busqueda.trim().toLowerCase());

  async function crear(e) {
    e.preventDefault();
    if (!busqueda.trim() || !emailNuevo.trim() || creando) return;
    setCreando(true);
    setErrorCreando('');
    try {
      const resultado = await onCrearPersona(busqueda.trim(), emailNuevo.trim());
      if (resultado?.email) {
        onGuardar(resultado.email, `asignó ${columna.nombre} a ${busqueda.trim()} (persona nueva)`);
        setAbierto(false); setBusqueda(''); setFormularioAbierto(false); setEmailNuevo('');
      } else {
        setErrorCreando(resultado?.error || 'No se pudo crear.');
      }
    } finally {
      setCreando(false);
    }
  }

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
          {puedeCrearPersonas && busqueda.trim() && !hayCoincidenciaExacta && (
            formularioAbierto ? (
              <form onSubmit={crear} className="mt-1 border-t border-border pt-1.5 space-y-1">
                <p className="text-[11px] text-textMuted px-1">Crear a &quot;{busqueda.trim()}&quot; en Usuarios:</p>
                <input
                  autoFocus value={emailNuevo} onChange={(e) => setEmailNuevo(e.target.value)}
                  type="email" placeholder="email@ilce.com"
                  className="w-full bg-bg border border-border rounded px-2 py-1 text-xs"
                />
                {errorCreando && <p className="text-[10px] text-dangerText px-1">{errorCreando}</p>}
                <div className="flex gap-1">
                  <button type="submit" disabled={creando || !emailNuevo.trim()} className="flex-1 bg-accentTeal text-white rounded px-2 py-1 text-xs font-semibold disabled:opacity-50">
                    {creando ? 'Creando…' : 'Crear'}
                  </button>
                  <button type="button" onClick={() => { setFormularioAbierto(false); setErrorCreando(''); }} className="text-xs text-textMuted px-2">Cancelar</button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setFormularioAbierto(true)}
                className="w-full text-left text-xs text-accentTeal px-2 py-1.5 mt-1 border-t border-border pt-1.5"
              >
                {`+ Crear persona "${busqueda.trim()}"`}
              </button>
            )
          )}
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

export default function Celda({ columna, valor, usuariosEquipo, onGuardar, puedeCrearPersonas, onCrearPersona }) {
  if (columna.tipo === 'status') return <CeldaEstado columna={columna} valor={valor} onGuardar={onGuardar} />;
  if (columna.tipo === 'person') return (
    <CeldaPersona
      columna={columna} valor={valor} usuariosEquipo={usuariosEquipo || []} onGuardar={onGuardar}
      puedeCrearPersonas={puedeCrearPersonas} onCrearPersona={onCrearPersona}
    />
  );
  if (columna.tipo === 'date') return <CeldaFecha columna={columna} valor={valor} onGuardar={onGuardar} />;
  return <CeldaTexto columna={columna} valor={valor} onGuardar={onGuardar} />;
}
