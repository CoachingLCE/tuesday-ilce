'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../../lib/useSession';

const ROLES_DISPONIBLES = ['Colaborador', 'Admin', 'SuperAdmin'];
const ROLES_RESERVADOS = ['Admin', 'SuperAdmin'];

const inputCls = 'w-full bg-bg border border-border rounded-lg px-2.5 py-2 text-sm';
const btnCls = 'bg-gradient-to-r from-accentPurple to-accentMagenta text-white rounded-lg px-4 py-2 text-sm font-semibold';
const btnSecCls = 'bg-transparent text-textSec border border-border rounded-lg px-3 py-1.5 text-xs';

export default function AccesosPage() {
  const { usuario, cargando, fetchAutenticado } = useSession();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoRoles, setNuevoRoles] = useState(['Colaborador']);
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [detalleUsuario, setDetalleUsuario] = useState(null);

  const esSuperAdmin = (usuario?.roles || []).includes('SuperAdmin');
  const puedeGestionarAdmins = esSuperAdmin;

  useEffect(() => {
    if (!cargando && !usuario) router.push('/login');
  }, [cargando, usuario, router]);

  useEffect(() => {
    if (usuario) cargarUsuarios();
  }, [usuario]);

  async function cargarUsuarios() {
    setCargandoLista(true);
    setError('');
    try {
      const res = await fetchAutenticado('/api/usuarios');
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'No se pudo cargar la lista.'); return; }
      setUsuarios(data.usuarios);
    } catch {
      setError('Error de conexión.');
    } finally {
      setCargandoLista(false);
    }
  }

  function tocaReservado(roles) {
    return roles.some((r) => ROLES_RESERVADOS.includes(r));
  }

  async function crear(e) {
    e.preventDefault();
    setError(''); setMensaje('');
    if (nuevoPassword && nuevoPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres (o dejala vacía para que la persona la asigne después).');
      return;
    }
    try {
      const res = await fetchAutenticado('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: nuevoEmail, nombre: nuevoNombre, roles: nuevoRoles, password: nuevoPassword || undefined })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMensaje(`Usuario ${nuevoEmail} creado.${nuevoPassword ? ' Ya puede entrar con la contraseña que pusiste.' : ' Todavía sin contraseña — puede asignarla desde /setup-password.'}`);
      setNuevoEmail(''); setNuevoNombre(''); setNuevoRoles(['Colaborador']); setNuevoPassword('');
      cargarUsuarios();
    } catch {
      setError('Error de conexión.');
    }
  }

  async function actualizar(email, cambios) {
    setError(''); setMensaje('');
    try {
      const res = await fetchAutenticado(`/api/usuarios/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMensaje(`${email} actualizado.`);
      cargarUsuarios();
    } catch {
      setError('Error de conexión.');
    }
  }

  function elegirRolNuevo(rol) {
    setNuevoRoles([rol]);
  }

  if (cargando || !usuario) return null;

  return (
    <div className="max-w-[900px] mx-auto px-6 pb-16 pt-10">
      <h1 className="text-xl mb-1">Accesos</h1>
      <p className="text-textSec text-sm mb-5">
        Gestioná quién entra a Tuesday ILCE y con qué rol.
        {!esSuperAdmin && ' Como no sos Super Admin, no podés crear ni editar usuarios Admin/SuperAdmin.'}
      </p>

      {error && <p className="text-dangerText text-sm mb-3">{error}</p>}
      {mensaje && <p className="text-successText text-sm mb-3">{mensaje}</p>}

      <div className="bg-surface2 border border-border rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-semibold mb-3">➕ Nuevo usuario</h2>
        <form onSubmit={crear} className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs text-textSec block mb-1">Email</label>
            <input type="email" required value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-textSec block mb-1">Nombre</label>
            <input type="text" required value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-textSec block mb-1">Contraseña (opcional)</label>
            <input
              type="text" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)}
              placeholder="Dejala vacía para que la persona la asigne ella misma desde /setup-password"
              className={inputCls}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-textSec block mb-1.5">Rol</label>
            <div className="flex gap-4">
              {ROLES_DISPONIBLES.map((rol) => {
                const bloqueado = ROLES_RESERVADOS.includes(rol) && !puedeGestionarAdmins;
                return (
                  <label key={rol} className={`text-sm flex gap-1.5 items-center ${bloqueado ? 'text-textMuted' : 'text-text'}`}>
                    <input type="radio" name="rolNuevo" disabled={bloqueado} checked={nuevoRoles.includes(rol)} onChange={() => elegirRolNuevo(rol)} />
                    {rol}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="col-span-2">
            <button type="submit" className={btnCls}>Crear usuario</button>
          </div>
        </form>
      </div>

      <h2 className="text-sm font-semibold mb-3">Usuarios ({usuarios.length})</h2>
      {cargandoLista ? (
        <p className="text-textSec text-sm">Cargando…</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {usuarios.map((u) => (
            <FilaUsuario
              key={u.email}
              u={u}
              puedeEditar={!tocaReservado(u.roles) || puedeGestionarAdmins}
              onActualizar={actualizar}
              esSuperAdmin={esSuperAdmin}
              onVerDetalle={() => setDetalleUsuario(u)}
            />
          ))}
        </div>
      )}

      <div className="bg-surface2 border border-border rounded-2xl p-5 mt-6">
        <h2 className="text-sm font-semibold mb-3">¿Qué puede hacer cada rol?</h2>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-textSec">Colaborador</p>
            <p className="text-xs text-textMuted">Puede usar el tablero: crear y editar contenidos, cambiar estados, comentar y subir archivos. No puede tocar la estructura (agregar/eliminar columnas o grupos) ni entrar a Accesos o Historial de cambios.</p>
          </div>
          <div>
            <p className="font-semibold text-textSec">Admin</p>
            <p className="text-xs text-textMuted">Todo lo de Colaborador, más: editar la estructura del tablero (columnas y grupos), gestionar Colaboradores en Accesos, y ver el Historial de cambios completo.</p>
          </div>
          <div>
            <p className="font-semibold text-textSec">SuperAdmin</p>
            <p className="text-xs text-textMuted">Todo lo de Admin, más: crear o eliminar otros Admin/SuperAdmin.</p>
          </div>
        </div>
      </div>

      {detalleUsuario && <ModalDetalleUsuario u={detalleUsuario} onCerrar={() => setDetalleUsuario(null)} />}
    </div>
  );
}

function ModalDetalleUsuario({ u, onCerrar }) {
  function formatFecha(iso) {
    if (!iso) return 'Nunca / sin registro';
    try {
      return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onCerrar}>
      <div className="bg-surface2 border border-border rounded-2xl p-5 w-96" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold mb-1">{u.nombre}</h3>
        <p className="text-textSec text-xs mb-4">{u.email}</p>
        <div className="space-y-2 text-sm mb-4">
          <FilaDetalle label="Roles" valor={u.roles.join(', ')} />
          <FilaDetalle label="Estado" valor={u.activo ? 'Activo' : 'Desactivado'} />
          <FilaDetalle label="Contraseña asignada" valor={u.tieneContrasena ? 'Sí' : 'No'} />
          <FilaDetalle label="Fecha de creación" valor={u.fechaCreacion ? formatFecha(u.fechaCreacion) : 'No disponible (usuario creado antes de esta función)'} />
          <FilaDetalle label="Último login" valor={formatFecha(u.ultimoLogin)} />
          <FilaDetalle label="Total de logins registrados" valor={u.totalLogins ?? 0} />
        </div>
        <button className={btnSecCls} onClick={onCerrar}>Cerrar</button>
      </div>
    </div>
  );
}

function FilaDetalle({ label, valor }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-textMuted">{label}</span>
      <span className="text-right">{valor}</span>
    </div>
  );
}

function rolMasAlto(roles) {
  if (roles.includes('SuperAdmin')) return 'SuperAdmin';
  if (roles.includes('Admin')) return 'Admin';
  return 'Colaborador';
}

function FilaUsuario({ u, puedeEditar, onActualizar, esSuperAdmin, onVerDetalle }) {
  const [rol, setRol] = useState(rolMasAlto(u.roles));
  const [nuevaPassword, setNuevaPassword] = useState('');

  return (
    <div className="bg-surface2 border border-border rounded-xl p-3.5">
      <div className="flex justify-between items-baseline mb-2">
        <div>
          <span className="font-semibold text-sm">{u.nombre}</span>
          <span className="text-textSec text-xs ml-2">{u.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11.5px] ${u.activo ? 'text-successText' : 'text-dangerText'}`}>
            {u.activo ? '● Activo' : '● Desactivado'} {!u.tieneContrasena && '· sin contraseña asignada'}
          </span>
          {esSuperAdmin && (
            <button className={btnSecCls} onClick={onVerDetalle}>Ver detalle</button>
          )}
        </div>
      </div>

      {!puedeEditar ? (
        <p className="text-xs text-textMuted">Solo un Super Admin puede editar este usuario.</p>
      ) : (
        <div className="flex flex-wrap gap-3.5 items-center">
          {ROLES_DISPONIBLES.map((r) => (
            <label key={r} className="text-xs flex gap-1 items-center">
              <input type="radio" name={`rol-${u.email}`} checked={rol === r} onChange={() => setRol(r)} />
              {r}
            </label>
          ))}
          <button className={btnSecCls} onClick={() => onActualizar(u.email, { roles: [rol] })}>Guardar rol</button>
          <button className={btnSecCls} onClick={() => onActualizar(u.email, { activo: !u.activo })}>
            {u.activo ? 'Desactivar' : 'Reactivar'}
          </button>
          <input
            type="password" placeholder="Nueva contraseña (min 8)" value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            className="bg-bg border border-border rounded-lg px-2 py-1.5 text-xs w-44"
          />
          <button
            className={btnSecCls}
            onClick={() => { onActualizar(u.email, { nuevaPassword }); setNuevaPassword(''); }}
            disabled={nuevaPassword.length > 0 && nuevaPassword.length < 8}
          >
            Resetear contraseña
          </button>
        </div>
      )}
    </div>
  );
}
