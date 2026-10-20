/** Las 15 calificaciones del formulario de evaluación (mismas claves que la API). */
export const CALIFICACIONES = [
  'califPuntualidad',
  'califOrganizacion',
  'califAtencion',
  'califEspacioFisico',
  'califTiempoAsignado',
  'evalEquipoActitud',
  'evalEquipoConocimiento',
  'evalEquipoComunicacion',
  'evalEquipoFomentoParticipacion',
  'evalEquipoAmbienteInclusivo',
  'evalActApropiacionEdad',
  'evalActCreatividadDinamicas',
  'evalActPertinenciaTemas',
  'evalActPromocionHabilidades',
  'evalActAprendizajesSignificativos',
] as const;

export type Calificacion = (typeof CALIFICACIONES)[number];
export type Calificaciones = Record<Calificacion, number>;

export interface ItemCalificacion {
  key: Calificacion;
  /** Etiqueta del formulario público y del resumen (§6). */
  larga: string;
  /** Etiqueta abreviada del detalle (§10.19). */
  corta: string;
  /** Etiqueta del formulario interno (§10.18). */
  interna: string;
}

export interface GrupoCalificacion {
  titulo: string;
  /** Clase de texto del detalle (`text-primary` …). */
  clase: string;
  /** Color de cabecera del resumen imprimible. */
  color: string;
  items: ItemCalificacion[];
}

export const GRUPOS_CALIFICACION: GrupoCalificacion[] = [
  {
    titulo: 'Calificación General',
    clase: 'text-primary',
    color: '#0b57d0',
    items: [
      { key: 'califPuntualidad', larga: 'Puntualidad', corta: 'Puntualidad', interna: 'Puntualidad' },
      { key: 'califOrganizacion', larga: 'Organización', corta: 'Organización', interna: 'Organización' },
      { key: 'califAtencion', larga: 'Atención al público', corta: 'Atención', interna: 'Atención' },
      { key: 'califEspacioFisico', larga: 'Espacio físico', corta: 'Espacio físico', interna: 'Espacio físico' },
      { key: 'califTiempoAsignado', larga: 'Tiempo asignado', corta: 'Tiempo asignado', interna: 'Tiempo asignado' },
    ],
  },
  {
    titulo: 'Evaluación del Equipo',
    clase: 'text-success',
    color: '#16a34a',
    items: [
      { key: 'evalEquipoActitud', larga: 'Actitud', corta: 'Actitud', interna: 'Actitud' },
      { key: 'evalEquipoConocimiento', larga: 'Conocimiento', corta: 'Conocimiento', interna: 'Conocimiento/Dominio' },
      { key: 'evalEquipoComunicacion', larga: 'Comunicación', corta: 'Comunicación', interna: 'Comunicación' },
      { key: 'evalEquipoFomentoParticipacion', larga: 'Fomento de participación', corta: 'Fomento de Participación', interna: 'Fomento de participación' },
      { key: 'evalEquipoAmbienteInclusivo', larga: 'Ambiente inclusivo', corta: 'Ambiente Inclusivo', interna: 'Ambiente inclusivo' },
    ],
  },
  {
    titulo: 'Evaluación de la Actividad',
    clase: 'text-info',
    color: '#0891b2',
    items: [
      { key: 'evalActApropiacionEdad', larga: 'Apropiación para la edad', corta: 'Apropiación', interna: 'Apropiación para la edad' },
      { key: 'evalActCreatividadDinamicas', larga: 'Creatividad de dinámicas', corta: 'Creatividad', interna: 'Creatividad/Dinámicas' },
      { key: 'evalActPertinenciaTemas', larga: 'Pertinencia de temas', corta: 'Pertinencia', interna: 'Pertinencia de temas' },
      { key: 'evalActPromocionHabilidades', larga: 'Promoción de habilidades', corta: 'Habilidades', interna: 'Promoción de habilidades' },
      { key: 'evalActAprendizajesSignificativos', larga: 'Aprendizajes significativos', corta: 'Aprendizajes', interna: 'Aprendizajes significativos' },
    ],
  },
];

/** Opciones del formulario público (sin opción vacía, por defecto 5). */
export const ESCALA_PUBLICA = [
  { value: 5, label: '5 - Excelente' },
  { value: 4, label: '4 - Muy Bueno' },
  { value: 3, label: '3 - Bueno' },
  { value: 2, label: '2 - Regular' },
  { value: 1, label: '1 - Necesita Mejorar' },
];

/** Opciones del formulario interno. */
export const ESCALA_INTERNA = [
  { value: 1, label: '1 - Muy bajo' },
  { value: 2, label: '2 - Bajo' },
  { value: 3, label: '3 - Medio' },
  { value: 4, label: '4 - Alto' },
  { value: 5, label: '5 - Muy alto' },
];

/** `4.333` → `'4.3'`. */
export function promedio1(valor: number | null | undefined): string {
  return (Math.round((valor ?? 0) * 10) / 10).toFixed(1);
}

/** Color del promedio en el resumen (≥4 verde, ≥3 ámbar, resto rojo). */
export function colorPromedio(valor: number): string {
  if (valor >= 4) return '#16a34a';
  if (valor >= 3) return '#f7b84b';
  return '#e74c3c';
}
