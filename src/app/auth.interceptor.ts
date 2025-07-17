// src/app/auth.interceptor.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthServiceService } from './services/auth/auth-service.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly noAuthHeader = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh-token',
    '/api/categorieCredit/list',
    '/api/categorieCredit/recuperer',
    '/api/categorieCredit/listDesChamp',
    '/api/tauxUsure/listeParCategorie',
    '/api/tauxUsure/listeTaux',
    '/api/simulation/calculer',
  ];

  private refreshInProgress = false;
  private refreshToken$ = new BehaviorSubject<string | null>(null);

  constructor(
    private auth: AuthServiceService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const skipAuth = this.noAuthHeader.some(path => req.url.includes(path));
    let authReq = req;

    // Always set Accept header to application/json
    if (!req.headers.has('Accept')) {
      authReq = authReq.clone({
        headers: authReq.headers.set('Accept', 'application/json')
      });
    }

    if (!skipAuth && isPlatformBrowser(this.platformId)) {
      const authHeaders = this.auth.getAuthHeaders();
      const authHeader = authHeaders.get('Authorization');
      if (authHeader) {
        authReq = authReq.clone({
          headers: authReq.headers.set('Authorization', authHeader)
        });
      }
    }

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !skipAuth && isPlatformBrowser(this.platformId)) {
          return this.handleAuthError(authReq, next);
        }
        if (err.status === 403) {
          console.error('AuthInterceptor: Forbidden access - Vérifiez les permissions ou token.');
          // Optionnel: redirection, message utilisateur, etc.
        }
        const errorMessage = err.error?.erroMsg || err.message || 'Erreur serveur inconnue';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  private handleAuthError(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.refreshInProgress) {
      this.refreshInProgress = true;
      this.refreshToken$.next(null);

      return this.auth.refreshToken().pipe(
        switchMap(({ accessToken }) => {
          this.refreshInProgress = false;
          this.refreshToken$.next(accessToken);
          const newReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${accessToken}`)
          });
          return next.handle(newReq);
        }),
        catchError(err => {
          this.refreshInProgress = false;
          this.auth.logoutOnError();
          this.router.navigate(['/home']);
          return throwError(() => new Error(err.message || 'Échec du rafraîchissement du token'));
        })
      );
    } else {
      return this.refreshToken$.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          const newReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token!}`)
          });
          return next.handle(newReq);
        })
      );
    }
  }
}

export const AUTH_INTERCEPTOR_PROVIDER = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptor,
  multi: true
};
