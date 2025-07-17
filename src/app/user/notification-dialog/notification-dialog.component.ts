import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService, AppNotification } from '../../services/notification.service';
import { forkJoin } from 'rxjs';
import { AuthServiceService } from '../../services/auth/auth-service.service';

@Component({
  selector: 'app-notification-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './notification-dialog.component.html',
  styleUrls: ['./notification-dialog.component.css']
})
export class NotificationDialogComponent {
  notifications: AppNotification[] = [];

  constructor(
    public dialogRef: MatDialogRef<NotificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      message?: string;
      notifications?: AppNotification[];
    },
    private notificationService: NotificationService,
    private authService: AuthServiceService // Injection du service Auth
  ) {
    if (data.notifications) {
      this.notifications = data.notifications;
    }
  }

  markAsRead(): void {
    const unread = this.notifications.filter(n => !n.read);
    if (!unread.length) {
      this.dialogRef.close(false);
      return;
    }

    const markRequests = unread.map(n => this.notificationService.markAsRead(n.id));

    forkJoin(markRequests).subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);

        // ✅ Recalcul du compteur via user.id proprement
        const user = this.authService.getCurrentUserValue();
        if (user?.id) {
          this.notificationService.getNotificationsForUser(user.id).subscribe();
        }

        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Erreur lors du marquage :', err);
        this.dialogRef.close(false);
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
