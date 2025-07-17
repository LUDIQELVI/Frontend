import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthServiceService } from '../../services/auth/auth-service.service';

@Component({
  selector: 'app-user-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-sidebar.component.html',
  styleUrls: ['./user-sidebar.component.css']
})
export class UserSidebarComponent implements AfterViewInit {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private authService: AuthServiceService
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        if (typeof (window as any).M !== 'undefined') {
          const sidenavs = document.querySelectorAll('.sidenav');
          (window as any).M.Sidenav.init(sidenavs, { edge: 'left', draggable: true });
          console.log('Materialize initialisé (Sidenav)');
        } else {
          console.error('Materialize not loaded');
        }
      }, 100);
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId)) {
          const sidenavInstance = (window as any).M.Sidenav.getInstance(document.getElementById('mobile-nav'));
          if (sidenavInstance) {
            sidenavInstance.close();
            console.log('Sidenav closed');
          }
        }
      }
    });
  }
}