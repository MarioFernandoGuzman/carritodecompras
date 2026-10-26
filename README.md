# VISERA · Tienda de gorras

Setup inicial con Express, MySQL y React 18. Requiere Node.js **20.19+** (o 22.12+/24+) y npm. MySQL **8** es necesario para comprobar el pool; la página y `/api/salud` funcionan sin base de datos.

## Instalar y ejecutar

Desde la raíz, en PowerShell:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
npm run dev
```

En otra terminal desde la raíz:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Abre [la aplicación](http://127.0.0.1:5173). Debe mostrar **“Conexión con el servidor correcta.”**. El botón permite repetir la comprobación. La [API de salud](http://127.0.0.1:3000/api/salud) devuelve `{ "ok": true }`.

Usa `127.0.0.1` en ambas direcciones. Si cambias puertos u origen, ajusta `PORT` y `FRONTEND_URL` en `backend/.env`, y `VITE_API_URL` en `frontend/.env`; reinicia los servidores.

## Conexión MySQL

Inicia MySQL 8 y configura `DB_HOST`, `DB_PORT`, `DB_USER` y `DB_PASSWORD` en `backend/.env` con tus datos locales. Puedes dejar `DB_NAME` vacío en esta fase; no se crea ningún esquema. Ejecuta en `backend/`:

```powershell
npm run db:check
```

El comando ejecuta `SELECT 1` mediante el pool y termina con error si no conecta. `/api/salud` comprueba solo Express, no MySQL. El esquema `gorras_db`, los datos de ejemplo y sus scripts corresponden a la fase 2.

## Comprobar y construir

Ejecuta `npm test` y `npm run build` en cada aplicación. Vitest está preparado con `--passWithNoTests`: esta fase todavía no incluye pruebas automatizadas. En backend, `build` valida la sintaxis de los puntos de entrada y configuración; Node ejecuta JavaScript directamente. En frontend genera `dist/`; puedes revisarlo con `npm run preview`.

## Estructura

- `backend/`: API, configuración del pool y carpetas para las capas del servidor.
- `frontend/`: React, cliente fetch con cookies, CSS Modules y variables CSS.
- `database/`: reservada para los SQL de la siguiente fase.

Los `.gitkeep` conservan las carpetas pendientes. `AGENTS.md`, `CLAUDE.md`, `docs/`, `.env`, dependencias y builds quedan fuera de Git. `docs/` permanece vacía y solo local en esta fase.
