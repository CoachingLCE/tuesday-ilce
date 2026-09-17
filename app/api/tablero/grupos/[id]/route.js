import { NextResponse } from 'next/server';
import { conManejo } from '../../../../../lib/apiHandler';
import { requireUsuario } from '../../../../../lib/requireUsuario';
import { tienePermisoVer, tienePermisoEditarEstructura } from '../../../../../lib/permisos';
import { actualizarGrupoPorId, eliminarGrupoPorId } from '../../../../../lib/datosTablero';

// Renombrar/reordenar/recolorear un grupo: cualquiera que use el tablero.
export const PATCH = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const body = await request.json();
  await actualizarGrupoPorId(decodeURIComponent(params.id), body);
  return NextResponse.json({ ok: true });
})

// Eliminar un grupo entero (y su contenido) queda reservado a Admin/SuperAdmin.
export const DELETE = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoEditarEstructura(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  await eliminarGrupoPorId(decodeURIComponent(params.id));
  return NextResponse.json({ ok: true });
})
