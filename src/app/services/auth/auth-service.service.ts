
import { Injectable, Inject, PLATFORM_ID, EventEmitter } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpHeaders, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { User, LoginResponse, RegisterRequest, PaginatedResponse } from '../../models/user.models';
@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';
  private readonly PHOTO_URL_KEY = 'user_photo_url';
  private readonly API_URL = 'http://localhost:3331';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public loginRequested = new EventEmitter<void>();
  public successModal = new EventEmitter<string>();

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.currentUserSubject.next(this.getUserFromStorage());
      this.isAuthenticatedSubject.next(this.hasValidToken());
      this.checkTokenValidity();
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const authRequest = { email, password };

    return this.http.post<AuthenticationResponse>(`${this.API_URL}/auth/login`, authRequest).pipe(
      tap((response: AuthenticationResponse) => {
        if (!response.token || !response.user) {
          throw new Error('Données d\'authentification manquantes');
        }
        this.setAuthData(response);
      }),
      map((response: AuthenticationResponse) => ({
        success: true,
        message: response.message || 'Connexion réussie',
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken
      })),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.getErrorMessage(error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

 // auth-service.service.ts
register(registrationData: RegisterRequest, photo?: File): Observable<LoginResponse> {
  const formData = new FormData();
  formData.append('request', new Blob([JSON.stringify(registrationData)], { type: 'application/json' }));
  if (photo) {
    formData.append('photo', photo, photo.name);
    formData.append('photoTitle', `${registrationData.firstName}_profile_${Date.now()}`);
    console.log('FormData - Photo included:', photo.name, photo.size);
  } else {
    console.warn('FormData - No photo provided');
  }

  // Log FormData contents for debugging
  formData.forEach((value, key) => {
    console.log(`FormData entry: ${key}=`, value);
  });

  return this.http.post<RegistrationResponse>(`${this.API_URL}/auth/register`, formData).pipe(
    map((response: RegistrationResponse | null) => {
      console.log('Backend response:', response);
      const message = response?.message || 'Inscription réussie ! Veuillez vous connecter.';
      const successResponse: LoginResponse = {
        success: true,
        message
      };
      this.successModal.emit(message);
      setTimeout(() => this.router.navigate(['/login']), 5000);
      return successResponse;
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Registration error:', error);
      const errorMessage = this.getErrorMessage(error);
      return throwError(() => new Error(errorMessage));
    })
  );
}
  getCurrentUserId(): number | null {
    const user = this.getUserFromStorage();
    return user?.id || null;
  }



getUserEmailFromToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const token = localStorage.getItem(this.TOKEN_KEY);
  if (!token) {
    return null;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.email || null; // selon ce que ton JWT contient
  } catch {
    return null;
  }
}


  getAllUsers(page: number = 0, size: number = 10): Observable<PaginatedResponse<User>> {
    return this.http.get<AuthenticationResponse>(`${this.API_URL}/auth/admin/getAllUsers`, {
      params: { page: page.toString(), size: size.toString() }
    }).pipe(
      map((response: AuthenticationResponse) => ({
        content: response.userList || [],
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0,
        size,
        number: page,
        first: page === 0,
        last: page === (response.totalPages || 0) - 1,
        empty: !response.userList || response.userList.length === 0
      })),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.getErrorMessage(error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/auth/logout`, {}).pipe(
      tap(() => this.clearAuthData()),
      catchError(() => {
        this.clearAuthData();
        return of(void 0);
      })
    );
  }

  refreshToken(): Observable<{ accessToken: string; refreshToken?: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Aucun refresh token disponible'));
    }

    return this.http.post<{ accessToken: string, refreshToken?: string }>(`${this.API_URL}/auth/refresh-token`, { refreshToken }).pipe(
      tap((response) => {
        if (response.accessToken && isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.TOKEN_KEY, response.accessToken);
          if (response.refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (isPlatformBrowser(this.platformId)) {
          this.logoutOnError();
        }
        return throwError(() => error);
      })
    );
  }

  logoutOnError(): void {
    this.clearAuthData();
  }

  getAuthHeaders(): HttpHeaders {
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem(this.TOKEN_KEY);
    }
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const hasToken = this.hasValidToken();
    const hasUser = this.currentUserSubject.value !== null;
    return hasToken && hasUser;
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser$.pipe(
      map(user => user || this.getUserFromStorage()),
      catchError(() => of(null))
    );
  }

  getRoles(): string[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }
    const tokenRoles = this.getRolesFromToken();
    if (tokenRoles.length > 0) {
      return tokenRoles;
    }
    const user = this.getUser();
    if (user?.authorities && Array.isArray(user.authorities)) {
      return user.authorities
        .filter((auth: any) => auth.authority != null)
        .map((auth: any) => {
          let role = auth.authority!;
          if (role.startsWith('ROLE_')) {
            role = role.substring(5);
          }
          return role.toUpperCase();
        });
    }
    return [];
  }

  hasRole(role: string): boolean {
    const userRoles = this.getRoles();
    const normalizedRole = role.toUpperCase().replace('ROLE_', '');
    return userRoles.includes(normalizedRole);
  }

  redirectByRole(roles: string[]): void {
    const normalizedRoles = roles.map(role => role.toUpperCase().replace('ROLE_', ''));
    if (normalizedRoles.includes('ADMIN')) {
      this.router.navigate(['/admin/dashboard']);
    } else if (normalizedRoles.includes('USER')) {
      this.router.navigate(['/user/dashboard']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  getPhotoUrl(): string | null {
    const user = this.getUser();
    return user?.photos || (isPlatformBrowser(this.platformId) ? localStorage.getItem(this.PHOTO_URL_KEY) : null);
  }

  private setAuthData(response: AuthenticationResponse): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (response.token) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
    }
    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
    if (response.user) {
      const authoritiesFromToken = this.getRolesFromToken().map((role) => ({
        authority: `ROLE_${role}`
      }));
      const userWithAuthorities: User = {
        ...response.user,
        authorities: response.user?.authorities?.length ? response.user.authorities : authoritiesFromToken
      };
      localStorage.setItem(this.USER_KEY, JSON.stringify(userWithAuthorities));
      this.currentUserSubject.next(userWithAuthorities);
    }
    this.isAuthenticatedSubject.next(true);
  }

  private clearAuthData(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.PHOTO_URL_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/home']);
  }

  private getUserFromStorage(): User | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  private hasValidToken(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return false;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  private getRolesFromToken(): string[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [];
    }
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return [];
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.authorities && Array.isArray(payload.authorities)) {
        return payload.authorities.map((auth: string) => {
          let role = auth;
          if (role.startsWith('ROLE_')) {
            role = role.substring(5);
          }
          return role.toUpperCase();
        });
      }
      return [];
    } catch {
      return [];
    }
  }

  private getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private checkTokenValidity(): void {
    setInterval(() => {
      if (isPlatformBrowser(this.platformId) && !this.hasValidToken() && this.isAuthenticated()) {
        this.logoutOnError();
      }
    }, 60000);
  }

  getCurrentUserValue(): User | null {
  return this.currentUserSubject.getValue();
}


  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.erroMsg) return error.error.erroMsg;
    switch (error.status) {
      case 400: return 'Requête invalide';
      case 401: return 'Email ou mot de passe incorrect';
      case 403: return 'Accès non autorisé';
      case 404: return 'Service non disponible';
      case 415: return 'Type de contenu non supporté. Veuillez vérifier le format des données envoyées.';
      case 409: return 'Cet email est déjà utilisé';
      case 500: return 'Erreur serveur. Veuillez réessayer plus tard';
      default: return 'Une erreur inattendue s\'est produite';
    }
  }
}

interface AuthenticationResponse {
  token?: string;
  refreshToken?: string;
  user?: User;
  userList?: User[];
  message?: string;
  erroMsg?: string;
  totalElements?: number;
  totalPages?: number;
}

interface RegistrationResponse {
  message?: string;
  erroMsg?: string;
}