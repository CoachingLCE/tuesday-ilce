import { NextResponse } from 'next/server';
import { conManejo } from '../../../lib/apiHandler';
import { requireUsuario } from '../../../lib/requireUsuario';
import { tienePermisoAccesos, tienePermisoGestionarAdmins } from '../../../lib/permisos';
import { listarUsuarios, crearUsuario, puedeAsignarRoles, rolesValidos, buscarUsuarioPorEmail } from '../../../lib/gestionUsuarios';
import { leerHistorialCompleto } from '../../../lib/datosHistorial';
import { registrarAccion } from '../../../lib/auditoria';

export const GET = conManejo(async (request) => {
  const actor = await requireUsuario(request);
  if (!actor) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoAccesos(actor)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const [usuarios, historial] = await Promise.all([listarUsuarios(), leerHistorialCompleto()]);

  // El último login de cada email es la entrada "Inició sesión" más reciente en el Historial
  // (leerHistorialCompleto ya viene ordenado de más reciente a más viejo).
  const conUltimoLogin = usuarios.map((u) => {
    const ultimo = historial.find((h) => h.accion === 'Inició sesión' && h.email?.toLowerCase() === u.email?.toLowerCase());
    const totalLogins = historial.filter((h) => h.accion === 'Inició sesión' && h.email?.toLowerCase() === u.email?.toLowerCase()).length;
    return { ...u, ultimoLogin: ultimo ? ultimo.fecha : '', totalLogins };
  });

  return NextResponse.json({ usuarios: conUltimoLogin });
})

export const POST = conManejo(async (request) => {
  const actor = await requireUsuario(request);
  if (!actor) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoAccesos(actor)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const body = await request.json();
