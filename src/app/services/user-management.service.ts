import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ActivateUserPayload {
  email: string;
}

export interface UpdateUserRolePayload {
  email: string;
  roleName: string;
}

export interface RegistrationRequest {
  email: string;
}

export interface RoleUpdateRequest {
  request: RegistrationRequest;
  roleName: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private baseUrl = 'http://localhost:3331/auth/admin';

  constructor(private http: HttpClient) {}

  activateUser(payload: ActivateUserPayload): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/activate`, payload).pipe(
      catchError(this.handleError)
    );
  }

  updateUserRole(payload: RoleUpdateRequest): Observable<{ message?: string; error?: string }> {
    return this.http.post<{ message?: string; error?: string }>(`${this.baseUrl}/updateRole`, payload).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Erreur inconnue';
    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else {
      switch (error.status) {
        case 401:
          errorMessage = 'Non autorisé. Veuillez vous reconnecter';
          break;
        case 403:
          errorMessage = 'Accès interdit';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 409:
          errorMessage = 'Conflit de données';
          break;
        case 500:
          errorMessage = 'Erreur serveur';
          break;
        case 0:
          errorMessage = 'Serveur injoignable';
          break;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}