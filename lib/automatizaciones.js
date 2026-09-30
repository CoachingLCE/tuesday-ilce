import { readSheet, appendRow, patchRow, clearRows } from './sheets';
import { leerItems, leerGrupos, leerColumnas } from './datosTablero';
import { enviarMail } from './mailer';

function parseJson(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

/* ---------------- CRUD de reglas de automatización ---------------- */

export async function leerAutomatizaciones() {
  const filas = await readSheet('TableroAutomatizaciones');
  return filas.filter((f) => f.Id).map((f) => ({
    id: f.Id,
    tipo: f.Tipo || 'recordatorio_vencimiento',
    activo: f.Activo === 'TRUE',
    nombre: f.Nombre || '',
    columnaFechaId: f.ColumnaFechaId || '',
    diasAntes: f.DiasAntes !== undefined && f.DiasAntes !== '' ? parseInt(f.DiasAntes, 10) : 0,
    columnaEstadoId: f.ColumnaEstadoId || '',
    estadosExcluidos: parseJson(f.EstadosExcluidosJson, []),
    destinatarios: f.Destinatarios || '',
    frecuencia: f.Frecuencia || 'diaria',
    diaSemana: f.DiaSemana !== undefined && f.DiaSemana !== '' ? parseInt(f.DiaSemana, 10) : null,
    creadoPor: f.CreadoPor || '',
    creadoEn: f.CreadoEn || '',
    _rowIndex: f._rowIndex
  }));
}

export async function crearAutomatizacion(a) {
  await appendRow('TableroAutomatizaciones', {
    Id: a.id,
    Tipo: a.tipo,
    Activo: a.activo === false ? 'FALSE' : 'TRUE',
    Nombre: a.nombre || '',
    ColumnaFechaId: a.columnaFechaId || '',
    DiasAntes: a.diasAntes ?? '',
    ColumnaEstadoId: a.columnaEstadoId || '',
    EstadosExcluidosJson: JSON.stringify(a.estadosExcluidos || []),
    Destinatarios: a.destinatarios || '',
    Frecuencia: a.frecuencia || '',
    DiaSemana: a.diaSemana ?? '',
    CreadoPor: a.creadoPor || '',
    CreadoEn: a.creadoEn || new Date().toISOString()
  });
}

export async function actualizarAutomatizacionPorId(id, cambios) {
  const filas = await readSheet('TableroAutomatizaciones');
  const fila = filas.find((f) => f.Id === id);
  if (!fila) throw new Error('Automatización no encontrada');
  const patch = {};
  if (cambios.activo !== undefined) patch.Activo = cambios.activo ? 'TRUE' : 'FALSE';
  if (cambios.nombre !== undefined) patch.Nombre = cambios.nombre;
  if (cambios.columnaFechaId !== undefined) patch.ColumnaFechaId = cambios.columnaFechaId;
  if (cambios.diasAntes !== undefined) patch.DiasAntes = cambios.diasAntes;
  if (cambios.columnaEstadoId !== undefined) patch.ColumnaEstadoId = cambios.columnaEstadoId;
  if (cambios.estadosExcluidos !== undefined) patch.EstadosExcluidosJson = JSON.stringify(cambios.estadosExcluidos);
  if (cambios.destinatarios !== undefined) patch.Destinatarios = cambios.destinatarios;
  if (cambios.frecuencia !== undefined) patch.Frecuencia = cambios.frecuencia;
  if (cambios.diaSemana !== undefined) patch.DiaSemana = cambios.diaSemana;
  await patchRow('TableroAutomatizaciones', fila._rowIndex, patch);
}

export async function eliminarAutomatizacionPorId(id) {
  const filas = await readSheet('TableroAutomatizaciones');
  const fila = filas.find((f) => f.Id === id);
  if (!fila) return;
  await clearRows('TableroAutomatizaciones', [fila._rowIndex]);
}

/* ---------------- Log de envíos (para no repetir el mismo aviso) ---------------- */

async function yaSeEnvio(automatizacionId, itemId, clave) {
  const filas = await readSheet('TableroRecordatoriosEnviados');
  return filas.some((f) => f.AutomatizacionId === automatizacionId && f.ItemId === itemId && f.Clave === clave);
}
async function marcarEnviado(automatizacionId, itemId, clave) {
  await appendRow('TableroRecordatoriosEnviados', {
    Id: `${automatizacionId}-${itemId}-${Date.now()}`,
    AutomatizacionId: automatizacionId, ItemId: itemId, Clave: clave,
    EnviadoEn: new Date().toISOString()
  });
}

// Argentina está en UTC-3 fijo (sin horario de verano desde 2009) — el cron corre en UTC,
// así que hay que correr el reloj para saber qué día es "hoy" para el equipo, no para el
// servidor.
function hoyArgentina() {
  const ahora = new Date();
  return new Date(ahora.getTime() - 3 * 60 * 60 * 1000);
}

function resolverDestinatarios(automatizacion, item, columnaPersona) {
  const dest = (automatizacion.destinatarios || '').trim();
  if (dest.toLowerCase() === 'responsable') {
    if (!columnaPersona) return [];
    const valor = item.cells?.[columnaPersona.id];
    return Array.isArray(valor) ? valor : (valor ? [valor] : []);
  }
  return dest.split(',').map((e) => e.trim()).filter(Boolean);
}

/* ---------------- Ejecutar: recordatorio de vencimiento ---------------- */
// Por cada contenido con fecha cargada en la columna elegida, si faltan "diasAntes" días
// o menos (incluye ya vencidos), y no está en un estado excluido (ej. "Listo"), avisa una
// única vez por fecha — si la fecha del contenido cambia después, se vuelve a poder avisar.
async function ejecutarRecordatorioVencimiento(automatizacion, items, columnas, hoyDate) {
  if (!automatizacion.columnaFechaId) return 0;
  const columnaPersona = columnas.find((c) => c.tipo === 'person');
  let enviados = 0;

  for (const item of items) {
    const valorFecha = item.cells?.[automatizacion.columnaFechaId];
    if (!valorFecha) continue;

    if (automatizacion.columnaEstadoId) {
      const estadoActual = item.cells?.[automatizacion.columnaEstadoId];
      if (estadoActual && automatizacion.estadosExcluidos.includes(estadoActual)) continue;
    }

    const fechaItem = new Date(valorFecha + 'T00:00:00');
    const diasFaltan = Math.round((fechaItem - hoyDate) / 86400000);
    if (diasFaltan > automatizacion.diasAntes) continue;

    const clave = `venc-${valorFecha}`;
    if (await yaSeEnvio(automatizacion.id, item.id, clave)) continue;

    const destinatarios = resolverDestinatarios(automatizacion, item, columnaPersona);
    if (destinatarios.length === 0) { await marcarEnviado(automatizacion.id, item.id, clave); continue; }

    const asunto = diasFaltan < 0
      ? `⏰ Vencido: ${item.nombre}`
      : diasFaltan === 0 ? `⏰ Vence hoy: ${item.nombre}` : `⏰ Vence en ${diasFaltan} día${diasFaltan === 1 ? '' : 's'}: ${item.nombre}`;
    const html = `
      <p>${asunto}</p>
      <p>Fecha cargada: <b>${valorFecha}</b></p>
      <p><a href="https://tuesday-ilce.vercel.app/">Ver en Tuesday ILCE →</a></p>
    `;
    await Promise.allSettled(destinatarios.map((email) => enviarMail({ to: email, subject: asunto, html })));
    await marcarEnviado(automatizacion.id, item.id, clave);
    enviados++;
  }
  return enviados;
}

/* ---------------- Ejecutar: resumen periódico ---------------- */
// Manda un único mail con lo vencido y lo próximo a vencer (usando la misma columna de
// fecha y el mismo horizonte "diasAntes" que el recordatorio), agrupado por contenido.
async function ejecutarResumenPeriodico(automatizacion, items, columnas, grupos, hoyDate, hoyISO) {
  const destinatarios = (automatizacion.destinatarios || '').split(',').map((e) => e.trim()).filter(Boolean);
  if (destinatarios.length === 0) return false;

  const clave = `resumen-${hoyISO}`;
  if (await yaSeEnvio(automatizacion.id, 'RESUMEN', clave)) return false;

  const columnaFecha = automatizacion.columnaFechaId ? columnas.find((c) => c.id === automatizacion.columnaFechaId) : null;
  const filas = [];
  if (columnaFecha) {
    for (const item of items) {
      const valorFecha = item.cells?.[columnaFecha.id];
      if (!valorFecha) continue;
      if (automatizacion.columnaEstadoId) {
        const estadoActual = item.cells?.[automatizacion.columnaEstadoId];
        if (estadoActual && automatizacion.estadosExcluidos.includes(estadoActual)) continue;
      }
      const diasFaltan = Math.round((new Date(valorFecha + 'T00:00:00') - hoyDate) / 86400000);
      if (diasFaltan > (automatizacion.diasAntes || 7)) continue;
      const grupo = grupos.find((g) => g.id === item.grupoId);
      filas.push({ nombre: item.nombre, grupo: grupo?.nombre || '', valorFecha, diasFaltan });
    }
  }
  filas.sort((a, b) => a.diasFaltan - b.diasFaltan);

  const asunto = `📋 Resumen de Tuesday ILCE — ${filas.length} contenido${filas.length === 1 ? '' : 's'} para revisar`;
  const filasHtml = filas.length > 0
    ? filas.map((f) => `<li>${f.diasFaltan < 0 ? '🔴 Vencido' : f.diasFaltan === 0 ? '🟠 Vence hoy' : `🟡 Faltan ${f.diasFaltan}d`} — <b>${f.nombre}</b>${f.grupo ? ` (${f.grupo})` : ''} — ${f.valorFecha}</li>`).join('')
    : '<li>Nada vencido ni por vencer 🎉</li>';
  const html = `
    <p>Resumen de contenidos del tablero:</p>
    <ul>${filasHtml}</ul>
    <p><a href="https://tuesday-ilce.vercel.app/">Ver en Tuesday ILCE →</a></p>
  `;
  await Promise.allSettled(destinatarios.map((email) => enviarMail({ to: email, subject: asunto, html })));
  await marcarEnviado(automatizacion.id, 'RESUMEN', clave);
  return true;
}

/* ---------------- Punto de entrada del cron ---------------- */
export async function ejecutarAutomatizaciones() {
  const automatizaciones = (await leerAutomatizaciones()).filter((a) => a.activo);
  if (automatizaciones.length === 0) return { procesadas: 0, recordatoriosEnviados: 0, resumenesEnviados: 0 };

  const [items, columnas, grupos] = await Promise.all([leerItems(), leerColumnas(), leerGrupos()]);
  const hoy = hoyArgentina();
  hoy.setUTCHours(0, 0, 0, 0);
  const hoyISO = hoy.toISOString().slice(0, 10);

  let recordatoriosEnviados = 0, resumenesEnviados = 0;
  for (const automatizacion of automatizaciones) {
    if (automatizacion.tipo === 'recordatorio_vencimiento') {
      recordatoriosEnviados += await ejecutarRecordatorioVencimiento(automatizacion, items, columnas, hoy);
    } else if (automatizacion.tipo === 'resumen_periodico') {
      const corresponde = automatizacion.frecuencia === 'diaria' ||
        (automatizacion.frecuencia === 'semanal' && hoy.getUTCDay() === automatizacion.diaSemana);
      if (corresponde) {
        const enviado = await ejecutarResumenPeriodico(automatizacion, items, columnas, grupos, hoy, hoyISO);
        if (enviado) resumenesEnviados++;
      }
    }
  }
  return { procesadas: automatizaciones.length, recordatoriosEnviados, resumenesEnviados };
}
