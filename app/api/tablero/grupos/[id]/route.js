import { NextResponse } from 'next/server';
import { conManejo } from '../../../../../lib/apiHandler';
import { requireUsuario } from '../../../../../lib/requireUsuario';
import { tienePermisoEditarEstructura } from '../../../../../lib/permisos';
import { actualizarColumnaPorId, eliminarColumnaPorId, crearColumna } from '../../../../../lib/datosTablero';
import { registrarAccion } from '../../../../../lib/auditoria';

// Editar una columna (nombre, tipo, opciones de estado, orden): reservado a Admin/SuperAdmin.
// Las 4 columnas de base (Estado/Responsable/Fecha/Tipo) existen "virtualmente" hasta que
// alguien las edita por primera vez — ahí recién se crea la fila real en el Sheet (upsert),
// para no arrancar el Sheet con filas de más que nadie tocó todavía.
export const PATCH = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoEditarEstructura(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const id = decodeURIComponent(params.id);
  const body = await request.json();
  try {
    await actualizarColumnaPorId(id, body);
  } catch {
    await crearColumna({ id, nombre: body.nombre || id, tipo: body.tipo || 'text', orden: body.orden ?? 0, opciones: body.opciones || [] });
  }
  await registrarAccion(usuario.email, usuario.nombre, 'Editó columna del tablero', body.nombre || id);
  return NextResponse.json({ ok: true });
})

export const DELETE = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoEditarEstructura(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const id = decodeURIComponent(params.id);
  await eliminarColumnaPorId(id);
  await registrarAccion(usuario.email, usuario.nombre, 'Eliminó columna del tablero', id);
  return NextResponse.json({ ok: true });
})
