import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserHeaderComponent } from '../user-header/user-header.component';
import { AuthServiceService } from '../../services/auth/auth-service.service';
import { User } from '../../models/user.models';
import { SimulationService } from '../../services/simulation/simulation.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, RouterModule, UserHeaderComponent],
  templateUrl: './dashboard-user.component.html',
  styleUrls: ['./dashboard-user.component.css']
})
export class DashboardUserComponent implements AfterViewInit {
  userName: string = 'Utilisateur';
  user: User | null = null;
  isAuthenticated: boolean = false;
  totalSimulations: number = 0;
  recentActivity: string[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private router: Router,
    private authService: AuthServiceService,
    private simulationService: SimulationService
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.user = user;
      this.userName = user?.firstName || user?.email || 'Utilisateur';

      if (user?.id) {
        this.simulationService.getUserSimulations(user.id).subscribe(simulations => {
          this.totalSimulations = simulations.length;
          this.recentActivity = simulations
            .slice(-3)
            .map(sim => `Simulation #${sim.id} créée`);
        }, err => {
          console.error('Erreur lors du chargement des simulations :', err);
        });
      }
    });
  }

  ngAfterViewInit(): void {
    // Si tu veux garder un tooltip Angular Material, tu n'as rien à faire ici.
    // Supprime le code Materialize JS pour éviter les erreurs.
  }

  navigateTo(route: string): void {
    this.router.navigate([`/user/${route}`]);
  }
}
