// Se actualiza a mano cada vez que se sube un conjunto de mejoras importante.
// Lo más nuevo va primero. Se muestra al hacer clic en el badge de versión.
export const CHANGELOG = [
  {
    version: '0.5.0',
    fecha: '2026-09-17',
    cambios: [
      'Tabla del tablero: las columnas ahora se reparten dentro del ancho de la pantalla en vez de forzar scroll horizontal.',
      'Selector de "Responsable" rediseñado: se abre flotando sobre la tabla (ya no se recorta dentro de la celda), permite elegir varias personas a la vez, resalta a las ya asignadas y muestra sus avatares en la celda.',
      'Nuevo filtro por Responsable como chips arriba del tablero (con contador por persona, "Sin responsable" y buscador si hay muchas personas), combinable con los filtros de Estado y Tipo.',
      'Los grupos ahora se colapsan/expanden haciendo clic en cualquier parte de su barra de título, no solo en la flechita.'
    ]
  },
  {
    version: '0.4.0',
    fecha: '2026-09-17',
    cambios: [
      '"Historial de cambios" ahora registra toda la actividad del tablero (crear/editar/eliminar grupos, columnas, contenidos y comentarios), no solo accesos y contraseñas.',
      'Tabla del tablero con más aire: filas y celdas más altas, columnas más anchas — deja de sentirse comprimida.'
    ]
  },
  {
    version: '0.3.0',
    fecha: '2026-09-17',
    cambios: [
      'Nuevo tipo de columna "Archivos": chips con miniatura/ícono según el tipo (imagen, video, PDF o enlace), agregar y quitar archivos desde la misma celda, y vista completa al hacer clic — ya no es una sección fija aparte, ahora es una columna configurable como cualquier otra.',
      'Pestañas "Todos / Para revisar / Reels / Post" ahora calzan exacto con el calendario de contenidos de referencia (usan las columnas "Estado" y "Tipo" del tablero).',
      'Botón "🧪 Cargar contenido de ejemplo": para tableros que ya tenían columnas o grupos propios y no dispararon el ejemplo automático, agrega el mismo calendario de ejemplo (columnas, grupos Septiembre/Agosto y 7 contenidos) sin borrar nada de lo que ya estaba cargado.'
    ]
  },
  {
    version: '0.2.0',
    fecha: '2026-09-17',
    cambios: [
      'Pestañas rápidas y chips de colores para filtrar por Estado/Tipo de un clic, con contador en cada una, y una barra de estadísticas con el desglose ("7 contenidos · 1 en proceso · …").',
      '🔔 Actividad del tablero: un panel con todo lo que pasó en todo el tablero (no solo un contenido), con aviso de cuántas cosas pasaron hoy.',
      'En "Responsable", Admin/SuperAdmin pueden crear una persona nueva (con email real) sin salir del tablero.',
      'Al crear una columna, se sugiere el tipo automáticamente según el nombre que escribís.',
      'Indicador de "Guardando… / ✓ Guardado" y adjuntos con miniatura real e ícono según el tipo, con vista completa al hacer clic.',
      'El tablero recién creado ahora arranca con un ejemplo cargado (grupos, columnas y contenidos de muestra) en vez de una pantalla vacía.'
    ]
  },
  {
    version: '0.1.0',
    fecha: '2026-09-17',
    cambios: [
      'Primera versión de Tuesday ILCE: tablero de contenidos por grupos y columnas configurables (Estado, Responsable, Fecha, Tipo, Archivos), con comentarios, @menciones, adjuntos y actividad por contenido.',
      'Login con roles (Colaborador, Admin, SuperAdmin), pantalla de Accesos para gestionar usuarios, e Historial de cambios (auditoría) para Admin/SuperAdmin.'
    ]
  }
];
