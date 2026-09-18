# Tuesday ILCE — puesta en marcha

Tablero de contenidos del equipo ILCE (estilo Monday.com), con el mismo look &
la misma base técnica que disponibilidad-zoom y seguimiento-lead-estudiante:
Next.js + Google Sheets como base de datos + Vercel.

## 1) Google Sheet

Creá (o usá) una hoja de Google Sheets con estas pestañas exactas (respetando
mayúsculas/minúsculas de los encabezados, en la fila 1 de cada una):

### `Usuarios`
| Email | Nombre | Roles | PasswordHash | Activo |
|---|---|---|---|---|

- `Roles`: uno o varios separados por coma o `+` — valores válidos: `Colaborador`, `Admin`, `SuperAdmin`.
- `PasswordHash`: se completa solo (vacío hasta que la persona pone su primera contraseña en `/setup-password`).
- `Activo`: `TRUE` o vacío = activo; `FALSE` = desactivado.
- Cargá ahí, a mano, tu propio usuario como primera fila con rol `SuperAdmin` (sin PasswordHash — se lo pones vos mismo entrando a `/setup-password`).

### `Historial`
| Fecha | Email | Usuario | Accion | Detalle |
|---|---|---|---|---|

Se completa sola (logins, cambios de contraseña, etc. — es lo que se ve en "Historial de cambios").

### `TableroGrupos`
| Id | Nombre | Color | Orden |
|---|---|---|---|

### `TableroColumnas`
| Id | Nombre | Tipo | Orden | OpcionesJson |
|---|---|---|---|---|

Se completa sola a medida que se usan/editan columnas. `Tipo` es uno de: `status`, `person`, `date`, `text`.

### `TableroItems`
| Id | GrupoId | Nombre | Orden | CeldasJson | Cuerpo | CreadoPor | CreadoEn |
|---|---|---|---|---|---|---|---|

### `TableroComentarios`
| Id | ItemId | Autor | Html | Fecha |
|---|---|---|---|---|

### `TableroActividad`
| Id | ItemId | Autor | Texto | Fecha | Para |
|---|---|---|---|---|---|

La columna `Para` es opcional (si el Sheet ya existe de antes y no la tenés, la app sigue funcionando igual, solo que sin poder separar "Para mí" de la actividad general) — ahí se guarda, en JSON, a quién le corresponde esa actividad como notificación personal (por ejemplo `["ana@ilce.com"]`), porque la mencionaron con @ o la asignaron como responsable.

Para las últimas 5 pestañas alcanza con crear la hoja y poner solo la fila de encabezados — la app las va llenando sola.

## 2) Compartir el Sheet

Compartí el Sheet completo (botón "Compartir") con este email, como **Editor**:

```
carga-clases-bot@carga-clases-ilce.iam.gserviceaccount.com
```

(la misma cuenta de servicio que ya usás en disponibilidad-zoom y seguimiento-lead-estudiante).

## 3) Variables de entorno en Vercel

En el proyecto de Vercel → Settings → Environment Variables (marcando Production, Preview y Development):

| Variable | De dónde sale |
|---|---|
| `GOOGLE_SHEET_ID` | El ID de la URL del Sheet nuevo (la parte entre `/d/` y `/edit`) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `carga-clases-bot@carga-clases-ilce.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | La `private_key` del JSON de esa cuenta de servicio (la misma que usan los otros proyectos, o una clave nueva generada en Google Cloud Console para la misma cuenta) |
| `SESSION_SECRET` | Cualquier string largo y random, propio de esta app |
| `SETUP_BOOTSTRAP_KEY` | Cualquier string largo y random — se usa una sola vez por persona para poner su primera contraseña, después no hace falta más |

| `GOOGLE_DRIVE_FOLDER_ID` | Solo si usás la opción A de Drive (Workspace) — ver punto 2.1 |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` | Solo si usás la opción B de Drive (cuenta personal, sin Workspace) — ver punto 2.1 |

No hacen falta (todavía) `GMAIL_USER`, `GMAIL_APP_PASSWORD` ni `CRON_SECRET` — no hay ninguna función de mail ni de tareas programadas en esta primera versión.

### 2.1) Carpeta de Drive para los archivos subidos

