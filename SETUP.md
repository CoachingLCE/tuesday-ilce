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

| `GOOGLE_DRIVE_FOLDER_ID` | El ID de una carpeta de Google Drive (ver punto 2.1 más abajo) — es donde se guardan de verdad los archivos que se suben desde la columna "Archivos" |

No hacen falta (todavía) `GMAIL_USER`, `GMAIL_APP_PASSWORD` ni `CRON_SECRET` — no hay ninguna función de mail ni de tareas programadas en esta primera versión.

### 2.1) Carpeta de Drive para los archivos subidos

Como Google Sheets no puede guardar archivos, los adjuntos que subís desde la columna "Archivos" se guardan en una carpeta de Google Drive.

**Importante — tiene que ser una carpeta dentro de una Unidad compartida (Shared Drive), no una carpeta común de "Mi unidad":** la cuenta de servicio (`carga-clases-bot@...`) no es una persona con una cuenta de Google Workspace, así que no tiene almacenamiento propio. Si le pedís que suba un archivo a una carpeta común, Google devuelve el error *"Service Accounts do not have storage quota"* — es justo lo que pasó al principio. Una Unidad compartida es distinta: el almacenamiento es de la unidad (lo paga la organización), no de cada persona o cuenta que tiene acceso, así que ahí sí puede subir archivos sin problema.

1. En Google Drive, creá una **Unidad compartida** nueva (no una carpeta común) — botón "Unidades compartidas" en el menú de la izquierda → "Nueva". Nombrala, por ejemplo, "Tuesday ILCE".
   - Hace falta un plan de Google Workspace que incluya Unidades compartidas (los planes de negocio/organización lo incluyen; una cuenta de Gmail personal gratuita no puede crear una).
2. Agregá a la cuenta de servicio como miembro de esa Unidad compartida, con permiso **Gestor de contenido** (Content Manager) o superior:
   ```
   carga-clases-bot@carga-clases-ilce.iam.gserviceaccount.com
   ```
3. Adentro de la Unidad compartida, podés crear una subcarpeta si querés (por ejemplo "Archivos") o usar la unidad directamente. Sacá el ID de esa carpeta (o de la unidad) de su URL (`https://drive.google.com/drive/folders/EL_ID_VA_ACA`) y cargalo como `GOOGLE_DRIVE_FOLDER_ID` en Vercel.
4. Si ya habías creado una carpeta común (no compartida) antes de saber esto, no hace falta borrar nada: simplemente creá la Unidad compartida como se explica arriba y actualizá `GOOGLE_DRIVE_FOLDER_ID` en Vercel para que apunte a la carpeta nueva. Los archivos que ya se hayan subido antes del cambio no se mueven solos, pero los nuevos van a la carpeta correcta.

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
