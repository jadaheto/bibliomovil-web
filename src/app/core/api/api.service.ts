import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiError } from '../models/auth.models';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

/** Error normalizado que reciben los componentes. */
export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: string[],
  ) {
    super(message);
  }
}

/** Cliente HTTP base: prefija `apiUrl`, serializa query params y normaliza errores. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.params(params) }).pipe(catchError(this.handle));
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body).pipe(catchError(this.handle));
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body).pipe(catchError(this.handle));
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body).pipe(catchError(this.handle));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path)).pipe(catchError(this.handle));
  }

  /** Convierte una ruta relativa de archivo (`uploads/...`) en URL absoluta. */
  fileUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    return `${this.baseUrl.replace(/\/api$/, '')}/${path.replace(/^\//, '')}`;
  }

  private url(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\//, '')}`;
  }

  private params(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }

  private readonly handle = (error: HttpErrorResponse) => {
    const body = (error.error ?? {}) as Partial<ApiError>;
    const raw = body.message;
    const details = Array.isArray(raw) ? raw : undefined;
    const message = Array.isArray(raw)
      ? raw[0] ?? 'Datos inválidos'
      : raw ?? (error.status === 0 ? 'No se pudo conectar con el servidor.' : 'Ocurrió un error inesperado.');
    return throwError(() => new ApiRequestError(error.status, message, body.code, details));
  };
}
