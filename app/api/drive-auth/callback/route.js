import { NextResponse } from 'next/server';
import { crearOAuthClient } from '../../../../lib/driveOAuth';

function pagina(titulo, cuerpoHtml) {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>${titulo}</title></head>
     <body style="font-family:-apple-system,Arial,sans-serif;max-width:640px;margin:60px auto;line-height:1.6;color:#222;padding:0 20px">
       <h2>${titulo}</h2>
       ${cuerpoHtml}
     </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

// Paso 2: acá vuelve Google después de que la persona elige su cuenta y acepta el
// permiso. Intercambia el código por un refresh token y lo muestra UNA sola vez para
// copiarlo a Vercel — no se guarda en ningún lado de este lado.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorGoogle = searchParams.get('error');
  const esperada = process.env.SETUP_BOOTSTRAP_KEY;

  if (errorGoogle) {
    return pagina('Google canceló la autorización', `<p>Motivo: <code>${errorGoogle}</code>. Volvé a intentar desde /api/drive-auth/iniciar.</p>`);
  }
  if (!state || !esperada || state !== esperada) {
    return pagina('No autorizado', '<p>Este link solo funciona si se llegó a través de <code>/api/drive-auth/iniciar</code> con la llave correcta.</p>');
  }
  if (!code) {
    return pagina('Falta el código', '<p>Google no envió el código de autorización. Volvé a intentar desde /api/drive-auth/iniciar.</p>');
  }

  try {
    const redirectUri = `${origin}/api/drive-auth/callback`;
    const client = crearOAuthClient(redirectUri);
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      return pagina(
        'No llegó un refresh token',
        `<p>Google no devolvió uno nuevo — pasa cuando ya le habías dado permiso a esta app antes con la misma cuenta.</p>
         <p>Solución: andá a <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">myaccount.google.com/permissions</a>,
         buscá esta app y quitale el acceso, y volvé a entrar a <a href="/api/drive-auth/iniciar?clave=${encodeURIComponent(state)}">/api/drive-auth/iniciar</a>.</p>`
      );
    }

    return pagina(
      '¡Listo! Copiá este valor',
      `<p>Pegalo en Vercel como la variable <code>GOOGLE_OAUTH_REFRESH_TOKEN</code> (Settings → Environment Variables) y volvé a desplegar.</p>
       <p style="background:#f0f0f0;padding:14px;border-radius:8px;word-break:break-all;font-family:monospace;font-size:13px">${tokens.refresh_token}</p>
       <p style="color:#888;font-size:13px">Este valor no quedó guardado en ningún lado nuestro — se te muestra una sola vez, acá.</p>`
    );
  } catch (err) {
    return pagina('Error', `<p>${(err?.message || String(err)).replace(/</g, '&lt;')}</p>`);
  }
}
