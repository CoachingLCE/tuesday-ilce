import { appendRow } from './sheets';

/**
 * Registra una acción en la pestaña "Historial".
 * Columnas esperadas: Fecha, Email, Usuario, Accion, Detalle
 */
export async function registrarAccion(email, nombre, accion, detalle) {
  try {
    await appendRow('Historial', {
      Fecha: new Date().toISOString(),
      Email: email || '',
      Usuario: nombre || email || '',
      Accion: accion,
      Detalle: detalle || ''
    });
  } catch (err) {
    // La auditoría nunca debe romper la acción principal del usuario
    console.error('No se pudo registrar en Historial:', err.message);
  }
}
