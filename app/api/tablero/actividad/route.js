import { NextResponse } from 'next/server';
import { conManejo } from '../../../../lib/apiHandler';
import { requireUsuario } from '../../../../lib/requireUsuario';
import { tienePermisoVer } from '../../../../lib/permisos';
import { leerActividad } from '../../../../lib/datosTablero';

// GET /api/tablero/actividad -> actividad de TODO el tablero (todos los items), para el
// panel de "Actividad del tablero" — a diferencia de /api/tablero/items/[id]/actividad,
// que es solo la de un contenido puntual.
export const GET = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const actividad = await leerActividad();
  return NextResponse.json({ actividad: actividad.slice(0, 200) });
})
