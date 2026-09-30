import { NextResponse } from 'next/server';
import { conManejo } from '../../../../lib/apiHandler';
import { ejecutarAutomatizaciones } from '../../../../lib/automatizaciones';

// A este endpoint lo llama Vercel Cron todos los días (ver vercel.json), no una persona
// logueada — por eso no usa requireUsuario, sino el secreto que Vercel agrega solo en el
// header Authorization cuando la variable de entorno CRON_SECRET está cargada en el
// proyecto. Sin esa variable cargada, CUALQUIERA podría pegarle a esta URL y disparar el
// envío de mails — así que si no está configurada, se rechaza el pedido en vez de dejarlo
// pasar "por las dudas".
export const GET = conManejo(async (request) => {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    return NextResponse.json({ error: 'Falta configurar la variable de entorno CRON_SECRET en Vercel.' }, { status: 500 });
  }
  const header = request.headers.get('authorization') || '';
  if (header !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const resultado = await ejecutarAutomatizaciones();
  return NextResponse.json({ ok: true, ...resultado });
})
