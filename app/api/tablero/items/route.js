import { NextResponse } from 'next/server';
import { conManejo } from '../../../../lib/apiHandler';
import { requireUsuario } from '../../../../lib/requireUsuario';
import { tienePermisoVer } from '../../../../lib/permisos';
import { crearItem, crearActividad } from '../../../../lib/datosTablero';

export const POST = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const body = await request.json();
  if (!body.id || !body.grupoId) return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });

  await crearItem({
    id: body.id, grupoId: body.grupoId, nombre: body.nombre || '', orden: body.orden ?? 0,
    cells: body.cells || {}, body: body.body || '', creadoPor: usuario.nombre
  });
  await crearActividad({ id: `${body.id}-a${Date.now()}`, itemId: body.id, autor: usuario.nombre, texto: 'creó el contenido' });

  return NextResponse.json({ ok: true });
})
