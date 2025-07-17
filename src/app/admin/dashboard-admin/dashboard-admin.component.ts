import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthServiceService } from '../../services/auth/auth-service.service';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap, takeUntil } from 'rxjs/operators';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { User, ExtendedUser } from '../../services/user.service';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { CategoryService } from '../../services/category.service';
import { UserService } from '../../services/user.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule,
    AdminHeaderComponent,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  user: User | null = null;
  userName: string = 'Administrateur';
  roleNames: string = '';
  users: ExtendedUser[] = [];
  errorMessage: string = '';
  categoryCount: number = 0;
  isLoading: boolean = false;
  pageIndex: number = 0;
  pageSize: number = 20; // Increased to fetch all users
  totalElements: number = 0;
  totalPages: number = 0;
  displayedColumns: string[] = ['photo', 'name', 'email', 'role', 'status'];
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthServiceService,
    private http: HttpClient,
    private router: Router,
    private categoryService: CategoryService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    if (this.user) {
      this.userName = this.user.firstName || 'Administrateur';
      this.roleNames =
        this.user.authorities
          ?.filter(auth => auth.authority)
          .map(auth => auth.authority!.replace('ROLE_', '').toUpperCase())
          .join(', ') ||
        this.user.roles?.map((role: { name: string }) => role.name).join(', ') ||
        'No roles';
    }
    this.loadUsers();
    this.loadCategoryCount();
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
    this.userService.getUsers(this.pageIndex, this.pageSize).pipe(
      tap(({ users, totalElements, totalPages }) => {
        console.log('Loaded users:', users, 'Total:', totalElements);
        this.users = users.map(user => ({
          ...user,
          roles: user.roles?.length ? user.roles : [{ name: 'USER' }],
          authorities: user.authorities?.length ? user.authorities : [{ authority: 'ROLE_USER' }],
          enabled: user.enabled ?? true
        }));
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.isLoading = false;
      }),
      catchError((err: HttpErrorResponse) => {
        this.errorMessage = 'Erreur lors du chargement des utilisateurs : ' + err.message;
        this.users = [];
        this.isLoading = false;
        console.error('Error loading users:', err);
        return throwError(() => err);
      })
    ).subscribe();
  }

  loadCategoryCount(): void {
    this.categoryService.getCategories().pipe(
      tap(categories => {
        this.categoryCount = categories.length;
      }),
      catchError((err: HttpErrorResponse) => {
        this.errorMessage = 'Erreur lors du chargement des catégories : ' + err.message;
        return throwError(() => err);
      })
    ).subscribe();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  selectCard(event: Event, path: string): void {
    event.preventDefault();
    this.router.navigate([path]);
  }

  getRoleNames(user: ExtendedUser): string {
    const roleNames = this.userService.getUserRoleNames(user);
    return roleNames[0] || 'Aucun rôle';
  }
}