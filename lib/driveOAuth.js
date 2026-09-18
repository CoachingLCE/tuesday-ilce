import { google } from 'googleapis';

/**
 * Soporte para subir archivos a Drive usando una cuenta de Google PERSONAL (no
 * Workspace), en vez de la cuenta de servicio. Necesario porque las cuentas de servicio
 * no tienen almacenamiento propio, y las Unidades compartidas (la forma habitual de
 * darles un lugar) son una función exclusiva de Google Workspace.
 *
 * Con OAuth, la app sube los archivos "como si fuera" la persona dueña de
 * GOOGLE_OAUTH_REFRESH_TOKEN — así que cuentan contra el almacenamiento normal de esa
 * cuenta (los 15 GB gratis, o lo que tenga). Ver SETUP.md, sección 2.1, para cómo generar
 * ese refresh token la primera vez (es un proceso de una sola vez).
 *
 * Si estas tres variables no están configuradas, lib/drive.js sigue usando la cuenta de
 * servicio de siempre (para quienes sí tienen Workspace) — son totalmente opcionales.
 */
export function oauthConfigurado() {
  return !!(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  );
}

export function crearOAuthClient(redirectUri) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri
  );
}

// Scope acotado a "los archivos que esta app creó" — no pide acceso a todo tu Drive.
// Alcanza para subir, ver, y borrar los archivos que suba el tablero, y no exige que
// Google "verifique" la app para poder usarla en serio (a diferencia del scope completo
// de Drive), así que no hay riesgo de que el permiso expire solo a los 7 días.
export const DRIVE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/drive.file';
