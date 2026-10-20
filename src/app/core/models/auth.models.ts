export type Rol = 'administrador' | 'profesional' | 'institucion';

export const ROL_LABEL: Record<Rol, string> = {
  administrador: 'Administrador',
  profesional: 'Profesional',
  institucion: 'Institución Educativa',
};

export interface AuthUser {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  institucionId: number | null;
}

export interface CurrentUser extends AuthUser {
  cargo: string | null;
  institucionNombre: string | null;
  esCarnetizada: boolean;
}

export interface LoginResponse {
  token: string;
  expiresIn: string;
  usuario: AuthUser;
}

export interface ApiError {
  statusCode: number;
  code?: string;
  message: string | string[];
}
