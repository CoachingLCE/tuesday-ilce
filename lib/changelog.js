// Se actualiza a mano cada vez que se sube un conjunto de mejoras importante.
// Lo más nuevo va primero. Se muestra al hacer clic en el badge de versión.
export const CHANGELOG = [
  {
    version: '0.16.0',
    fecha: '2026-10-06',
    cambios: [
      'Cuando una lista, tabla o filtro no tiene nada para mostrar, ahora se ve un recuadro punteado con un ícono y el mensaje centrado, en lugar de una línea gris suelta. Es igual en todas las apps de ILCE.',
      'No se cambió ningún dato, flujo ni cálculo existente.'
    ]
  },
  {
    version: '0.15.0',
    fecha: '2026-10-05',
    cambios: [
      'Vista previa de enlace: ahora, cuando alguien comparte un enlace de la app por WhatsApp, Slack o Telegram, se ve una tarjeta con el título, una descripción y una imagen de ILCE, en lugar de mostrar solo el dominio. (se renueva la imagen para que sea igual a la de las demás apps).',
      'No se cambió ningún dato, flujo ni cálculo existente.'
    ]
  },
  {
    version: '0.14.3',
    fecha: '2026-10-05',
    cambios: [
      'Ícono de la pestaña (favicon) actualizado: ahora el isologo de ILCE va sobre un fondo oscuro, más nítido y visible tanto en pestañas claras como oscuras (antes tenía fondo transparente y el arco blanco desaparecía en pestañas claras). Es el mismo ícono en todas las apps de ILCE.',
      'No se cambió ningún dato, flujo ni cálculo existente.'
    ]
  },
  {
    version: '0.14.2',
    fecha: '2026-10-05',
    cambios: [
      'Novedades de la app: la lista ahora se va "prendiendo" renglón por renglón mientras se lee (arranca atenuada y cada renglón se ilumina al llegar a la zona de lectura de arriba), igual que en las demás apps de ILCE. Si tu sistema tiene activada la opción de "reducir movimiento", se muestra normal.',
      'Arreglo: al llegar al final de la lista, los últimos renglones quedaban apagados y no se podían leer bien; ahora se encienden.',
      'No se cambió ningún dato, flujo ni cálculo existente.'
    ]
  },
  {
    version: '0.14.1',
    fecha: '2026-10-05',
    cambios: [
      'Celular: las ventanas (editar, cambiar contraseña, etc.) que eran más altas que la pantalla quedaban con el título cortado arriba y el botón de guardar fuera de vista, sin forma de desplazarse. Ahora tienen un margen a los costados y, si no entran, se desplazan por dentro. En la computadora no cambian.',
      'Accesibilidad: todas las ventanas se anuncian ahora como ventanas para los lectores de pantalla, con su título.',
      'No se cambió ningún dato, flujo ni cálculo existente.'
    ]
  },
  {
    version: '0.14.0',
    fecha: '2026-10-05',
    cambios: [
      'Celular: el botón "Necesito ayuda" deja de ser un botón violeta con degradado y pasa a ser neutro (solo el ícono en celular), igual que en las otras apps de ILCE. Las novedades y la versión ahora se abren desde ese botón de ayuda, y en celular se saca el cartelito de versión que se superponía con el contenido. Las novedades ahora se leen mejor (ícono de trazo, título y versión más claros).',
      'Celular: en el tablero, cada contenido se muestra como una tarjeta con su nombre, estado, responsable, fecha, notas y archivos a la vista. Antes solo se veía el nombre y el resto quedaba escondido a la derecha, sin ninguna señal. En la computadora el tablero queda igual.',
      'En el menú de ayuda, el título decía "Te mostramos cómo funciona Cronograma ILCE"; ahora dice Tuesday ILCE.',
      'Mejor lectura: ningún texto es más chico que 12 px, el texto atenuado tiene más contraste y los textos en violeta se leen bien en modo oscuro. Los violetas, magentas y el turquesa pasan a los tonos del manual de marca.',
      'Tipografía de marca: todo el texto en Dosis y los títulos en TeX Gyre Adventor, como pide el manual. Las fuentes viajan dentro de la app.',
      'Íconos: los emoji de la interfaz (lupa, tacho, calendario, adjuntos, etc.) se reemplazaron por íconos de trazo uniforme, los mismos que usan las otras apps. El selector de emoji de los comentarios sigue con emoji reales.',
      'Los cuadros del navegador al eliminar (grupos, contenidos, columnas y automatizaciones) ahora son cuadros de la propia app, con el botón de eliminar en rojo y "Cancelar" seleccionado. Las ventanas se cierran con la tecla Esc.',
      'Login: tiene selector de tema, dice en qué app estás, el ojito para ver la contraseña es un ícono y el texto de ayuda ya no nombra a una persona.',
      'Seguridad y orden: se eliminó del repositorio una copia vieja del proyecto que estaba dentro de la carpeta app (63 archivos, 22 de ellos páginas y endpoints duplicados que se publicaban bajo /app/...). La app real no cambia.',
      'No se cambió ningún dato, flujo ni cálculo existente.'
    ]
  },
  {
    version: '0.13.1',
    fecha: '2026-09-30',
    cambios: [
      'Un link largo (ej. una URL de Google Drive) pegado en una Descripción se salía de la caja en vez de cortarse — ahora el texto envuelve para quedar siempre adentro.'
    ]
  },
  {
    version: '0.13.0',
    fecha: '2026-09-30',
    cambios: [
      'En la Descripción de un contenido: subrayado y tachado (sumados a negrita/cursiva/lista que ya había), un selector de tamaño de letra (Pequeño/Normal/Grande/Enorme), y un botón para insertar emojis sin salir del teclado.',
      'Los contenidos del tablero ahora se pueden arrastrar con el mouse (icono ⠿ a la izquierda del nombre) para reordenarlos dentro del mismo grupo, o soltarlos directamente en OTRO grupo/mes — antes solo se podían mover de a una posición por vez con las flechitas ↑↓ (que siguen estando). Soltar sobre un contenido lo inserta justo antes; soltar en el espacio vacío debajo del último (o en un grupo vacío) lo manda al final de ese grupo.'
    ]
  },
  {
    version: '0.12.0',
    fecha: '2026-09-30',
    cambios: [
      'Nueva sección "⚡ Automatizaciones" (Admin/SuperAdmin): la app puede mandar mails sola todos los días — recordatorios de vencimiento por contenido (a la persona Responsable o a mails fijos, con "N días antes"), o un resumen periódico (diario o semanal) con todo lo vencido y lo próximo a vencer.',
      'Se puede excluir del aviso a los contenidos que ya estén en cierto estado (ej. no avisar de los que ya están "Listo").',
      'Requiere un par de pasos únicos de configuración (variables de entorno y dos pestañas nuevas en el Sheet) — ver SETUP.md, sección 5.'
    ]
  },
  {
    version: '0.11.2',
    fecha: '2026-09-30',
    cambios: [
      'El ícono del calendario en las celdas de fecha (Fecha del tablero, e Historial) todavía se veía mal: quedaba un código viejo que lo forzaba a modo oscuro y lo invertía, lo cual chocaba con el arreglo por tema que se había sumado en la 0.11.0 y lo dejaba invisible de nuevo — ahora se sacó ese código viejo y el ícono se ve bien en claro y en oscuro.',
      'La columna "Nombre" del tablero se agrandó un poco para que se lea más del título de cada contenido antes de cortarlo con "...".'
    ]
  },
  {
    version: '0.11.1',
    fecha: '2026-09-30',
    cambios: [
      'Favicon con el logo (espiral) de Instituto ILCE en vez del genérico del navegador.',
      'Al compartir el link de la app (WhatsApp, Slack, etc.) ahora se ve una tarjeta con el nombre, una descripción y una imagen — antes aparecía vacío o genérico.'
    ]
  },
  {
    version: '0.11.0',
    fecha: '2026-09-30',
    cambios: [
      'Rediseño de la barra de arriba del tablero: búsqueda + vistas (Lista/Calendario) + Columnas ahora viven juntas en una sola toolbar, en vez de quedar sueltas.',
      'Los filtros quedaron agrupados y con etiqueta propia — "Contenido", "Estado" y "Responsable" — para que se entienda de una qué filtra cada fila, y no compitan entre sí.',
      'Se resolvió la ambigüedad de tener dos "Todos" seguidos: ahora cada uno queda claramente bajo su etiqueta ("Contenido: Todos" / "Responsable: Todos").',
      'Se bajó el peso tipográfico general: las etiquetas van en texto regular, los botones en medium, y el semibold quedó reservado para títulos y números importantes — antes casi todo estaba en semibold/bold.',
      'El encabezado ahora muestra "Tuesday ILCE" como título del espacio con "Tablero de contenidos" debajo, y el logo de Instituto ILCE más chico como marca institucional.',
      'Se compactó el espaciado general (menos aire arriba y entre filas) para que se sienta más denso y con menos superficie vacía.',
      'El ícono del calendario en las celdas de fecha (y en los filtros de fecha de Historial) era negro por defecto del navegador y no se veía en modo oscuro — ahora se adapta solo al tema.',
      'Las flechas de subir/bajar y el tacho de borrar de cada contenido (al pasar el mouse por la fila) eran emojis que no seguían los colores de la app y casi no se veían en oscuro — ahora son íconos que se ven bien en cualquier tema.',
      'En Accesos, los usuarios activos ahora aparecen primero y los desactivados al final, en vez de quedar mezclados.'
    ]
  },
  {
    version: '0.10.1',
    fecha: '2026-09-30',
    cambios: [
      '"Para mí" en Actividad del tablero: ya no aparecen tus propias acciones (por ejemplo, asignarte una tarea a vos mismo) — antes se mostraban aunque nadie te haya mencionado ni avisado nada.',
      'El numerito de "Para mí" y "General" ahora desaparece apenas abrís esa pestaña, en vez de quedar siempre visible.',
      '"General" ahora trae hasta 100 movimientos (antes 200, para que cargue más rápido), y las corridas de la misma acción repetida seguidas (ej. guardar varias veces seguidas) se juntan en una sola línea con un "×N".',
      'Actividad del tablero: cada persona tiene un color fijo para su nombre, y cada tipo de acción (editar, comentar, asignar, mover, quitar, etc.) tiene su propio color — para distinguir de un vistazo qué pasó y quién lo hizo.',
      'Cambiar mi contraseña: se puede mostrar/ocultar lo que se tipeó en cada campo con el ícono del ojo.',
      'El botón "Columnas" cambió el ícono de ⚙️ a 📊 — el de tuerca no tenía que ver con columnas.'
    ]
  },
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
