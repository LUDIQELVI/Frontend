import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';
import { NotificationService, AppNotification } from '../../services/notification.service';
import { AuthServiceService } from '../../services/auth/auth-service.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  currentNotification: AppNotification | null = null;
  private subscription: Subscription = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthServiceService
  ) {}

  ngOnInit() {
    // Suppression de la récupération automatique des notifications
    // Suppression de l'abonnement au flux notification$
  }

  showNextNotification() {
    if (this.notifications.length > 0) {
      this.currentNotification = this.notifications.shift()!;
      setTimeout(() => {
        this.currentNotification = null;
        this.showNextNotification();
      }, 5000);
    }
  }

  closeNotification() {
    if (this.currentNotification) {
      this.notificationService.markAsRead(this.currentNotification.id).subscribe();
      this.currentNotification = null;
      this.showNextNotification();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
