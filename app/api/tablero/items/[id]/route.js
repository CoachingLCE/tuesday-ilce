import { NextResponse } from 'next/server';
import { conManejo } from '../../../../../lib/apiHandler';
import { requireUsuario } from '../../../../../lib/requireUsuario';
import { tienePermisoVer } from '../../../../../lib/permisos';
import { actualizarItemPorId, eliminarItemPorId, crearActividad, leerColumnas, leerItems } from '../../../../../lib/datosTablero';
import { registrarAccion } from '../../../../../lib/auditoria';
import { readSheet } from '../../../../../lib/sheets';
import { extraerMencionados, normalizarEmails } from '../../../../../lib/menciones';

// Calcula a quién le corresponde una notificación personal ("para mí") por este cambio:
// - si se agregó a alguien como Responsable (o cualquier columna de personas) que antes no
//   estaba, esa persona;
// - si en la Descripción se mencionó a alguien con @Nombre, esa persona.
async function calcularDestinatarios({ id, cambios }) {
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

  if (cambios.body !== undefined) {
    const filas = await readSheet('Usuarios');
    const usuariosEquipo = filas.filter((f) => f.Email).map((f) => ({ email: f.Email, nombre: f.Nombre || f.Email }));
    extraerMencionados(cambios.body, usuariosEquipo).forEach((email) => destinatarios.add(email));
  }

  return [...destinatarios];
}

export const PATCH = conManejo(async (request, { params }) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const id = decodeURIComponent(params.id);
  const body = await request.json();
  const { actividadTexto, ...cambios } = body;

  const para = actividadTexto ? await calcularDestinatarios({ id, cambios }) : [];
  await actualizarItemPorId(id, cambios);
  if (actividadTexto) {
    await crearActividad({ id: `${id}-a${Date.now()}`, itemId: id, autor: usuario.nombre, texto: actividadTexto, para });
    await registrarAccion(usuario.email, usuario.nombre, 'Editó contenido del tablero', actividadTexto);
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
