// Pasos del recorrido guiado ("❓ Necesito ayuda") para Tuesday ILCE.
// Cada paso: { id, pagina, selector, titulo, texto, accion }.
// `pagina` es la ruta donde vive el elemento (el tour navega solo si hace falta).
// `selector` es un data-tour puesto a propósito en app/page.js / componentes/tablero.

export const TOUR_PASOS = [
  {
    id: 'bienvenida',
    pagina: '/',
    selector: null,
    titulo: '¡Bienvenido a Tuesday ILCE!',
    texto: 'Este es el tablero de contenidos del equipo: grupos, columnas configurables y una ficha por cada contenido con comentarios y actividad.'
  },
  {
    id: 'buscar',
    pagina: '/',
    selector: '[data-tour="tablero-buscar"]',
    titulo: 'Buscar contenido',
    texto: 'Escribí acá para filtrar los contenidos por nombre, en cualquier grupo.'
  },
  {
    id: 'tabs',
    pagina: '/',
    selector: '[data-tour="tablero-tabs"]',
    titulo: 'Pestañas rápidas',
    texto: 'Si el tablero tiene más de una columna de tipo Estado (por ejemplo "Tipo"), acá aparecen pestañas para filtrar de un clic, con el contador de cada una.',
    accion: 'Aparece solo si hay una segunda columna de tipo Estado.'
  },
  {
    id: 'filtro-estado',
    pagina: '/',
    selector: '[data-tour="tablero-filtro-estado"]',
    titulo: 'Filtrar por estado',
    texto: 'Filtrá rápido por estado (En proceso, Para corregir, Listo, etc.) haciendo clic en cada pastilla de color.',
    accion: 'Este filtro aparece solo si el tablero tiene una columna de tipo Estado.'
  },
  {
    id: 'actividad-global',
    pagina: '/',
    selector: '[data-tour="tablero-actividad-global"]',
    titulo: 'Actividad del tablero',
    texto: 'Acá ves todo lo que pasó en el tablero completo (no solo un contenido): cambios, comentarios y contenidos nuevos, agrupados por día.',
    accion: 'El numerito rojo indica cuántas cosas pasaron hoy.'
  },
  {
    id: 'grupo',
    pagina: '/',
    selector: '[data-tour="tablero-grupo"]',
    titulo: 'Grupos',
    texto: 'Cada grupo junta contenidos relacionados. Podés cambiarle el nombre y el color haciendo clic sobre ellos.'
  },
  {
    id: 'agregar-item',
    pagina: '/',
    selector: '[data-tour="tablero-agregar-item"]',
    titulo: 'Agregar un contenido',
    texto: 'Escribí un nombre acá abajo del grupo y presioná Enter para crear un contenido nuevo.'
  },
  {
    id: 'item-nombre',
    pagina: '/',
    selector: '[data-tour="tablero-item-nombre"]',
    titulo: 'Abrir la ficha de un contenido',
    texto: 'Hacé clic en el nombre para abrir su ficha completa: descripción, enlaces, comentarios y actividad.'
  },
  {
    id: 'editar-columnas',
    pagina: '/',
    selector: '[data-tour="tablero-editar-columnas"]',
    titulo: 'Columnas del tablero',
    texto: 'Admin y SuperAdmin pueden agregar, renombrar o eliminar columnas desde acá, y configurar las opciones de Estado.',
    accion: 'Visible solo para Admin/SuperAdmin.'
  },
  {
    id: 'nuevo-grupo',
    pagina: '/',
    selector: '[data-tour="tablero-nuevo-grupo"]',
    titulo: 'Crear un grupo nuevo',
    texto: 'Cualquiera que use el tablero puede crear un grupo nuevo para organizar contenidos.'
  }
];

export const TAREAS_AYUDA = [
  { id: 'crear-contenido', label: 'Quiero crear un contenido nuevo', pasoInicial: 'agregar-item' },
  { id: 'ver-detalle', label: 'Quiero ver la ficha de un contenido', pasoInicial: 'item-nombre' },
  { id: 'columnas', label: 'Quiero agregar o editar columnas', pasoInicial: 'editar-columnas' },
  { id: 'grupo-nuevo', label: 'Quiero crear un grupo nuevo', pasoInicial: 'nuevo-grupo' }
];
