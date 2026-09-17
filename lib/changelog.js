// Se actualiza a mano cada vez que se sube un conjunto de mejoras importante.
// Lo más nuevo va primero. Se muestra al hacer clic en el badge de versión.
export const CHANGELOG = [
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
