import { NextResponse } from 'next/server';
import { conManejo } from '../../../../lib/apiHandler';
import { requireUsuario } from '../../../../lib/requireUsuario';
import { tienePermisoVer } from '../../../../lib/permisos';
import { crearGrupo } from '../../../../lib/datosTablero';
import { registrarAccion } from '../../../../lib/auditoria';

// Crear grupos queda abierto a cualquiera que pueda usar el tablero (Colaborador incluido) —
// es contenido operativo del día a día, no estructura del tablero.
export const POST = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: 'Falta id.' }, { status: 400 });

  await crearGrupo({ id: body.id, nombre: body.nombre || '', color: body.color || '#4c6fff', orden: body.orden ?? 0 });
  await registrarAccion(usuario.email, usuario.nombre, 'Creó grupo en el tablero', body.nombre || body.id);
  return NextResponse.json({ ok: true });
})
