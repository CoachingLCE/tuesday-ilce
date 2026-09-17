import { verificarToken } from './sessionToken';
import { findUsuario } from './auth';

/**
 * Verifica el header Authorization: Bearer <token> de un request.
 * Devuelve el usuario ACTUAL (releído del Sheet, no lo que mandó el cliente)
 * o null si el token es inválido, vencido, el usuario no existe, está desactivado,
 * o la contraseña cambió después de que se emitió este token (sesión invalidada).
 *
 * Usar en toda API route que lea/escriba datos, así:
 *   const usuario = await requireUsuario(request);
 *   if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
 *   if (!tienePermisoEditar(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
 */
export async function requireUsuario(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = verificarToken(token);
  if (!payload) return null;

  const usuario = await findUsuario(payload.email);
  if (!usuario || !usuario.activo) return null;

  // Si la contraseña cambió después de emitido este token, el hash guardado en el
  // Sheet ya no coincide con el que quedó firmado adentro del token — se invalida la
  // sesión sin necesidad de una lista de tokens revocados aparte.
  if (payload.passwordHash !== usuario.passwordHash) return null;

  return usuario;
}
