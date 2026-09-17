import { NextResponse } from 'next/server';
import { conManejo } from '../../../../../lib/apiHandler';
import { requireUsuario } from '../../../../../lib/requireUsuario';
import { tienePermisoVer } from '../../../../../lib/permisos';
import { actualizarItemPorId, eliminarItemPorId, crearActividad } from '../../../../../lib/datosTablero';
import { registrarAccion } from '../../../../../lib/auditoria';

export const PATCH = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const id = decodeURIComponent(params.id);
  const body = await request.json();
  const { actividadTexto, ...cambios } = body;
  await actualizarItemPorId(id, cambios);
  if (actividadTexto) {
    await crearActividad({ id: `${id}-a${Date.now()}`, itemId: id, autor: usuario.nombre, texto: actividadTexto });
    await registrarAccion(usuario.email, usuario.nombre, 'Editó contenido del tablero', actividadTexto);
  }
  return NextResponse.json({ ok: true });
})

export const DELETE = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const id = decodeURIComponent(params.id);
  await eliminarItemPorId(id);
  await registrarAccion(usuario.email, usuario.nombre, 'Eliminó contenido del tablero', id);
  return NextResponse.json({ ok: true });
})
