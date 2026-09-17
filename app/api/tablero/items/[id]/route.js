import { NextResponse } from 'next/server';
import { conManejo } from '../../../../../../lib/apiHandler';
import { requireUsuario } from '../../../../../../lib/requireUsuario';
import { tienePermisoVer } from '../../../../../../lib/permisos';
import { leerActividad } from '../../../../../../lib/datosTablero';

export const GET = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const actividad = await leerActividad(decodeURIComponent(params.id));
  return NextResponse.json({ actividad });
})
