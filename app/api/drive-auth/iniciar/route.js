import { NextResponse } from 'next/server';
import { crearOAuthClient, DRIVE_OAUTH_SCOPE } from '../../../../lib/driveOAuth';

// Paso 1 del proceso de autorización única para poder subir archivos a Drive usando una
// cuenta de Google personal (sin necesitar Workspace) — ver SETUP.md, sección 2.1.
// Se entra a esta URL a mano, una sola vez, con ?clave=SETUP_BOOTSTRAP_KEY. Redirige a la
// pantalla de Google para elegir la cuenta y aceptar el permiso.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const clave = searchParams.get('clave');
  const esperada = process.env.SETUP_BOOTSTRAP_KEY;

  if (!esperada) {
    return NextResponse.json({ error: 'Falta configurar SETUP_BOOTSTRAP_KEY en las variables de entorno de Vercel.' }, { status: 500 });
  }
  if (!clave || clave !== esperada) {
    return NextResponse.json({ error: 'Falta la clave, o es incorrecta. Entrá con ?clave=TU_SETUP_BOOTSTRAP_KEY al final de la URL.' }, { status: 403 });
  }
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Faltan GOOGLE_OAUTH_CLIENT_ID y/o GOOGLE_OAUTH_CLIENT_SECRET en las variables de entorno de Vercel. Agregalos primero (ver SETUP.md, sección 2.1) y volvé a desplegar antes de repetir esto.' },
      { status: 500 }
    );
  }

  const redirectUri = `${origin}/api/drive-auth/callback`;
  const client = crearOAuthClient(redirectUri);
  const url = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [DRIVE_OAUTH_SCOPE],
    state: esperada
  });

  return NextResponse.redirect(url);
}
