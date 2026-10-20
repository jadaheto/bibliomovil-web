# Arquitectura del frontend (Angular 21)

Convenciones que siguen todas las funcionalidades. Léelo antes de añadir código.

## Estructura

```
src/
├── environments/           # apiUrl por entorno (development / production)
├── styles.scss             # Bootstrap 5 + Remix Icon + estilos del layout original (sidebar, topbar, cards, tablas…)
└── app/
    ├── app.config.ts       # Router, HttpClient con interceptor JWT, LOCALE_ID es-CO
    ├── app.routes.ts       # Rutas raíz: layouts (auth / público / principal) y lazy loading por funcionalidad
    ├── core/               # Infraestructura de la aplicación (una instancia)
    │   ├── api/ApiService              # Cliente HTTP base (prefijo apiUrl, query params, errores normalizados `ApiRequestError`)
    │   ├── auth/                       # AuthService (signals + localStorage), interceptor, guards (authGuard, roleGuard, guestGuard)
    │   ├── layout/                     # MainLayout (sidebar + topbar + footer + Ask AI), AuthLayout, PublicLayout
    │   ├── notificaciones/             # Servicio de la campana (contador, recientes, marcar leídas)
    │   ├── ui/                         # AlertService (mensajes flash) + AlertsComponent
    │   └── models/                     # Tipos compartidos (Rol, AuthUser…)
    ├── shared/             # Reutilizable y sin estado global
    │   ├── components/     # PageTitle, Modal, ConfirmDialog/ConfirmService, Pagination, Loading, EmptyState, FieldError
    │   ├── pipes/          # estadoBadge, iniciales, titlecaseEs
    │   ├── forms/          # marcarTodoTocado, mensajeError, coincidenValidator
    │   └── constants/      # MUNICIPIOS_SUCRE, catálogos, badgeEstado, normalizar
    └── features/<modulo>/  # Una carpeta por módulo de negocio
        ├── <modulo>.routes.ts          # `export const XXX_ROUTES: Routes` con loadComponent
        ├── <modulo>.service.ts         # Llamadas a la API tipadas (interfaces de los DTOs del backend)
        ├── <modulo>-list.component.ts  # Listado (tabla + buscador + paginación)
        ├── <modulo>-form.component.ts  # Alta/edición (formularios reactivos)
        └── <modulo>-detail.component.ts
```

## Reglas

- **Componentes standalone** (sin `standalone: true`, es el valor por defecto), `inject()` en vez de constructor,
  **signals** para estado local (`signal`, `computed`, `input()`, `output()`), control de flujo `@if/@for/@switch`.
- Plantillas inline (`template:`) salvo que superen ~150 líneas; entonces `templateUrl`. Estilos en `styles.scss`
  (clases globales del layout) o `styles:` del componente solo para lo específico.
- **Formularios reactivos** (`FormBuilder.nonNullable`) con `<app-field-error [control]="form.controls.x" etiqueta="…">`
  y `marcarTodoTocado(form)` antes de enviar. Validaciones espejo de las del backend (required, email, minLength 6…).
- Peticiones siempre a través de `ApiService` (o un servicio de feature que lo use); los errores llegan como
  `ApiRequestError` con `message` listo para mostrar. Mensajes de éxito/error con `AlertService`
  (`success()` / `error()`), que se pintan automáticamente bajo el título de página (`<app-alerts>` en el layout).
- Confirmaciones destructivas con `ConfirmService.ask({...})` (devuelve `Promise<boolean>`), nunca `confirm()`.
- Modales con `<app-modal [abierto]="sig()" titulo="…" (cerrar)="sig.set(false)">`; pie con `<div modal-footer class="modal-footer">`.
- Listados: `table table-hover align-middle mb-0` dentro de `.table-responsive`, `<thead class="table-light">`,
  badges de estado con el pipe `estadoBadge`, fila vacía con el texto del sistema original, `<app-pagination>` cuando el
  endpoint pagina (`{ items, meta }`).
- Fechas con `DatePipe` (`'dd/MM/yyyy'`, `'dd/MM/yyyy HH:mm'`, `'h:mm a'` para horas).
- Estructura de página: `<app-page-title titulo="…">botones</app-page-title>` + `.card` (`.card-header` con `.card-title`,
  opcional `bg-success`/`bg-primary`) + `.card-body`.
- Permisos en la UI: `auth.hasRole('administrador')` para mostrar/ocultar; las rutas llevan `roleGuard(...)`.
- Rutas en español y kebab-case, parámetros con `withComponentInputBinding` (`readonly id = input<string>()`).
- Archivos subidos: `FormData` enviado con `ApiService.post` (HttpClient no fija `Content-Type`); las URLs de archivos
  ya vienen absolutas desde la API, o se convierten con `api.fileUrl(ruta)`.
- Reportes "PDF": vista imprimible (clase `no-print` para ocultar controles) + `window.print()`.
- Pruebas: Vitest (`npm test`): servicios con `provideHttpClientTesting`, componentes con `TestBed` y `setInput`,
  utilidades puras sin TestBed. Cada feature añade pruebas de su servicio y de la lógica no trivial de componentes.
- `npm run build` debe compilar sin errores ni advertencias de plantilla (strictTemplates activo).
