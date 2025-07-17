import { Component, OnInit, AfterViewInit, Inject, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthServiceService } from '../../services/auth/auth-service.service';
import { PLATFORM_ID } from '@angular/core';
import { User } from '../../service/models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmOfflineDialogComponent } from '../../user/confirm-offline-dialog/confirm-offline-dialog.component';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.css']
})
export class AdminHeaderComponent implements OnInit, AfterViewInit {
  isAuthenticated = false;
  user: User | null = null;
  userName = 'Administrateur';
  photoUrl = 'https://via.placeholder.com/40';
  sidebarOpen = false; // État sidebar ouvert ou fermé

  constructor(
    private authService: AuthServiceService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isAuthenticated = !!user;
      if (user) {
        this.user = user;
        this.userName = user.firstName || 'Utilisateur';
        this.photoUrl = user.photos || 'https://via.placeholder.com/40';
      }
    });
  }

  ngAfterViewInit(): void {
    // Ici on peut initialiser Materialize si besoin ou autre
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    const sidenav = document.getElementById('mobile-nav');
    if (sidenav) {
      if (this.sidebarOpen) {
        this.renderer.addClass(sidenav, 'open');
      } else {
        this.renderer.removeClass(sidenav, 'open');
      }
    }
  }

  logout(): void {
    const dialogRef = this.dialog.open(ConfirmOfflineDialogComponent , {
      data: {
        title: 'Confirmation',
        message: 'Voulez-vous vraiment vous déconnecter ?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.authService.logout().subscribe({
          next: () => {
            this.router.navigate(['/home']);
          },
          error: () => {
            (window as any).M.toast({ html: 'Erreur lors de la déconnexion', classes: 'red' });
          }
        });
      }
    });
  }
}