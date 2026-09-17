import { NextResponse } from 'next/server';
import { conManejo } from '../../../../../../lib/apiHandler';
import { requireUsuario } from '../../../../../../lib/requireUsuario';
import { tienePermisoVer } from '../../../../../../lib/permisos';
import { leerComentarios, crearComentario, crearActividad } from '../../../../../../lib/datosTablero';

export const GET = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const comentarios = await leerComentarios(decodeURIComponent(params.id));
  return NextResponse.json({ comentarios });
})

export const POST = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const id = decodeURIComponent(params.id);
  const body = await request.json();
  if (!body.html) return NextResponse.json({ error: 'Falta el contenido del comentario.' }, { status: 400 });

  const comentarioId = `${id}-c${Date.now()}`;
  await crearComentario({ id: comentarioId, itemId: id, autor: usuario.nombre, html: body.html });
  await crearActividad({ id: `${id}-a${Date.now()}`, itemId: id, autor: usuario.nombre, texto: 'publicó un comentario' });

  return NextResponse.json({ ok: true, id: comentarioId });
})