Como Google Sheets no puede guardar archivos, los adjuntos que subís desde la columna "Archivos" se guardan en Google Drive. Hay dos formas de configurarlo — usá la que corresponda a tu cuenta:

- **Tenés Google Workspace** (cuenta paga, de organización): opción A, más abajo.
- **Tenés una cuenta de Gmail normal y gratuita** (no Workspace): opción B. Las Unidades compartidas de la opción A son una función exclusiva de Workspace — una cuenta gratuita no puede crearlas.

No hace falta elegir las dos: si configurás las variables `GOOGLE_OAUTH_...` de la opción B, la app las usa automáticamente y ya no le presta atención a `GOOGLE_DRIVE_FOLDER_ID`.

#### Opción A — con Google Workspace (Unidad compartida)

La cuenta de servicio (`carga-clases-bot@...`) no es una persona con una cuenta de Google, así que no tiene almacenamiento propio. Si le pedís que suba un archivo a una carpeta común, Google devuelve el error *"Service Accounts do not have storage quota"*. Una Unidad compartida es distinta: el almacenamiento es de la unidad (lo paga la organización), así que ahí sí puede subir archivos sin problema.

1. En Google Drive, creá una **Unidad compartida** nueva (no una carpeta común) — botón "Unidades compartidas" en el menú de la izquierda → "Nueva". Nombrala, por ejemplo, "Tuesday ILCE".
2. Agregá a la cuenta de servicio como miembro de esa Unidad compartida, con permiso **Gestor de contenido** (Content Manager) o superior:
   ```
   carga-clases-bot@carga-clases-ilce.iam.gserviceaccount.com
   ```
3. Adentro de la Unidad compartida, podés crear una subcarpeta si querés (por ejemplo "Archivos") o usar la unidad directamente. Sacá el ID de esa carpeta (o de la unidad) de su URL (`https://drive.google.com/drive/folders/EL_ID_VA_ACA`) y cargalo como `GOOGLE_DRIVE_FOLDER_ID` en Vercel.

#### Opción B — con una cuenta de Google personal (sin Workspace)

Acá la app sube los archivos "como si fuera" tu propia cuenta de Google (usando OAuth, el mismo mecanismo de "Iniciar sesión con Google" de cualquier app), así que cuentan contra tu almacenamiento normal (los 15 GB gratis, o lo que tengas). No hace falta Unidad compartida ni indicar una carpeta: la app crea sola una carpeta llamada "Tuesday ILCE - Archivos" en tu Drive la primera vez que se usa.

Es una configuración de una sola vez, en dos partes: crear las credenciales en Google Cloud, y autorizar tu cuenta.

**1) Crear las credenciales (Google Cloud Console)**

1. Andá a [console.cloud.google.com](https://console.cloud.google.com), con cualquier cuenta de Google (no hace falta Workspace). Creá un proyecto nuevo si no tenés uno (arriba a la izquierda, selector de proyecto → "Proyecto nuevo") — el nombre no importa, por ejemplo "Tuesday ILCE".
2. Menú ☰ → "APIs y servicios" → "Biblioteca". Buscá "Google Drive API" y hacé clic en "Habilitar".
3. Menú ☰ → "APIs y servicios" → "Pantalla de consentimiento de OAuth". Elegí **Externo** → Crear. Completá solo lo obligatorio (nombre de la app, tu email en "Correo electrónico de asistencia al usuario" y en "Datos de contacto del desarrollador") → Guardar y continuar en cada paso, sin agregar scopes especiales. En la pantalla de "Usuarios de prueba", agregá tu propio email (el de la cuenta que va a guardar los archivos) → Guardar. **No hace falta publicarla ni pedirle verificación a Google.**
4. Menú ☰ → "APIs y servicios" → "Credenciales" → "+ Crear credenciales" → "ID de cliente de OAuth". Tipo de aplicación: **Aplicación web**. En "URIs de redireccionamiento autorizados" agregá:
   ```
   https://TU-DOMINIO-DE-VERCEL/api/drive-auth/callback
   ```
   (reemplazá `TU-DOMINIO-DE-VERCEL` por el dominio real de tu proyecto en Vercel). Creá.
5. Te va a mostrar un **Client ID** y un **Client secret** — copialos.

**2) Cargar variables y autorizar tu cuenta**

