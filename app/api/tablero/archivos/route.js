import { NextResponse } from 'next/server';
import { conManejo } from '../../../../lib/apiHandler';
import { requireUsuario } from '../../../../lib/requireUsuario';
import { tienePermisoVer } from '../../../../lib/permisos';
import { subirArchivo, borrarArchivo } from '../../../../lib/drive';

// Vercel limita el tamaño del body de una función serverless a ~4.5 MB — dejamos un
// margen debajo de eso para que el error sea el nuestro (claro) y no un 413 genérico.
const LIMITE_BYTES = 4 * 1024 * 1024;

// POST /api/tablero/archivos -> multipart/form-data con un campo "archivo"
export const POST = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'No se pudo leer el archivo enviado.' }, { status: 400 });
  }

  const archivo = formData.get('archivo');
  if (!archivo || typeof archivo === 'string') {
    return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
  }
  if (archivo.size > LIMITE_BYTES) {
    return NextResponse.json({ error: `Ese archivo pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB — por ahora el máximo es 4 MB.` }, { status: 400 });
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());
  const subido = await subirArchivo({ buffer, nombre: archivo.name, mimeType: archivo.type });

  return NextResponse.json({ archivo: subido });
})

// DELETE /api/tablero/archivos?id=<driveFileId> — borra el archivo de Drive al sacarlo de una celda.
export const DELETE = conManejo(async (request) => {
  const usuario = await requireUsuario(request);
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!tienePermisoVer(usuario)) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta el id del archivo.' }, { status: 400 });

  await borrarArchivo(id);
  return NextResponse.json({ ok: true });
})
