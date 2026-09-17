import { NextResponse } from 'next/server';
import { conManejo } from '../../../lib/apiHandler';
import { requireUsuario } from '../../../lib/requireUsuario';
import { leerHistorialCompleto } from '../../../lib/datosHistorial';

export const GET = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const desde = searchParams.get('desde') || '';
  const hasta = searchParams.get('hasta') || '';
  const filtroUsuario = (searchParams.get('usuario') || '').toLowerCase();

  let historial = await leerHistorialCompleto();
  if (desde) historial = historial.filter((h) => h.fecha && h.fecha.slice(0, 10) >= desde);
  if (hasta) historial = historial.filter((h) => h.fecha && h.fecha.slice(0, 10) <= hasta);
  if (filtroUsuario) historial = historial.filter((h) => (h.usuario || '').toLowerCase() === filtroUsuario);

  return NextResponse.json({ historial: historial.slice(0, 500) });
})
