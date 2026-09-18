// Detecta menciones "@Nombre" en un texto (plano o HTML) y las resuelve a emails,
// comparando contra la lista de personas del equipo ({email, nombre}). Se usa tanto para
// comentarios como para la Descripción de un contenido, así ambos lugares pueden avisarle
// a alguien puntual cuando lo mencionan.
export function extraerMencionados(texto, usuariosEquipo) {
  if (!texto || !usuariosEquipo?.length) return [];
  const plano = texto.replace(/<[^>]+>/g, ' ');
  const emails = new Set();
  usuariosEquipo.forEach((u) => {
    if (!u.nombre) return;
    const escapado = u.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`@${escapado}\\b`, 'i').test(plano)) emails.add(u.email);
  });
  return [...emails];
}

/** Normaliza el valor de una celda tipo "person" (puede ser un array de emails, un email
 * suelto en texto —formato viejo—, o vacío) a un array de emails. */
export function normalizarEmails(valor) {
  if (Array.isArray(valor)) return valor;
  return valor ? [valor] : [];
}
