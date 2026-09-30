import { NextResponse } from 'next/server';
import { conManejo } from '../../../../../lib/apiHandler';
import { requireUsuario } from '../../../../../lib/requireUsuario';
import { tienePermisoVer } from '../../../../../lib/permisos';
import { actualizarItemPorId, eliminarItemPorId, crearActividad, leerColumnas, leerItems } from '../../../../../lib/datosTablero';
import { registrarAccion } from '../../../../../lib/auditoria';
import { readSheet } from '../../../../../lib/sheets';
import { extraerMencionados, normalizarEmails } from '../../../../../lib/menciones';
import { enviarMail } from '../../../../../lib/mailer';

// Calcula a quién le corresponde una notificación personal ("para mí") por este cambio:
// - si se agregó a alguien como Responsable (o cualquier columna de personas) que antes no
//   estaba, esa persona;
// - si en la Descripción se mencionó a alguien con @Nombre, esa persona.
async function calcularDestinatarios({ id, cambios, emailActor }) {
  const destinatarios = new Set();

  if (cambios.cells !== undefined) {
    const [columnas, items] = await Promise.all([leerColumnas(), leerItems()]);
    const anterior = items.find((it) => it.id === id);
    const celdasAntes = anterior?.cells || {};
    columnas.filter((c) => c.tipo === 'person').forEach((c) => {
      const antes = normalizarEmails(celdasAntes[c.id]);
      const despues = normalizarEmails(cambios.cells[c.id]);
      despues.filter((email) => !antes.includes(email)).forEach((email) => destinatarios.add(email));
    });
  }

  // "textoMencionado" viaja junto con "descripciones" solo cuando se guardó una Descripción
  // puntual — así solo se notifica por lo que se acaba de escribir, no por todas las
  // descripciones guardadas anteriormente que quedaron sin tocar.
  if (cambios.textoMencionado !== undefined) {
    const filas = await readSheet('Usuarios');
    const usuariosEquipo = filas.filter((f) => f.Email).map((f) => ({ email: f.Email, nombre: f.Nombre || f.Email }));
    extraerMencionados(cambios.textoMencionado, usuariosEquipo).forEach((email) => destinatarios.add(email));
  }

  // Nunca te notifiques a vos mismo por algo que vos mismo hiciste (asignarte una tarea a
  // vos, mencionarte a vos en tu propio texto, etc.) — antes de esto aparecía igual en
  // "Para mí", lo cual era confuso porque uno no está "@" en su propia acción.
  destinatarios.delete(emailActor);

  return [...destinatarios];
}

export const PATCH = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const id = decodeURIComponent(params.id);
  const body = await request.json();
  const { actividadTexto, ...cambios } = body;

  const para = actividadTexto ? await calcularDestinatarios({ id, cambios, emailActor: usuario.email }) : [];
  await actualizarItemPorId(id, cambios);
  if (actividadTexto) {
    await crearActividad({ id: `${id}-a${Date.now()}`, itemId: id, autor: usuario.nombre, texto: actividadTexto, para });
    await registrarAccion(usuario.email, usuario.nombre, 'Editó contenido del tablero', actividadTexto);

    // Notifica por mail a cada mencionado/asignado nuevo — antes esto quedaba solo guardado en
    // la Actividad ("Para mí"), sin avisarle a nadie de verdad. Si el mail falla (credenciales
    // sin configurar, etc.) no debe tirar abajo el guardado del cambio en sí.
    if (para.length > 0) {
      const items = await leerItems();
      const nombreItem = items.find((it) => it.id === id)?.nombre || 'un contenido del tablero';
      const asunto = `${usuario.nombre} te mencionó en "${nombreItem}"`;
      const html = `
        <p><b>${usuario.nombre}</b> ${actividadTexto} en <b>"${nombreItem}"</b>:</p>
        <blockquote style="border-left:3px solid #ccc;padding-left:10px;color:#444;">${(cambios.textoMencionado || actividadTexto)}</blockquote>
        <p><a href="https://tuesday-ilce.vercel.app/app">Ver en Tuesday ILCE →</a></p>
      `;
      await Promise.allSettled(para.map((email) => enviarMail({ to: email, subject: asunto, html })));
    }
  }
  return NextResponse.json({ ok: true });
})

export const DELETE = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const id = decodeURIComponent(params.id);
  await eliminarItemPorId(id);
  await registrarAccion(usuario.email, usuario.nombre, 'Eliminó contenido del tablero', id);
  return NextResponse.json({ ok: true });
})
