/** Catálogos fijos compartidos con el backend (mismos valores que el sistema original). */

export const MUNICIPIOS_SUCRE = [
  'Corozal', 'Sincelejo', 'Buenavista', 'El Roble', 'Galeras', 'Los Palmitos', 'Morroa', 'Sampués',
  'San Juan de Betulia', 'San Luis de Sincé', 'Chalán', 'Colosó', 'Ovejas', 'Palmito', 'San Onofre',
  'Tolú Viejo', 'Coveñas', 'Santiago de Tolú', 'Caimito', 'La Unión', 'San Marcos', 'San Pedro',
  'Guaranda', 'Majagual', 'San Benito Abad', 'Sucre',
] as const;

export const TIPOS_INSTITUCION: { value: string; label: string }[] = [
  { value: 'Instituciones', label: 'Instituciones' },
  { value: 'CentroEducativos', label: 'Centro Educativos' },
  { value: 'Universidad', label: 'Universidad' },
  { value: 'Organizaciones', label: 'Organizaciones Civiles y/o ONG' },
  { value: 'Empresas', label: 'Empresas' },
  { value: 'Otra', label: 'Otra' },
];

export const ESTADOS_PROFESIONAL = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'suspendido', label: 'Suspendido' },
] as const;

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

/** Clase de badge Bootstrap por estado (solicitudes, actividades, carnets, préstamos, cuentas). */
export function badgeEstado(estado: string | null | undefined): string {
  switch ((estado ?? '').toLowerCase()) {
    case 'aprobada': case 'activo': case 'activa': case 'evaluada': case 'devuelto': case 'completado':
      return 'bg-success';
    case 'rechazada': case 'rechazado': case 'cancelado': case 'cancelada': case 'perdido': case 'vencido':
      return 'bg-danger';
    case 'pendiente': case 'programada':
      return 'bg-warning';
    case 'inactiva': case 'inactivo': case 'suspendido': case 'suspendida':
      return 'bg-secondary';
    case 'libros entregados':
      return 'bg-info';
    default:
      return 'bg-secondary';
  }
}

/** Dos iniciales en mayúscula para avatares. */
export function iniciales(nombre: string | null | undefined): string {
  return (nombre ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('') || '?';
}

/** Normaliza texto para búsquedas insensibles a tildes y mayúsculas. */
export function normalizar(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
