import { NextResponse } from 'next/server';
import { conManejo } from '../../../../lib/apiHandler';
import { requireUsuario } from '../../../../lib/requireUsuario';
import { tienePermisoVer } from '../../../../lib/permisos';
import { readSheet } from '../../../../lib/sheets';

// Lista liviana de personas del equipo (email + nombre) para el selector de "Responsable" del
// tablero — sin exponer roles, hash de contraseña ni estadísticas de login (eso queda reservado
// a Accesos). Solo usuarios activos.
export const GET = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const filas = await readSheet('Usuarios');
  const usuarios = filas
    .filter((f) => f.Email && f.Activo !== 'FALSE')
    .map((f) => ({ email: f.Email, nombre: f.Nombre || f.Email }));

  return NextResponse.json({ usuarios });
})
