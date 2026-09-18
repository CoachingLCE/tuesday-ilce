import { google } from 'googleapis';
import { Readable } from 'stream';

/**
 * Subida real de archivos (fotos, PDFs, documentos) a Google Drive, usando la MISMA
 * cuenta de servicio que ya se usa para leer/escribir el Google Sheet — no hace falta
 * crear credenciales nuevas, solo compartir una carpeta de Drive con ese email.
 *
 * Por qué Drive y no guardar el archivo en el Sheet: Google Sheets no puede guardar
 * binarios, solo texto — así que la celda de tipo "Archivos" guarda un array de objetos
 * {id, name, mimeType, url, previewUrl, thumbUrl} (ver lib/datosTablero.js, CeldasJson),
 * y el archivo en sí vive en Drive.
 */

function validarEntorno() {
  const faltantes = [];
  if (!process.env.GOOGLE_DRIVE_FOLDER_ID) faltantes.push('GOOGLE_DRIVE_FOLDER_ID');
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) faltantes.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!process.env.GOOGLE_PRIVATE_KEY) faltantes.push('GOOGLE_PRIVATE_KEY');
  if (faltantes.length > 0) {
    throw new Error(`Faltan variables de entorno para subir archivos: ${faltantes.join(', ')}. Revisá SETUP.md.`);
  }
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  return new google.auth.JWT(email, null, key, ['https://www.googleapis.com/auth/drive']);
}

async function getDriveClient() {
  validarEntorno();
  const auth = getAuth();
  try {
    await auth.authorize();
  } catch (err) {
    throw new Error(`No se pudo autenticar con Google Drive (revisá GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY): ${err.message}`);
  }
  return google.drive({ version: 'v3', auth });
}

function traducirError(err) {
  const msg = err?.errors?.[0]?.message || err?.message || String(err);
  if (/File not found/i.test(msg) || /notFound/i.test(msg)) {
    return new Error('No se encontró la carpeta de Drive — revisá que GOOGLE_DRIVE_FOLDER_ID sea correcto y que la carpeta esté compartida con la cuenta de servicio.');
  }
  if (/PERMISSION_DENIED/i.test(msg) || /does not have permission/i.test(msg) || /insufficientPermissions/i.test(msg)) {
    return new Error('La cuenta de servicio no tiene permiso sobre esa carpeta de Drive. Compartila como Editor con GOOGLE_SERVICE_ACCOUNT_EMAIL.');
  }
  return new Error(`Error subiendo el archivo a Drive: ${msg}`);
}

function urlsDeArchivo(fileId) {
  return {
    url: `https://drive.google.com/file/d/${fileId}/view`,
    previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    thumbUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`
  };
}

/** Sube un archivo (buffer en memoria) a la carpeta de Drive y lo deja visible para
 * cualquiera que tenga el link (necesario porque quien mira el tablero no inicia sesión
 * con su cuenta de Google, solo con su usuario/contraseña de la app). */
export async function subirArchivo({ buffer, nombre, mimeType }) {
  const drive = await getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  let res;
  try {
    res = await drive.files.create({
      requestBody: { name: nombre, parents: [folderId] },
      media: { mimeType: mimeType || 'application/octet-stream', body: Readable.from(buffer) },
      fields: 'id, name, mimeType, size'
    });
  } catch (err) {
    throw traducirError(err);
  }

  const fileId = res.data.id;
  try {
    await drive.permissions.create({ fileId, requestBody: { role: 'reader', type: 'anyone' } });
  } catch (err) {
    throw traducirError(err);
  }

  return { id: fileId, name: res.data.name, mimeType: res.data.mimeType || '', ...urlsDeArchivo(fileId) };
}

/** Borra un archivo de Drive (al sacarlo de una celda) — si ya no existe o falla, no
 * rompe el flujo principal (la celda ya se actualizó igual). */
export async function borrarArchivo(fileId) {
  try {
    const drive = await getDriveClient();
    await drive.files.delete({ fileId });
  } catch (err) {
    console.error('No se pudo borrar el archivo de Drive:', err?.message || err);
  }
}
