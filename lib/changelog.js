// Se actualiza a mano cada vez que se sube un conjunto de mejoras importante.
// Lo más nuevo va primero. Se muestra al hacer clic en el badge de versión.
export const CHANGELOG = [
  {
    version: '0.10.0',
    fecha: '2026-09-29',
    cambios: [
      'Descripción: ahora queda guardada y fija apenas la guardás — para volver a tocarla hay que apretar "Editar" primero (antes se podía editar siempre, sin querer).',
      'Se pueden agregar varias descripciones al mismo contenido ("+ Agregar otra descripción"), cada una con su propio texto y guardado independiente.',
      'Comentarios: ahora son por cada descripción en vez de uno solo para todo el contenido — cada descripción tiene su propia caja de comentarios.'
    ]
  },
  {
    version: '0.9.9',
    fecha: '2026-09-29',
    cambios: [
      'El botón de versión (abajo a la derecha) en realidad nunca parpadeaba con novedades no vistas — la mejora de la v0.9.6 se había guardado en un archivo que no era el que se usa de verdad. Ahora sí: parpadea cuando hay novedades que todavía no viste, se apaga solo al hacer clic, y el cartel de Novedades muestra por defecto solo lo del mes en curso (con "Ver novedades anteriores" para el resto).'
    ]
  },
  {
    version: '0.9.8',
    fecha: '2026-09-29',
    cambios: [
      'El botón "❓ Necesito ayuda" ya no se superpone con "Comentar" (ni con otros botones del detalle de tarea o de Actividad del tablero) — ahora se oculta mientras esos paneles están abiertos.',
      'Detalle de tarea: ahora se puede agrandar/achicar arrastrando su borde izquierdo — queda guardado para la próxima vez.',
      'Actividad del tablero: la pestaña "Para mí" es siempre la que se abre primero, y ambas pestañas ahora muestran cuántas actividades tienen.'
    ]
  },
  {
    version: '0.9.7',
    fecha: '2026-09-29',
    cambios: [
      'Actualizado el contenido del "❓ Necesito ayuda": faltaban por completo los pasos de Historial de cambios y Accesos (solo cubría el tablero).'
    ]
  },
  {
    version: '0.9.6',
    fecha: '2026-09-29',
    cambios: [
      'El boton de version (abajo a la derecha) ahora parpadea cuando hay novedades que todavia no viste, y se apaga al hacer clic. El cartel muestra las novedades del mes, con un link para ver las anteriores.'
    ]
  },
  {
    version: '0.9.5',
    fecha: '2026-09-28',
    cambios: [
      'Se corrigió que el nombre de un contenido, cuando era largo, se superpusiera con el chip de la columna "Tipo" (u otra columna) de al lado — la columna "Nombre" quedaba más angosta que el texto que en realidad podía ocupar. Se ensanchó la columna y se ajustó el recorte con "…" para que respete su propio espacio sin invadir la columna siguiente.',
      'El nombre del contenido ahora muestra el texto completo al pasar el mouse por encima (tooltip), útil para los que quedan recortados con "…".'
    ]
  },
  {
    version: '0.9.4',
    fecha: '2026-09-18',
    cambios: [
      'Se manda un mail de verdad a quien te menciona con @ (en la Descripción o al asignarte) — antes solo quedaba guardado en la Actividad ("Para mí"), sin avisar a nadie.',
      'La Descripción ahora tiene un botón "💾 Guardar" que aparece apenas escribís algo, con confirmación visual ("✓ Guardado") — antes se guardaba solo al hacer clic afuera, sin ninguna señal de que se había completado.'
    ]
  },
  {
    version: '0.9.3',
    fecha: '2026-09-18',
    cambios: [
      'Se puede subir archivos a Drive sin necesitar una cuenta de Google Workspace: ahora la app también puede guardar los adjuntos en una cuenta de Google personal (usa tus 15 GB gratis). Es opcional y requiere una configuración de una sola vez — ver SETUP.md, sección 2.1, opción B.',
      'En el menú rápido de una columna tipo Estado (al hacer clic en el chip de estado de un contenido), ahora se puede crear una opción nueva con su nombre y color sin salir de ahí — antes solo se podía agregar una opción entrando al editor de columnas.',
      'Se sacó el botón "🧪 Cargar contenido de ejemplo" y el tablero de ejemplo que se armaba solo en un tablero vacío — ya no hace falta con el tablero en uso real.',
      'Al pasar el mouse por un link dentro de la Descripción, ahora se ve el cursor de "mano" (antes se veía el cursor de texto aunque el link ya se pudiera abrir con un clic).'
    ]
  },
  {
    version: '0.9.2',
    fecha: '2026-09-18',
    cambios: [
      'La columna Fecha ahora se llama "Fecha de publicación" (en tableros nuevos; si ya tenías uno armado, podés renombrar la columna existente desde "⚙️ Columnas").',
      'La Fecha ahora se pinta sola según cuánto falta: rojo si faltan 15 días o menos (o si ya venció), amarillo si faltan entre 16 y 30 días.',
      'Se corrigió que el selector de color de un grupo (el circulito de color al lado del nombre) se viera mal o cortado, sobre todo con el grupo colapsado — ahora se dibuja siempre por encima de todo, igual que los demás menús. Se aplicó la misma corrección al selector de color de las opciones de una columna tipo Estado, y al menú de "@mencionar" en Comentarios.',
      'Al hacer clic en un link dentro de la Descripción de un contenido, ahora se abre en una pestaña nueva (antes el clic no hacía nada).',
      'En la fecha del tablero y en los filtros de Historial, un clic en cualquier parte del campo abre el calendario (antes había que acertarle al ícono).',
      'El botón 🗑 para eliminar un grupo ahora se ve como un botón de verdad, más fácil de encontrar.',
      'Al arrastrar un grupo para reordenarlo, ahora se ve una línea clara de dónde va a quedar al soltarlo, y el grupo recién movido queda resaltado un momento.'
    ]
  },
  {
    version: '0.9.1',
    fecha: '2026-09-18',
    cambios: [
      'El menú de "Estado" (Hacer/En proceso/etc.) a veces se abría tapado por otras filas de la tabla, sobre todo en tableros con varios contenidos — ahora siempre se dibuja por encima de todo, igual que ya pasaba con el de Responsable.',
      'Se agregó un botón "⚙️ Columnas" bien visible arriba de la tabla (al lado de Lista/Calendario) para agregar, renombrar, cambiarle el color a las opciones, o borrar una columna — antes solo se podía entrar ahí desde un "＋" chiquito al final de los encabezados, poco visible.'
    ]
  },
  {
    version: '0.9.0',
    fecha: '2026-09-18',
    cambios: [
      'El botón "❓ Necesito ayuda" y el badge de "Novedades" se superponían y no se veía ninguno de los dos completo — ahora quedan uno arriba del otro, ambos visibles.',
      'El ícono del calendario en los campos de Fecha (columna Fecha del tablero, y filtros de Historial) se veía negro sobre negro en modo oscuro — ahora se ve bien.',
      'Descripción: si pegás un link (por ejemplo de Google Calendar o Drive), ahora se convierte solo en un link clickeable en vez de quedar como texto plano. También podés escribir o pegar el link junto con más texto — al guardar, cualquier link suelto se detecta igual.',
      'Ahora se puede mencionar a una persona con @Nombre también en la Descripción de un contenido (antes esto solo se podía en Comentarios) — le llega como notificación personal.',
      'Notificaciones: el 🔔 ahora separa "Para mí" (te mencionaron con @ en un comentario o en la descripción, o te asignaron como responsable) de "General" (toda la actividad del tablero), cada una con su propio contador. Antes, además, lo que ya habías visto se olvidaba al volver a cargar la página — ahora se recuerda.',
      'Subida de archivos: se corrigió el error "Service Accounts do not have storage quota" al subir un archivo — la carpeta de Drive configurada tiene que estar dentro de una Unidad compartida (Shared Drive), no en una carpeta común. Ver SETUP.md, sección 2.1, con los pasos actualizados.'
    ]
  },
  {
    version: '0.8.0',
    fecha: '2026-09-18',
    cambios: [
      'Subida real de archivos: la columna "Archivos" ahora sube el archivo desde tu computadora (se guarda en una carpeta de Google Drive) en vez de solo aceptar un link pegado a mano — con miniatura automática y vista previa dentro de la app para imágenes, PDFs, videos y documentos de Office. Requiere agregar GOOGLE_DRIVE_FOLDER_ID (ver SETUP.md). Límite: 4 MB por archivo.',
      'Nueva vista Calendario (además de la vista Lista de siempre), con navegación por mes y los contenidos ubicados en el día de su columna Fecha — un botón arriba del tablero alterna entre las dos.',
      'Buscador mejorado: ahora busca por título, por el texto de la descripción y de las columnas de texto libre, y por el nombre del responsable — y ya no lo tapa un filtro de pestaña que haya quedado puesto (se resetea solo a "Todos" al escribir).',
      'En el editor de columnas, las opciones de una columna tipo Estado (por ejemplo "Estado" o "Tipo") ahora tienen un selector de color propio además de poder cambiarles el nombre o agregar/quitar opciones.'
    ]
  },
  {
    version: '0.7.0',
    fecha: '2026-09-17',
    cambios: [
      'Los chips de Estado (Carrusel, Pausado, etc.) ahora son pill/chip: bien redondeados, más chicos y compactos, con el texto centrado.',
      '"Sin estado" se ve como un chip neutro y sutil (borde punteado), no como un botón gris grande.'
    ]
  },
  {
    version: '0.6.0',
    fecha: '2026-09-17',
    cambios: [
      'Super Admin ahora puede arrastrar los grupos (con el ⠿) para reordenarlos.',
      'El número del 🔔 Actividad del tablero desaparece después de abrir el panel, y solo vuelve a aparecer con actividad nueva.'
    ]
  },
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
