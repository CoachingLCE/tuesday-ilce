import { readSheet, appendRow, patchRow, clearRows } from './sheets';

function parseJson(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

/* ---------------- grupos ---------------- */
export async function leerGrupos() {
  const filas = await readSheet('TableroGrupos');
  return filas.filter((f) => f.Id).map((f) => ({
    id: f.Id, nombre: f.Nombre || '', color: f.Color || '#4c6fff',
    orden: parseInt(f.Orden, 10) || 0, _rowIndex: f._rowIndex
  })).sort((a, b) => a.orden - b.orden);
}
export async function crearGrupo(g) {
  await appendRow('TableroGrupos', { Id: g.id, Nombre: g.nombre || '', Color: g.color || '', Orden: g.orden ?? 0 });
}
export async function actualizarGrupoPorId(id, cambios) {
  const filas = await readSheet('TableroGrupos');
  const fila = filas.find((f) => f.Id === id);
  if (!fila) throw new Error('Grupo no encontrado');
  const patch = {};
  if (cambios.nombre !== undefined) patch.Nombre = cambios.nombre;
  if (cambios.color !== undefined) patch.Color = cambios.color;
  if (cambios.orden !== undefined) patch.Orden = cambios.orden;
  await patchRow('TableroGrupos', fila._rowIndex, patch);
}
export async function eliminarGrupoPorId(id) {
  const filas = await readSheet('TableroGrupos');
  const fila = filas.find((f) => f.Id === id);
  if (!fila) return;
  await clearRows('TableroGrupos', [fila._rowIndex]);
}

/* ---------------- columnas ---------------- */
export async function leerColumnas() {
  const filas = await readSheet('TableroColumnas');
  return filas.filter((f) => f.Id).map((f) => ({
    id: f.Id, nombre: f.Nombre || '', tipo: f.Tipo || 'text',
    orden: parseInt(f.Orden, 10) || 0, opciones: parseJson(f.OpcionesJson, []), _rowIndex: f._rowIndex
  })).sort((a, b) => a.orden - b.orden);
}
export async function crearColumna(c) {
  await appendRow('TableroColumnas', {
    Id: c.id, Nombre: c.nombre || '', Tipo: c.tipo || 'text',
    Orden: c.orden ?? 0, OpcionesJson: JSON.stringify(c.opciones || [])
  });
}
export async function actualizarColumnaPorId(id, cambios) {
  const filas = await readSheet('TableroColumnas');
  const fila = filas.find((f) => f.Id === id);
  if (!fila) throw new Error('Columna no encontrada');
  const patch = {};
  if (cambios.nombre !== undefined) patch.Nombre = cambios.nombre;
  if (cambios.tipo !== undefined) patch.Tipo = cambios.tipo;
  if (cambios.opciones !== undefined) patch.OpcionesJson = JSON.stringify(cambios.opciones);
  if (cambios.orden !== undefined) patch.Orden = cambios.orden;
  await patchRow('TableroColumnas', fila._rowIndex, patch);
}
export async function eliminarColumnaPorId(id) {
  const filas = await readSheet('TableroColumnas');
  const fila = filas.find((f) => f.Id === id);
  if (!fila) return;
  await clearRows('TableroColumnas', [fila._rowIndex]);
}

/* ---------------- items (contenidos) ---------------- */
export async function leerItems() {
  const filas = await readSheet('TableroItems');
  return filas.filter((f) => f.Id).map((f) => ({
    id: f.Id, grupoId: f.GrupoId || '', nombre: f.Nombre || '',
    orden: parseInt(f.Orden, 10) || 0, cells: parseJson(f.CeldasJson, {}), body: f.Cuerpo || '',
    creadoPor: f.CreadoPor || '', creadoEn: f.CreadoEn || '', _rowIndex: f._rowIndex
  })).sort((a, b) => a.orden - b.orden);
}
export async function crearItem(it) {
  await appendRow('TableroItems', {
    Id: it.id, GrupoId: it.grupoId || '', Nombre: it.nombre || '', Orden: it.orden ?? 0,
    CeldasJson: JSON.stringify(it.cells || {}), Cuerpo: it.body || '',
    CreadoPor: it.creadoPor || '', CreadoEn: it.creadoEn || new Date().toISOString()
  });
}
export async function actualizarItemPorId(id, cambios) {
  const filas = await readSheet('TableroItems');
  const fila = filas.find((f) => f.Id === id);
  if (!fila) throw new Error('Contenido no encontrado');
  const patch = {};
  if (cambios.grupoId !== undefined) patch.GrupoId = cambios.grupoId;
  if (cambios.nombre !== undefined) patch.Nombre = cambios.nombre;
  if (cambios.orden !== undefined) patch.Orden = cambios.orden;
  if (cambios.cells !== undefined) patch.CeldasJson = JSON.stringify(cambios.cells);
  if (cambios.body !== undefined) patch.Cuerpo = cambios.body;
  await patchRow('TableroItems', fila._rowIndex, patch);
}
export async function eliminarItemPorId(id) {
  const filas = await readSheet('TableroItems');
  const fila = filas.find((f) => f.Id === id);
  if (!fila) return;
  await clearRows('TableroItems', [fila._rowIndex]);
}

/* ---------------- comentarios ---------------- */
export async function leerComentarios(itemId) {
  const filas = await readSheet('TableroComentarios');
  return filas.filter((f) => f.Id && (!itemId || f.ItemId === itemId)).map((f) => ({
    id: f.Id, itemId: f.ItemId, autor: f.Autor || '', html: f.Html || '', fecha: f.Fecha || ''
  })).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
}
export async function crearComentario(c) {
  await appendRow('TableroComentarios', {
    Id: c.id, ItemId: c.itemId, Autor: c.autor || '', Html: c.html || '', Fecha: c.fecha || new Date().toISOString()
  });
}

/* ---------------- actividad (historial por contenido) ---------------- */
export async function leerActividad(itemId) {
  const filas = await readSheet('TableroActividad');
  return filas.filter((f) => f.Id && (!itemId || f.ItemId === itemId)).map((f) => ({
    id: f.Id, itemId: f.ItemId, autor: f.Autor || '', texto: f.Texto || '', fecha: f.Fecha || ''
  })).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}
export async function crearActividad(a) {
  await appendRow('TableroActividad', {
    Id: a.id, ItemId: a.itemId, Autor: a.autor || '', Texto: a.texto || '', Fecha: a.fecha || new Date().toISOString()
  });
}
