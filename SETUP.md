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
| Id | ItemId | Autor | Texto | Fecha |
|---|---|---|---|---|

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

No hacen falta (todavía) `GMAIL_USER`, `GMAIL_APP_PASSWORD` ni `CRON_SECRET` — no hay ninguna función de mail ni de tareas programadas en esta primera versión.

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

1. **Adjuntos = enlaces, con vista previa.** No hay carga de archivos desde tu computadora — pegás un link (de Drive, etc.) con un nombre, y la app detecta sola si es imagen/video/PDF/enlace común para mostrar una miniatura y abrirlo en grande (como el prototipo), pero el archivo en sí sigue viviendo donde lo hayas subido vos (Drive, etc.), no en la app.
2. **"Responsable" = gente real del equipo**, la misma lista de `Usuarios`/Accesos. Admin/SuperAdmin pueden crear una persona nueva sin salir del tablero (desde el mismo selector de Responsable, tocando "+ Crear persona"), pero a diferencia del prototipo se les pide el email real (porque esa persona queda cargada en Usuarios y podría loguearse después) — no se crean "personas sueltas" sin email real.

También: reordenar contenidos dentro de un grupo se hace con las flechitas ↑↓ (no arrastrando), y no hay arrastre entre grupos — para mover un contenido a otro grupo se usa el selector que está arriba de todo en su ficha de detalle.
