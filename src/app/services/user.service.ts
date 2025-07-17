import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserManagementService, ActivateUserPayload } from './user-management.service';

export interface Role {
  name: string;
}

export interface GrantedAuthority {
  authority?: string;
}

export interface User {
  id?: number;
  firstName?: string;
  email?: string;
  telephone?: string;
  dateNaiss?: string;
  photos?: string;
  password?: string;
  enabled?: boolean;
  accountLocked?: boolean;
  roles?: Role[];
  authorities?: GrantedAuthority[];
  username?: string;
}

export interface AuthenticationResponse {
  token?: string;
  refreshToken?: string;
  user?: User;
  userList?: User[];
  message?: string;
  erroMsg?: string;
  totalElements?: number;
  totalPages?: number;
}

export interface ExtendedUser extends User {
  roles?: Role[];
  telephone?: string;
}

export interface RegistrationRequest {
  email: string;
}

export interface RoleUpdateRequest {
  request: RegistrationRequest;
  roleName: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'https://backendsimteg-production.up.railway.app/auth';
  private usersUpdated$ = new BehaviorSubject<void>(undefined); // Trigger for user list refresh

  constructor(
    private http: HttpClient,
    private userManagementService: UserManagementService
  ) {}

  // Emit to trigger user list refresh
  triggerUsersUpdate(): void {
    this.usersUpdated$.next();
  }

  // Observe user list updates
  onUsersUpdate(): Observable<void> {
    return this.usersUpdated$.asObservable();
  }

  getUsers(page: number = 0, size: number = 10): Observable<{ users: ExtendedUser[], totalElements: number, totalPages: number }> {
    return this.http.get<AuthenticationResponse>(`${this.baseUrl}/admin/getAllUsers?page=${page}&size=${size}`).pipe(
      map(res => ({
        users: res.userList?.map(u => this.mapToExtendedUser(u)) || [],
        totalElements: res.totalElements || 0,
        totalPages: res.totalPages || 0
      })),
      catchError(err => throwError(() => new Error(this.getErrorMessage(err, 'Erreur lors du chargement des utilisateurs'))))
    );
  }

  getUserById(userId: number): Observable<ExtendedUser | null> {
    return this.getUsers().pipe(
      map(result => result.users.find(u => u.id === userId) || null),
      catchError(err => throwError(() => new Error(this.getErrorMessage(err, 'Erreur de récupération utilisateur'))))
    );
  }

  toggleUserStatus(email: string): Observable<ExtendedUser> {
    const payload: ActivateUserPayload = { email };
    return this.userManagementService.activateUser(payload).pipe(
      switchMap(() => this.getCurrentUserByEmail(email)),
      map(updatedUser => {
        if (!updatedUser) {
          throw new Error('Utilisateur non trouvé après mise à jour du statut');
        }
        this.triggerUsersUpdate(); // Trigger refresh after status change
        return updatedUser;
      }),
      catchError(err => throwError(() => new Error(this.getErrorMessage(err, 'Erreur de mise à jour du statut'))))
    );
  }

  updateUserRole(email: string, roleName: string): Observable<ExtendedUser> {
    const payload: RoleUpdateRequest = {
      request: { email },
      roleName
    };
    return this.userManagementService.updateUserRole(payload).pipe(
      switchMap((response: { message?: string; error?: string }) => {
        if (response.message) {
          return this.getCurrentUserByEmail(email).pipe(
            map(updatedUser => {
              if (!updatedUser) {
                throw new Error('Utilisateur non trouvé après mise à jour du rôle');
              }
              updatedUser.roles = [{ name: roleName }];
              updatedUser.authorities = [{ authority: `ROLE_${roleName}` }];
              this.triggerUsersUpdate(); // Trigger refresh after role change
              return updatedUser;
            })
          );
        }
        throw new Error(response.error || 'Échec de la mise à jour du rôle');
      }),
      catchError(err => throwError(() => new Error(this.getErrorMessage(err, 'Erreur de mise à jour du rôle'))))
    );
  }

  getCurrentUser(): Observable<ExtendedUser | null> {
    return this.http.get<User>(`${this.baseUrl}/me`).pipe(
      map(user => this.mapToExtendedUser(user)),
      catchError(err => throwError(() => new Error(this.getErrorMessage(err, 'Erreur récupération utilisateur courant'))))
    );
  }

 getCurrentUserByEmail(email: string): Observable<ExtendedUser | null> {
  return this.http.get<User>(`${this.baseUrl}/getUserByEmail/${email}`).pipe(
    map(user => this.mapToExtendedUser(user)),
    catchError(err => throwError(() => new Error(this.getErrorMessage(err, 'Erreur récupération utilisateur'))))
  );
}


  private mapToExtendedUser(user: User): ExtendedUser {
    const roles = user.authorities?.map(a => ({ name: a.authority?.replace('ROLE_', '') || 'UNKNOWN' })) || [];
    return { ...user, roles };
  }

  private getErrorMessage(error: HttpErrorResponse, fallback: string): string {
    if (error.error?.message) return error.error.message;
    switch (error.status) {
      case 401: return 'Non autorisé. Veuillez vous reconnecter';
      case 403: return 'Accès interdit';
      case 404: return 'Non trouvé';
      case 409: return 'Conflit de données';
      case 500: return 'Erreur serveur';
      case 0: return 'Serveur injoignable';
      default: return fallback;
    }
  }

  userHasRole(user: ExtendedUser, roleName: string): boolean {
    return (
      user.roles?.some(r => r.name?.toUpperCase() === roleName.toUpperCase()) ||
      user.authorities?.some(a => a.authority?.toUpperCase() === roleName.toUpperCase()) ||
      false
    );
  }

  getUserRoleNames(user: ExtendedUser): string[] {
    const roleNames = new Set<string>();
    if (user.roles) user.roles.forEach(role => role.name && roleNames.add(role.name));
    if (user.authorities) user.authorities.forEach(auth => auth.authority && roleNames.add(auth.authority.replace('ROLE_', '')));
    return Array.from(roleNames);
  }
}