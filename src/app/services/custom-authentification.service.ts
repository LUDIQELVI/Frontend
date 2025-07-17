import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthenticationRequest, AuthenticationResponse } from '../service/models';

@Injectable({
  providedIn: 'root'
})
export class CustomAuthenticationService {
  private readonly apiUrl = 'https://backendsimteg-production.up.railway.app/auth/login'; // Ajustez l'URL selon votre configuration

  constructor(private http: HttpClient) {}

  authenticate(authRequest: AuthenticationRequest): Observable<AuthenticationResponse> {
    return this.http
      .post<AuthenticationResponse>(this.apiUrl, authRequest, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Erreur lors de l\'authentification:', error);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.message) return error.error.message;
    switch (error.status) {
      case 401:
        return 'Email ou mot de passe incorrect';
      case 403:
        return 'Accès non autorisé';
      case 404:
        return 'Service non disponible';
      case 500:
        return 'Erreur serveur. Veuillez réessayer plus tard';
      default:
        return 'Une erreur inattendue s\'est produite';
    }
  }
}