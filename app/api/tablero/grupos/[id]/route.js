import { NextResponse } from 'next/server';
import { conManejo } from '../../../../../lib/apiHandler';
import { requireUsuario } from '../../../../../lib/requireUsuario';
import { tienePermisoVer, tienePermisoEditarEstructura } from '../../../../../lib/permisos';
import { actualizarGrupoPorId, eliminarGrupoPorId } from '../../../../../lib/datosTablero';
import { registrarAccion } from '../../../../../lib/auditoria';

// Renombrar/reordenar/recolorear un grupo: cualquiera que use el tablero.
export const PATCH = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const id = decodeURIComponent(params.id);
  const body = await request.json();
  await actualizarGrupoPorId(id, body);
  const detalle = [
    body.nombre !== undefined ? `nombre → "${body.nombre}"` : null,
    body.color !== undefined ? 'cambió color' : null
  ].filter(Boolean).join(' · ') || id;
  await registrarAccion(usuario.email, usuario.nombre, 'Editó grupo del tablero', detalle);
  return NextResponse.json({ ok: true });
})

// Eliminar un grupo entero (y su contenido) queda reservado a Admin/SuperAdmin.
export const DELETE = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoEditarEstructura(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const id = decodeURIComponent(params.id);
  await eliminarGrupoPorId(id);
  await registrarAccion(usuario.email, usuario.nombre, 'Eliminó grupo del tablero', id);
  return NextResponse.json({ ok: true });
})
