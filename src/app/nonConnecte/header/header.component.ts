import { Component, AfterViewInit, HostListener, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoginComponent } from '../../auth/login/login.component';
import { SigninComponent } from '../../auth/signin/signin.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements AfterViewInit {
  navbarFixed: boolean = false;

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.navbarFixed = window.scrollY > 100;
  }

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeMaterializeWithRetry(0, 5);
    }
  }

  private initializeMaterializeWithRetry(attempt: number, maxAttempts: number): void {
    if (attempt >= maxAttempts) {
      console.error(`Failed to initialize Materialize after ${maxAttempts} attempts`);
      return;
    }

    const M = (window as any).M;
    if (M && M.Sidenav) {
      try {
        const sidenavs = document.querySelectorAll('.sidenav');
        M.Sidenav.init(sidenavs, { edge: 'left', draggable: true });
      } catch (error) {
        console.error(`Materialize initialization error on attempt ${attempt + 1}:`, error);
        setTimeout(() => this.initializeMaterializeWithRetry(attempt + 1, maxAttempts), 200);
      }
    } else {
      setTimeout(() => this.initializeMaterializeWithRetry(attempt + 1, maxAttempts), 200);
    }
  }

  openLoginModal(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        this.dialog.open(LoginComponent, {
          width: '400px',
          panelClass: 'custom-modal',
        });
      } catch (error) {
        console.error('Error opening login dialog:', error);
      }
    }
  }

  openSigninModal(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        this.dialog.open(SigninComponent, {
          width: '450px',
          panelClass: 'custom-modal',
        });
      } catch (error) {
        console.error('Error opening signin dialog:', error);
      }
    }
  }

  toggleSidenav() {
    const sidenav = document.querySelector('.sidenav') as HTMLElement;
    sidenav.classList.toggle('open');
  }
}