1. En Vercel, agregá estas dos variables (Settings → Environment Variables) y desplegá:
   | Variable | Valor |
   |---|---|
   | `GOOGLE_OAUTH_CLIENT_ID` | El "Client ID" del paso anterior |
   | `GOOGLE_OAUTH_CLIENT_SECRET` | El "Client secret" del paso anterior |
2. Ya desplegado, abrí en el navegador (reemplazando ambas partes):
   ```
   https://TU-DOMINIO-DE-VERCEL/api/drive-auth/iniciar?clave=TU_SETUP_BOOTSTRAP_KEY
   ```
3. Te va a llevar a elegir tu cuenta de Google y aceptar el permiso. Como la app está "sin verificar" por Google, va a mostrar una pantalla de advertencia — hacé clic en "Avanzado" (o "Configuración avanzada") → "Ir a [nombre de tu app] (no seguro)". Es tu propia app, hecha por vos, así que es seguro continuar.
4. Al aceptar, te va a mostrar un texto largo (el "refresh token"). Copialo y cargalo en Vercel como una tercera variable:
   | Variable | Valor |
   |---|---|
   | `GOOGLE_OAUTH_REFRESH_TOKEN` | El texto que te mostró la página |
5. Desplegá una vez más. Listo — ya podés subir archivos, y quedan guardados en tu propio Drive, dentro de la carpeta "Tuesday ILCE - Archivos" que la app crea sola.

Si en algún momento este permiso deja de funcionar (por ejemplo, si lo revocás desde [myaccount.google.com/permissions](https://myaccount.google.com/permissions)), solo hay que repetir el paso 2 de autorización — las credenciales del paso 1 siguen sirviendo.

---

Cada archivo que se sube queda visible para "cualquiera con el link" (de solo lectura) — es necesario para que se pueda ver la miniatura y la vista previa dentro del tablero sin pedir que cada persona inicie sesión con Google. El límite actual es **4 MB por archivo** (es el límite que impone Vercel al tamaño de una request, no algo que podamos subir desde acá).

## 4) Primer ingreso

1. Entrá a `/setup-password` con tu email (el que cargaste como SuperAdmin en el Sheet) y la `SETUP_BOOTSTRAP_KEY`, y elegí tu contraseña.
2. Iniciá sesión en `/login`.
3. Desde "Accesos" podés cargar al resto del equipo (no hace falta que cada uno pase por `/setup-password` con la bootstrap key — vos como SuperAdmin les podés asignar una contraseña directamente desde ahí).

## Qué hace cada rol

- **Colaborador**: usa el tablero completo (crea/edita contenidos, comenta), pero no toca la estructura (columnas/grupos-eliminar) ni entra a Accesos/Historial.
- **Admin**: todo lo de Colaborador, más: agregar/editar/eliminar columnas y grupos, gestionar usuarios en Accesos, ver Historial de cambios completo.
- **SuperAdmin**: todo lo de Admin, más: crear o eliminar otros Admin/SuperAdmin.

## Simplificaciones respecto del prototipo original

Decisiones a propósito, para que el tablero funcione de verdad con datos persistentes en Sheets (no en memoria del navegador):

1. **Adjuntos = subida real de archivos**, guardados en una carpeta de Google Drive (ver 2.1) — subís el archivo desde tu computadora como en cualquier app, y se genera sola una miniatura y una vista previa (funciona para imágenes, PDFs, videos y documentos de Office). Límite: 4 MB por archivo.
2. **"Responsable" = gente real del equipo**, la misma lista de `Usuarios`/Accesos. Admin/SuperAdmin pueden crear una persona nueva sin salir del tablero (desde el mismo selector de Responsable, tocando "+ Crear persona"), pero a diferencia del prototipo se les pide el email real (porque esa persona queda cargada en Usuarios y podría loguearse después) — no se crean "personas sueltas" sin email real.

También: reordenar contenidos dentro de un grupo se hace con las flechitas ↑↓ (no arrastrando), y no hay arrastre entre grupos — para mover un contenido a otro grupo se usa el selector que está arriba de todo en su ficha de detalle.
