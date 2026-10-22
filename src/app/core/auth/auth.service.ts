import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import { AuthUser, CurrentUser, LoginResponse, Rol } from '../models/auth.models';

const TOKEN_KEY = 'bibliomovil.token';
const USER_KEY = 'bibliomovil.user';

/** Estado de autenticación basado en signals; persiste el JWT en localStorage. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly tokenSignal = signal<string | null>(this.read(TOKEN_KEY));
  private readonly userSignal = signal<AuthUser | null>(this.readUser());
  private readonly currentSignal = signal<CurrentUser | null>(null);

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  /** Perfil ampliado (incluye `esCarnetizada`), cargado tras iniciar sesión. */
  readonly current = this.currentSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal() && !!this.userSignal());
  readonly rol = computed<Rol | null>(() => this.userSignal()?.rol ?? null);
  readonly primerNombre = computed(() => (this.userSignal()?.nombre ?? '').trim().split(/\s+/)[0] || 'Usuario');

  login(correo: string, contrasena: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('auth/login', { correo, contrasena }).pipe(
      tap((res) => {
        this.write(TOKEN_KEY, res.token);
        this.write(USER_KEY, JSON.stringify(res.usuario));
        this.tokenSignal.set(res.token);
        this.userSignal.set(res.usuario);
      }),
    );
  }

  /** Inicia sesión con un JWT emitido por el servidor (ingreso con Google) y carga la identidad. */
  loginConToken(token: string): Observable<CurrentUser> {
    this.write(TOKEN_KEY, token);
    this.tokenSignal.set(token);
    return this.refreshCurrent();
  }

  /** Refresca la identidad desde el servidor (p. ej. tras cambiar nombre o carnetización). */
  refreshCurrent(): Observable<CurrentUser> {
    return this.api.get<CurrentUser>('auth/me').pipe(
      tap((me) => {
        this.currentSignal.set(me);
        const user: AuthUser = { id: me.id, nombre: me.nombre, correo: me.correo, rol: me.rol, institucionId: me.institucionId };
        this.userSignal.set(user);
        this.write(USER_KEY, JSON.stringify(user));
      }),
    );
  }

  logout(redirect = true): void {
    this.remove(TOKEN_KEY);
    this.remove(USER_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.currentSignal.set(null);
    if (redirect) void this.router.navigate(['/login']);
  }

  /** Ruta de inicio según el rol (equivalente al redirect post-login del sistema original). */
  homeFor(rol: Rol | null): string {
    return rol === 'profesional' ? '/profesional/dashboard' : '/dashboard';
  }

  hasRole(...roles: Rol[]): boolean {
    const rol = this.rol();
    return !!rol && roles.includes(rol);
  }

  private readUser(): AuthUser | null {
    const raw = this.read(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* almacenamiento no disponible */
    }
  }
  private remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* almacenamiento no disponible */
    }
  }
}
