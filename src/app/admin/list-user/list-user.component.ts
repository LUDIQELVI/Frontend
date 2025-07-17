import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import { UserService, ExtendedUser } from '../../services/user.service';
import { AuthServiceService } from '../../services/auth/auth-service.service';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-list-user',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    AdminHeaderComponent
  ],
  templateUrl: './list-user.component.html',
  styleUrls: ['./list-user.component.css']
})
export class ListUserComponent implements OnInit, OnDestroy {
  users: ExtendedUser[] = [];
  userName: string = 'Admin';
  errorMessage: string = '';
  changeLog: string[] = [];
  isLoading: boolean = false;
  displayedColumns: string[] = ['photo', 'name', 'email', 'role', 'status', 'actions'];
  pageIndex: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    public userService: UserService,
    private auth: AuthServiceService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.userName = this.auth.getUser()?.firstName ?? 'Admin';
    this.userService.onUsersUpdate().pipe(takeUntil(this.destroy$)).subscribe(() => {
      console.log('User list update triggered');
      this.loadUsers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.getUsers(this.pageIndex, this.pageSize).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ users, totalElements, totalPages }) => {
        this.users = users.map(user => ({
          ...user,
          roles: user.roles?.length ? user.roles : [{ name: 'USER' }],
          authorities: user.authorities?.length ? user.authorities : [{ authority: 'ROLE_USER' }],
          enabled: user.enabled ?? true
        }));
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.message;
        this.users = [];
        this.isLoading = false;
        console.error('Error loading users:', err);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  toggleUserStatus(user: ExtendedUser): void {
    if (!user?.email) {
      this.errorMessage = 'Utilisateur ou email manquant.';
      console.warn('User object is invalid or missing:', user);
      return;
    }

    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.userService.toggleUserStatus(user.email).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.email === user.email);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], enabled: updatedUser.enabled };
        }
        const log = `Statut de ${user.email} changé à ${updatedUser.enabled ? 'Actif' : 'Inactif'} à ${new Date().toLocaleString()}`;
        this.changeLog.push(log);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.error || err.message || 'Erreur lors du changement de statut';
        this.isLoading = false;
        console.error('Error toggling status:', err);
      }
    });
  }

  updateUserRole(user: ExtendedUser, role: string): void {
    if (!user?.email) {
      this.errorMessage = 'Utilisateur ou email manquant.';
      console.warn('User object is invalid or missing:', user);
      return;
    }

    if (this.isLoading) return;

    if (this.userService.userHasRole(user, role)) {
      this.errorMessage = `L'utilisateur a déjà le rôle ${role}.`;
      console.warn(`User ${user.email} already has role ${role}`);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.userService.updateUserRole(user.email, role).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.email === user.email);
        if (index !== -1) {
          this.users[index] = {
            ...this.users[index],
            roles: [{ name: role }],
            authorities: [{ authority: `ROLE_${role}` }]
          };
        }
        const log = `Rôle de ${user.email} changé à ${role} à ${new Date().toLocaleString()}`;
        this.changeLog.push(log);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.error || err.message || 'Erreur lors de la mise à jour du rôle';
        this.isLoading = false;
        console.error('Error updating role:', err);
      }
    });
  }

  getRoleNames(user: ExtendedUser): string {
    const roleNames = this.userService.getUserRoleNames(user);
    return roleNames[0] || 'Aucun rôle';
  }
}
