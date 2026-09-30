import { NextResponse } from 'next/server';
import { conManejo } from '../../../../lib/apiHandler';
import { requireUsuario } from '../../../../lib/requireUsuario';
import { tienePermisoAutomatizaciones } from '../../../../lib/permisos';
import { leerAutomatizaciones, crearAutomatizacion } from '../../../../lib/automatizaciones';
import { registrarAccion } from '../../../../lib/auditoria';

// Reservado a Admin/SuperAdmin: una automatización mal armada puede mandar mails de más a
// todo el equipo, así que no queda abierto a cualquier Colaborador.
export const GET = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoAutomatizaciones(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const automatizaciones = await leerAutomatizaciones();
  return NextResponse.json({ automatizaciones });
})

export const POST = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoAutomatizaciones(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const body = await request.json();
  if (!body.tipo || !body.nombre) return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 });
  if (body.tipo === 'recordatorio_vencimiento' && !body.columnaFechaId) {
    return NextResponse.json({ error: 'Elegí una columna de fecha.' }, { status: 400 });
  }
  if (!body.destinatarios || !body.destinatarios.trim()) {
    return NextResponse.json({ error: 'Faltan destinatarios.' }, { status: 400 });
  }

  const id = `auto_${Date.now()}`;
  await crearAutomatizacion({
    id, tipo: body.tipo, activo: body.activo !== false, nombre: body.nombre,
    columnaFechaId: body.columnaFechaId || '', diasAntes: body.diasAntes ?? 2,
    columnaEstadoId: body.columnaEstadoId || '', estadosExcluidos: body.estadosExcluidos || [],
    destinatarios: body.destinatarios, frecuencia: body.frecuencia || 'diaria',
    diaSemana: body.diaSemana ?? null, creadoPor: usuario.nombre
  });
  await registrarAccion(usuario.email, usuario.nombre, 'Creó una automatización', body.nombre);
  return NextResponse.json({ ok: true, id });
})
