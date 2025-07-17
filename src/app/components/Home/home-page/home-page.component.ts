import { Component, AfterViewInit, Inject, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { AuthServiceService } from '../../../services/auth/auth-service.service';
import { LoginComponent } from '../../../auth/login/login.component';
import { SigninComponent } from '../../../auth/signin/signin.component';
import { User } from '../../../service/models';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
})
export class HomePageComponent implements AfterViewInit {
  user: User | null = null;
  navbarfixed: boolean = false;
  isAuthenticated: boolean = false;
  private loginModalInstance: any;
  private signupModalInstance: any;

  @HostListener('window:scroll', ['$event'])
  onscroll() {
    this.navbarfixed = window.scrollY > 100;
  }

  constructor(
    public authService: AuthServiceService,
    private router: Router,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.authService.currentUser$.subscribe((user) => {
      this.isAuthenticated = !!user;
      this.user = user;
    });
  }

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
    if (M && M.Sidenav && M.Modal) {
      try {
        const sidenavs = document.querySelectorAll('.sidenav');
        const modals = document.querySelectorAll('.modal');
        M.Sidenav.init(sidenavs, { edge: 'left', draggable: true });
        M.Modal.init(modals, { dismissible: true, opacity: 0.5 });

        const loginModal = document.getElementById('loginModal');
        const signupModal = document.getElementById('signupModal');
        if (loginModal) {
          this.loginModalInstance = M.Modal.getInstance(loginModal);
        }
        if (signupModal) {
          this.signupModalInstance = M.Modal.getInstance(signupModal);
        }
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

  scrollToSection(sectionId: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  startSimulation(): void {
      this.router.navigate(['/user/categorieNon']);
    }
  

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => console.error('Logout failed', err),
    });
  }
}