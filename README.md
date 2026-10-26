# VISERA · Tienda de gorras

Tienda de gorras con Express, MySQL y React 18. Fases 1–4: configuración, base de datos, autenticación y catálogo. Requiere Node.js **20.19+** (o 22.12+/24+), npm y MySQL **8.0.16+** (por las restricciones CHECK).

## Instalar y ejecutar

Desde la raíz, en PowerShell:

```powershell
cd backend
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
node --input-type=module -e 'import { randomBytes } from "node:crypto"; console.log(randomBytes(48).toString("hex"))'
# Copia el resultado en JWT_SECRET dentro de .env antes de iniciar el servidor.
npm run dev
```

En otra terminal desde la raíz:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Abre [la aplicación](http://127.0.0.1:5173): Inicio muestra categorías y destacados; `/gorras` permite explorar el catálogo. La [API de salud](http://127.0.0.1:3000/api/salud) devuelve `{ "ok": true }`.

Usa `127.0.0.1` en ambas direcciones. Si cambias puertos u origen, ajusta `PORT` y `FRONTEND_URL` en `backend/.env`, y `VITE_API_URL` en `frontend/.env`; reinicia los servidores.

## Preparar MySQL y el administrador

Inicia MySQL y configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME=gorras_db` en `backend/.env`. En el entorno local indicado, el usuario es `root` y la contraseña está vacía. La conexión usada para instalar necesita permisos para crear bases y tablas. Desde `backend/`:

```powershell
npm run db:setup
npm run db:check
```

`db:setup` ejecuta `database/schema.sql` y `database/seed.sql`: crea ambas bases y recrea las 10 tablas en `gorras_db`, con 4 categorías, 12 productos, 72 variantes y 71 movimientos iniciales. Incluye una variante agotada y dos con stock bajo. `db:check` comprueba el pool con `SELECT 1`; `/api/salud` comprueba solo Express.

**Cada ejecución de `db:setup` elimina los datos de las tablas de `gorras_db`, incluidos los usuarios.** El esquema puede repetirse, pero los cambios de estructura no tienen rollback en MySQL; si falla, corrige la causa y vuelve a ejecutar el setup. Las semillas se cargan en una transacción.

Completa `ADMIN_EMAIL`, `ADMIN_NOMBRE` y `ADMIN_PASSWORD` en `backend/.env`. Usa una contraseña de al menos 12 caracteres y máximo 72 bytes UTF-8 (límite de bcrypt). Ejecuta:

```powershell
npm run create-admin
```

Crea el administrador o, si el email ya existe, actualiza nombre y contraseña, le asigna rol `admin` y lo activa. Conserva su ID e historial. El hash usa bcrypt con costo 12; el script no muestra la contraseña ni el hash. Repite este comando después de recrear la base. Las credenciales se configuran localmente: no hay usuarios ni contraseñas en el SQL.

Ejemplo para consultar productos con sus variantes en MySQL:

```sql
USE gorras_db;
SELECT p.nombre, p.precio, v.color_nombre, v.color_hex, v.talla, v.stock
FROM productos AS p
JOIN variantes AS v ON v.producto_id = p.id
WHERE p.slug = 'snapback-volcan'
ORDER BY v.id;
```

## Comprobar y construir

Desde `backend/`, prepara primero las tablas de pruebas y ejecuta:

```powershell
npm run db:setup:test
npm test
npm run build
```

`db:setup:test` equivale a `npm run db:setup -- --test`: recrea únicamente las tablas de `gorras_test`, sin semillas. No modifica las tablas de `gorras_db`. Vitest fuerza `NODE_ENV=test` y `DB_NAME=gorras_test`; usa las mismas credenciales MySQL del `.env`. Las 6 pruebas verifican integridad, provisión del administrador, registro, login/cookie, usuarios inactivos, logout y permisos. Limpian sus datos al terminar. Ejecuta el setup antes de las pruebas por primera vez o tras cambiar el esquema.

## Autenticación

Abre `/registro` para crear un cliente o `/ingresar` para iniciar sesión. La contraseña requiere 8 caracteres como mínimo, una letra y un número; bcrypt admite hasta 72 bytes. Registrarse también inicia sesión. El encabezado permite salir. Recarga la página para comprobar que la sesión persiste.

Endpoints: `POST /api/auth/registro` (`nombre`, `email`, `password`, `telefono` opcional), `POST /api/auth/login` (`email`, `password`), `POST /api/auth/logout` y `GET /api/auth/yo`. Las respuestas usan `{ ok, data | error }`; nunca incluyen hashes. Un intento de asignar `rol` desde el registro se rechaza con 422.

`JWT_SECRET` debe ser aleatorio, de al menos 32 caracteres y quedar solo en `.env`. Cambiarlo invalida sesiones existentes. El JWT dura 8 horas y se guarda en cookie `httpOnly`, `sameSite=lax`, `secure` en producción. Cada petición protegida consulta el usuario activo y su rol en MySQL. El límite de `/api/auth/*` es de 100 solicitudes por IP cada 15 minutos.

`/admin/*` exige sesión y rol admin: un visitante va a `/ingresar`; un cliente vuelve a `/`. Por ahora muestra solo la confirmación de acceso; el panel se implementará en su fase. Para acceder como admin, usa las credenciales elegidas con `npm run create-admin`. En producción, sirve frontend y API por HTTPS en el mismo sitio para conservar la política de cookies. Carrito y compra siguen pendientes.

## Catálogo

Rutas públicas: `GET /api/categorias`, `GET /api/productos` y `GET /api/productos/:slug`. Filtros: `categoria` (slug), `buscar`, `color` (nombre), `talla`, `min`, `max`, `orden` (`destacados`, `nuevos`, `precio_asc`, `precio_desc`), `pagina` y `limite` (máximo 48, predeterminado 12; la interfaz usa 6). Ejemplo: `/api/productos?categoria=dad-hat&min=100&max=160&orden=precio_asc`.

La búsqueda usa FULLTEXT con prefijos de palabras de 3 o más caracteres y LIKE escapado para búsquedas cortas. Solo se muestran productos activos con variantes activas. El listado devuelve productos con categoría, colores y estado agotado, más `paginacion`; se resuelve con dos consultas, sin N+1. Color y talla deben coincidir en una misma variante. El indicador agotado considera todas las variantes activas del producto, independientemente del filtro.

Abre `/gorras`, aplica filtros, busca y usa Atrás: la URL conserva el estado. En móvil, Menú y Filtros abren paneles inferiores con cierre por Escape. En `/gorras/snapback-volcan`, el color negro tiene S/M agotada y deshabilitada; en Dad Hat Atitlán, verde jade L/XL muestra las últimas 2 unidades. Las gorras son SVG propios, sin imágenes externas. El carrito sigue en 0 y Agregar permanece deshabilitado hasta la fase 5.

En `frontend/`, ejecuta `npm test` y `npm run build`. Aún no hay pruebas de interfaz: Vitest permite esa ausencia con `--passWithNoTests`. En backend, `build` valida la sintaxis; Node ejecuta JavaScript directamente. En frontend genera `dist/`; puedes revisarlo con `npm run preview`.

## Estructura

- `backend/`: API, configuración del pool y carpetas para las capas del servidor.
- `frontend/`: React, cliente fetch con cookies, CSS Modules y variables CSS.
- `database/`: estructura SQL repetible y datos de ejemplo sin credenciales.

Los `.gitkeep` conservan las carpetas pendientes. `AGENTS.md`, `CLAUDE.md`, `docs/`, `.env`, dependencias y builds quedan fuera de Git. La documentación del proceso se mantiene solo en `docs/` local.
