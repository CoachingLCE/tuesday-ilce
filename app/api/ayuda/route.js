import { NextResponse } from 'next/server';
import { conManejo } from '../../../lib/apiHandler';
import { requireUsuario } from '../../../lib/requireUsuario';
import { registrarAccion } from '../../../lib/auditoria';

// POST /api/ayuda -> { texto }
// Cuando alguien busca algo en la ayuda ("Necesito ayuda") y no aparece nada, puede apretar "Avisar que falta esto": queda anotado en
// el Historial de acciones como "Pidió ayuda que no encontró", así se ve qué conviene sumar a la ayuda. No envía correos ni cambia datos.
export const POST = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 }); }
  const texto = String((body && body.texto) || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (texto.length < 2) return NextResponse.json({ error: 'Escribí qué buscabas' }, { status: 400 });
  await registrarAccion(usuario.email, usuario.nombre, 'Pidió ayuda que no encontró', texto);
  return NextResponse.json({ ok: true });
});
