import {
  Component,
  OnInit,
  AfterViewInit,
  HostListener,
  Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AuthServiceService } from '../../services/auth/auth-service.service';
import { SimulationService } from '../../services/simulation/simulation.service';
import { User } from '../../models/user.models';
import { Simulation } from '../../models/simulation.models';
import { ConfirmOfflineDialogComponent } from '../../user/confirm-offline-dialog/confirm-offline-dialog.component';

@Component({
  selector: 'app-home-connectee',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule],
  templateUrl: './home-connectee.component.html',
  styleUrls: ['./home-connectee.component.css']
})
export class HomeConnecteeComponent implements OnInit, AfterViewInit {
  user: User | null = null;
  navbarfixed = false;
  isAuthenticated = false;
  recentSimulations: Simulation[] = [];

  @HostListener('window:scroll', ['$event'])
  onscroll() {
    this.navbarfixed = window.scrollY > 100;
  }

  constructor(
    public authService: AuthServiceService,
    private simulationService: SimulationService,
    private router: Router,
    public dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      this.user = user;

      if (!this.isAuthenticated) {
        this.router.navigate(['/home']);
      } else if (this.user?.id != null) {
        this.simulationService.getUserSimulations(this.user.id).subscribe({
          next: sims => this.recentSimulations = sims.slice(-3).reverse(),
          error: err => console.error('Erreur chargement simulations :', err)
        });
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initMaterialize(), 0);
    }
  }

  private initMaterialize(): void {
    const M = (window as any).M;
    if (M?.Sidenav && M?.Dropdown && M?.Modal) {
      M.Sidenav.init(document.querySelectorAll('.sidenav'), { edge: 'left', draggable: true });
      M.Dropdown.init(document.querySelectorAll('.dropdown-trigger'), {
        alignment: 'right',
        coverTrigger: false,
        closeOnClick: true
      });
      M.Modal.init(document.querySelectorAll('.modal'));
    }
  }

  startSimulation(): void {
    this.router.navigate(['/user/categorie']);
  }

  viewSimulations(): void {
    this.router.navigate(['/user/list-simulations']);
  }

  logout(): void {
    const dialogRef = this.dialog.open(ConfirmOfflineDialogComponent, {
      data: {
        title: 'Confirmation',
        message: 'Voulez-vous vraiment vous déconnecter ?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.authService.logout().subscribe({
          next: () => this.router.navigate(['/home']),
          error: () => {
            (window as any).M.toast({ html: 'Erreur lors de la déconnexion', classes: 'red' });
          }
        });
      }
    });
  }
}
