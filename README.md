# BiblioMóvil Web — Angular

Frontend de la plataforma de biblioteca móvil de Comfasucre. Angular 21 (componentes standalone, signals,
formularios reactivos), Bootstrap 5.3 y Remix Icon. Replica el diseño del sistema original: sidebar oscura fija,
barra superior con rol, Ask AI, notificaciones y usuario; tarjetas, tablas y badges con la misma paleta
(`#5C59E8` primario, `#0E1E38` sidebar, `#F4F6FA` fondo, tipografías Outfit/Inter).

- Convenciones de código: [`ARCHITECTURE.md`](ARCHITECTURE.md).
- Backend: [`../bibliomovil-app`](../bibliomovil-app/README.md).

## Requisitos

Node.js ≥ 24 (Angular 21 requiere ≥ 20.19), npm ≥ 10 (usar `--legacy-peer-deps` con npm 11.4.x).

## Puesta en marcha

```bash
npm install --legacy-peer-deps
npm start            # http://localhost:4200 (usa src/environments/environment.development.ts → apiUrl http://localhost:3000/api)
```

## Scripts

| Script | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo con recarga |
| `npm run build` | Build de producción en `dist/bibliomovil-web/browser` |
| `npm test` | Pruebas unitarias (Vitest) |

## Configuración por entorno

| Archivo | Uso |
|---|---|
| `src/environments/environment.development.ts` | `ng serve` / `ng build --configuration development`: `apiUrl: http://localhost:3000/api` |
| `src/environments/environment.ts` | Producción. `apiUrl` contiene el marcador `__API_URL__`, que el `Dockerfile` sustituye con el argumento de build `API_URL` |

Build de producción manual: `sed -i "s#__API_URL__#https://api.tudominio.com/api#" src/environments/environment.ts && npm run build`.
Docker: `docker build --build-arg API_URL=https://api.tudominio.com/api -t bibliomovil-web .` (nginx sirve la SPA con
`try_files … /index.html`).

## Rutas principales

| Ruta | Rol | Pantalla |
|---|---|---|
| `/login`, `/registro-institucion` | público | Acceso y registro de instituciones |
| `/evaluar/actividad/:id` | público | Evaluación de una actividad (destino del QR) |
| `/carnets/verificar/:id` | público | Verificación de carnet (destino del QR) |
| `/dashboard` | administrador, institución | Inicio con KPIs y listados recientes |
| `/profesional/dashboard`, `/profesional/actividades`, `/profesional/actividades/:id/ejecucion` | profesional | Panel, mis actividades, registro de ejecución |
| `/solicitudes`, `/solicitudes/nueva`, `/solicitudes/:id`, `/solicitudes/reporte`, `/solicitudes/estadisticas` | según rol | Solicitudes y reportes imprimibles |
| `/actividades`, `/actividades/registradas`, `/actividades/nueva`, `/actividades/:id`, `/actividades/calendario-mensual`, `/actividades/estadisticas` | según rol | Calendario, listado, formulario, detalle, reportes |
| `/evaluaciones`, `/evaluaciones/actividad/:id`, `/evaluaciones/nueva`, `/evaluaciones/resumen` | administrador, institución | Resúmenes de evaluación |
| `/libros`, `/libros/nuevo`, `/libros/:id`, `/libros/:id/editar` | todos / administrador | Catálogo y gestión de libros |
| `/prestamos`, `/prestamos/solicitar`, `/prestamos/admin`, `/prestamos/:id` | institución / administrador | Préstamos |
| `/carnets/registro`, `/carnets/historial`, `/carnets/:id`, `/admin/carnets` | institución carnetizada / administrador | Carnets digitales |
| `/admin/instituciones`, `/admin/usuarios`, `/admin/usuarios/nuevo`, `/admin/usuarios/:id/editar` | administrador | Administración |
| `/perfil` | todos | Mi perfil y cambio de contraseña |

## Estructura

```
src/app/
├── core/       # ApiService, AuthService + interceptor + guards, layouts (principal, auth, público), notificaciones, alertas
├── shared/     # componentes (PageTitle, Modal, ConfirmDialog, Pagination, Loading, FieldError…), pipes, utilidades de formularios, catálogos
└── features/   # auth, dashboard, perfil, admin, solicitudes, actividades, evaluaciones, libros, prestamos, carnets, asistente
```

## Impresión de reportes y carnets

Los reportes (solicitudes, actividades, evaluaciones, calendario mensual) y el carnet digital son vistas imprimibles:
el botón "Imprimir / Guardar PDF" usa el diálogo del navegador (`window.print()`), que permite guardar como PDF.
Los controles que no deben imprimirse llevan la clase `no-print`.
