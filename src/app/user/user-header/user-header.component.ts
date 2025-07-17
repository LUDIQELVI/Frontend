import { Component, OnInit, AfterViewInit, Inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthServiceService } from '../../services/auth/auth-service.service';
import { NotificationService, AppNotification } from '../../services/notification.service';
import { PLATFORM_ID } from '@angular/core';
import { User } from '../../service/models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmOfflineDialogComponent } from '../confirm-offline-dialog/confirm-offline-dialog.component';
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule],
  templateUrl: './user-header.component.html',
  styleUrls: ['./user-header.component.css']
})
export class UserHeaderComponent implements OnInit, AfterViewInit {
  isAuthenticated = false;
  user: User | null = null;
  userName = 'Utilisateur';
  photoUrl = 'https://via.placeholder.com/40';
  notificationCount = 0;
  sidebarOpen = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthServiceService,
    private notificationService: NotificationService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private dialog: MatDialog,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.isAuthenticated = !!user;
      if (user) {
        this.user = user;
        this.userName = user.firstName || 'Utilisateur';
        this.photoUrl = user.photos || 'https://via.placeholder.com/40';
        this.loadNotifications(user.id);
      }
    });

    this.notificationService.notification$.pipe(takeUntil(this.destroy$)).subscribe(notification => {
      this.showWhatsAppStyleNotification(notification);
      this.loadNotifications(this.user?.id);
    });

    this.notificationService.notificationCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.notificationCount = count;
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNotifications(userId?: number): void {
    if (userId) {
      this.notificationService.getNotificationsForUser(userId).subscribe(notifications => {
        this.notificationService.updateNotificationCount(notifications.filter(n => !n.read).length);
      });
    }
  }

  private showWhatsAppStyleNotification(notification: AppNotification): void {
    const dialogRef = this.dialog.open(NotificationDialogComponent, {
      width: '400px',
      data: { notifications: [notification] },
      autoFocus: false,
      panelClass: 'whatsapp-notification'
    });

    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    setTimeout(() => {
      dialogRef.close();
    }, 5000);
  }

  goToNotifications(): void {
    if (this.isAuthenticated) {
      this.notificationService.getNotificationsForUser(this.user?.id!).subscribe(notifications => {
        const dialogRef = this.dialog.open(NotificationDialogComponent, {
          width: '400px',
          data: { notifications },
          autoFocus: false
        });
      });
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    const sidenav = document.getElementById('mobile-nav');
    if (sidenav) {
      this.sidebarOpen
        ? this.renderer.addClass(sidenav, 'open')
        : this.renderer.removeClass(sidenav, 'open');
    }
  }

  logout(): void {
    const dialogRef = this.dialog.open(ConfirmOfflineDialogComponent, {
      data: { title: 'Confirmation', message: 'Voulez-vous vraiment vous déconnecter ?' }
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