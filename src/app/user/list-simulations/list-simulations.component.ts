import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { SimulationService } from '../../services/simulation/simulation.service';
import { AuthServiceService } from '../../services/auth/auth-service.service';
import { NotificationService, AppNotification } from '../../services/notification.service';
import { CategoryService } from '../../services/category.service';
import { Simulation } from '../../models/simulation.models';
import { CategorieCredit } from '../../models/category';
import { UserHeaderComponent } from '../user-header/user-header.component';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';

@Component({
  selector: 'app-list-simulations',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormsModule,
    UserHeaderComponent
  ],
  templateUrl: './list-simulations.component.html',
  styleUrls: ['./list-simulations.component.css']
})
export class ListSimulationsComponent implements OnInit, OnDestroy {
  simulations: Simulation[] = [];
  filteredSimulations: Simulation[] = [];
  categories: CategorieCredit[] = [];
  displayedColumns: string[] = ['category', 'teg', 'amount', 'actions'];
  isLoading = false;
  errorMessage: string | null = null;
  searchTerm: string = '';
  private destroy$ = new Subject<void>();
  currentUser: any | null = null;
  private notifications: Map<number, AppNotification[]> = new Map();

  constructor(
    private simulationService: SimulationService,
    private authService: AuthServiceService,
    private notificationService: NotificationService,
    private categoryService: CategoryService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        this.currentUser = user;
        if (!user?.id) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
          return;
        }
        this.loadSimulations(user.id);
        this.loadCategories();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la récupération de l\'utilisateur.';
        this.authService.logout();
        this.router.navigate(['/auth/login']);
      }
    });

    this.simulationService.simulationCreated$.pipe(takeUntil(this.destroy$)).subscribe((simulation: Simulation) => {
      this.loadNotificationsForSimulation(simulation.id);
      this.loadSimulations(this.currentUser.id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSimulations(userId: number): void {
    this.isLoading = true;
    this.simulationService.getUserSimulations(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (simulations) => {
        this.simulations = simulations;
        this.filteredSimulations = [...simulations];
        this.isLoading = false;
        simulations.forEach(sim => this.loadNotificationsForSimulation(sim.id));
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des simulations.';
        this.isLoading = false;
      }
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().pipe(takeUntil(this.destroy$)).subscribe({
      next: (categories) => (this.categories = categories),
      error: (err: HttpErrorResponse) => console.error(err)
    });
  }

  private loadNotificationsForSimulation(simulationId: number): void {
    this.notificationService.getNotificationsForSimulation(simulationId).subscribe({
      next: (notifications) => {
        this.notifications.set(simulationId, notifications);
        this.updateNotificationCount();
      }
    });
  }

  private updateNotificationCount(): void {
    let unreadCount = 0;
    this.notifications.forEach(notifs => {
      unreadCount += notifs.filter(n => n.alerte && !n.read).length;
    });
    this.notificationService['notificationCountSubject'].next(unreadCount);
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    if (!term.trim()) {
      this.filteredSimulations = [...this.simulations];
    } else {
      const lower = term.toLowerCase();
      this.filteredSimulations = this.simulations.filter(sim => {
        const cat = sim.categorieCredit?.nomCategorie?.toLowerCase() ?? '';
        return (
          cat.includes(lower) ||
          sim.montant?.toString().includes(lower) ||
          sim.teg?.toString().includes(lower)
        );
      });
    }
  }

  getCategoryName(categoryId: number | undefined): string {
    const cat = this.categories.find(c => c.id === categoryId);
    return cat?.nomCategorie || 'Inconnu';
  }

  editSimulation(sim: Simulation): void {
    this.router.navigate(['/user/edit-simulation'], {
      queryParams: {
        simulationId: sim.id
      }
    });
  }

  addSimulation(): void {
    this.router.navigate(['/user/categorie']);
  }

  openDeleteDialog(simulationId: number): void {
    const ref = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: { simulationId }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.deleteSimulation(simulationId);
    });
  }

  private deleteSimulation(simulationId: number): void {
    this.isLoading = true;
    this.simulationService.deleteSimulation(simulationId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.simulations = this.simulations.filter(s => s.id !== simulationId);
        this.filteredSimulations = [...this.simulations];
        this.notifications.delete(simulationId);
        this.updateNotificationCount();
        this.isLoading = false;
        this.showNotification('Simulation supprimée avec succès.');
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression.';
        this.isLoading = false;
      }
    });
  }

  showNotification(message: string): void {
    this.dialog.open(NotificationDialogComponent, {
      width: '400px',
      data: { message }
    });
  }

  showSimulationNotification(simulationId: number): void {
    const notifications = this.notifications.get(simulationId) || [];
    const notif = notifications[0] || {
      id: 'temp',
      dateNotification: new Date().toISOString(),
      simulation: { id: simulationId },
      message: 'Aucune notification disponible.'
    };
    this.dialog.open(NotificationDialogComponent, { width: '400px', data: notif });
  }
}