import { NextResponse } from 'next/server';
import { conManejo } from '../../../../../lib/apiHandler';
import { requireUsuario } from '../../../../../lib/requireUsuario';
import { tienePermisoAutomatizaciones } from '../../../../../lib/permisos';
import { actualizarAutomatizacionPorId, eliminarAutomatizacionPorId } from '../../../../../lib/automatizaciones';
import { registrarAccion } from '../../../../../lib/auditoria';

export const PATCH = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoAutomatizaciones(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const id = decodeURIComponent(params.id);
  const body = await request.json();
  await actualizarAutomatizacionPorId(id, body);
  await registrarAccion(usuario.email, usuario.nombre, 'Editó una automatización', body.nombre || id);
  return NextResponse.json({ ok: true });
})

export const DELETE = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoAutomatizaciones(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const id = decodeURIComponent(params.id);
  await eliminarAutomatizacionPorId(id);
  await registrarAccion(usuario.email, usuario.nombre, 'Eliminó una automatización', id);
  return NextResponse.json({ ok: true });
})
