import { google } from 'googleapis';
import { Readable } from 'stream';
import { oauthConfigurado, crearOAuthClient } from './driveOAuth';

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

async function getDriveClient() {
  // Modo OAuth (cuenta de Google personal, sin Workspace): ver lib/driveOAuth.js y
  // SETUP.md sección 2.1. Tiene prioridad si está configurado.
  if (oauthConfigurado()) {
    const client = crearOAuthClient();
    client.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
    return google.drive({ version: 'v3', auth: client });
  }

  // Modo cuenta de servicio (requiere Google Workspace + Unidad compartida, ver SETUP.md).
  validarEntorno();
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const auth = new google.auth.JWT(email, null, key, ['https://www.googleapis.com/auth/drive']);
  try {
    await auth.authorize();
  } catch (err) {
    throw new Error(`No se pudo autenticar con Google Drive (revisá GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY): ${err.message}`);
  }
  return google.drive({ version: 'v3', auth });
}

const NOMBRE_CARPETA_OAUTH = 'Tuesday ILCE - Archivos';

// En modo OAuth no hace falta configurar GOOGLE_DRIVE_FOLDER_ID a mano: la app busca (o
// crea, la primera vez) una carpeta propia en el Drive de la cuenta autorizada. Como la
// crea la propia app, el scope acotado (drive.file) le sigue dando acceso a ella en
// llamadas futuras.
async function obtenerCarpetaOAuth(drive) {
  const q = `name='${NOMBRE_CARPETA_OAUTH}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await drive.files.list({ q, fields: 'files(id, name)', spaces: 'drive' });
  if (res.data.files && res.data.files.length) return res.data.files[0].id;
  const carpeta = await drive.files.create({
    requestBody: { name: NOMBRE_CARPETA_OAUTH, mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id'
  });
  return carpeta.data.id;
}

async function obtenerCarpetaDestino(drive) {
  if (oauthConfigurado()) return obtenerCarpetaOAuth(drive);
  return process.env.GOOGLE_DRIVE_FOLDER_ID;
}

function traducirError(err) {
  const msg = err?.errors?.[0]?.message || err?.message || String(err);
  const modoOAuth = oauthConfigurado();
  if (/invalid_grant/i.test(msg) || /Invalid Credentials/i.test(msg)) {
    return new Error('El acceso a tu cuenta de Google (GOOGLE_OAUTH_REFRESH_TOKEN) dejó de ser válido — normalmente pasa si se revocó el permiso desde myaccount.google.com/permissions. Volvé a hacer el paso de autorización en /api/drive-auth/iniciar y actualizá esa variable en Vercel. Ver SETUP.md.');
  }
  if (/File not found/i.test(msg) || /notFound/i.test(msg)) {
    return new Error(
      modoOAuth
        ? 'No se encontró la carpeta de Drive de la app. Puede haberse borrado a mano — subí un archivo de nuevo y la app va a crear una nueva.'
        : 'No se encontró la carpeta de Drive — revisá que GOOGLE_DRIVE_FOLDER_ID sea correcto y que la carpeta esté compartida con la cuenta de servicio.'
    );
  }
  if (/PERMISSION_DENIED/i.test(msg) || /does not have permission/i.test(msg) || /insufficientPermissions/i.test(msg)) {
    return new Error(
      modoOAuth
        ? 'Tu cuenta de Google no le dio permiso suficiente a la app (scope drive.file). Repetí la autorización en /api/drive-auth/iniciar.'
        : 'La cuenta de servicio no tiene permiso sobre esa carpeta de Drive. Compartila como Editor con GOOGLE_SERVICE_ACCOUNT_EMAIL.'
    );
  }
  if (/storage quota/i.test(msg)) {
    return new Error(
      modoOAuth
        ? 'Tu cuenta de Google se quedó sin espacio en Drive — liberá espacio o usá otra cuenta para GOOGLE_OAUTH_REFRESH_TOKEN.'
        : 'La carpeta de Drive configurada (GOOGLE_DRIVE_FOLDER_ID) no es una carpeta dentro de una Unidad compartida. Las cuentas de servicio no tienen almacenamiento propio, así que la carpeta tiene que estar dentro de una Unidad compartida (Shared Drive) de Google Workspace, compartida con la cuenta de servicio — o, si no tenés Workspace, configurá el modo de cuenta personal (GOOGLE_OAUTH_...). Ver SETUP.md.'
    );
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
  const folderId = await obtenerCarpetaDestino(drive);

  let res;
  try {
    res = await drive.files.create({
      requestBody: { name: nombre, parents: [folderId] },
      media: { mimeType: mimeType || 'application/octet-stream', body: Readable.from(buffer) },
      fields: 'id, name, mimeType, size',
      // Necesario para que funcione cuando la carpeta está dentro de una Unidad compartida
      // (Shared Drive) — que es el caso en modo cuenta de servicio (ver SETUP.md). No
      // molesta en modo OAuth.
      supportsAllDrives: true
    });
  } catch (err) {
    throw traducirError(err);
  }

  const fileId = res.data.id;
  try {
    await drive.permissions.create({ fileId, requestBody: { role: 'reader', type: 'anyone' }, supportsAllDrives: true });
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
    await drive.files.delete({ fileId, supportsAllDrives: true });
  } catch (err) {
    console.error('No se pudo borrar el archivo de Drive:', err?.message || err);
  }
}
