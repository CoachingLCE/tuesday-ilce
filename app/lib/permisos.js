// Roles posibles: 'Colaborador', 'Admin', 'SuperAdmin'.
// Un usuario tiene un único rol (selección única, no combinable).

function tieneAlguno(usuario, roles) {
  if (!usuario || !usuario.roles) return false;
  return usuario.roles.some((r) => roles.includes(r));
}

// Ver y usar el tablero (crear/editar contenidos, comentar, etc.) — todos los roles logueados.
export function tienePermisoVer(usuario) {
  return tieneAlguno(usuario, ['Colaborador', 'Admin', 'SuperAdmin']);
}

// Editar la estructura del tablero: agregar/eliminar columnas y grupos.
// Cualquier persona logueada puede cargar y mover contenidos; esto es solo para tocar
// la estructura (columnas/grupos), reservado a Admin/SuperAdmin para que no se desarme
// por accidente entre todo el equipo.
export function tienePermisoEditarEstructura(usuario) {
  return tieneAlguno(usuario, ['Admin', 'SuperAdmin']);
}

// Ver y gestionar la pantalla de Accesos: agregar/desactivar usuarios, resetear contraseñas.
export function tienePermisoAccesos(usuario) {
  return tieneAlguno(usuario, ['Admin', 'SuperAdmin']);
}

// Crear o eliminar otros Admins / Super Admins (reservado a Super Admin).
export function tienePermisoGestionarAdmins(usuario) {
  return tieneAlguno(usuario, ['SuperAdmin']);
}

// Ver el Historial de cambios (auditoría de acciones): reservado a Admin/SuperAdmin —
// Colaborador entra a la pestaña pero ve el mensaje de "sin acceso" en vez del contenido.
export function tienePermisoAuditoria(usuario) {
  return tieneAlguno(usuario, ['Admin', 'SuperAdmin']);
}
