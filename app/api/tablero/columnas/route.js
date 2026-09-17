import { NextResponse } from 'next/server';
import { conManejo } from '../../../../lib/apiHandler';
import { requireUsuario } from '../../../../lib/requireUsuario';
import { tienePermisoEditarEstructura } from '../../../../lib/permisos';
import { crearColumna } from '../../../../lib/datosTablero';

// Agregar/quitar columnas es estructura del tablero: reservado a Admin/SuperAdmin.
export const POST = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoEditarEstructura(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const body = await request.json();
  if (!body.id || !body.nombre) return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });

  await crearColumna({ id: body.id, nombre: body.nombre, tipo: body.tipo || 'text', orden: body.orden ?? 0, opciones: body.opciones || [] });
  return NextResponse.json({ ok: true });
})
