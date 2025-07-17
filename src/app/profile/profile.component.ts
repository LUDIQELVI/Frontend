import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthServiceService } from '../services/auth/auth-service.service';
import { UserService } from '../services/user.service';
import { UserHeaderComponent } from '../user/user-header/user-header.component';
import { MessageDialogComponent } from '../user/message-dialog/message-dialog.component';
import { ExtendedUser } from '../services/user.service';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    UserHeaderComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: ExtendedUser | null = null;
  loading = false;

  constructor(
    public userService: UserService,
    private authService: AuthServiceService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.userService.getCurrentUser().subscribe({
      next: user => {
        this.user = user;
        if (!this.user) {
          console.error('Utilisateur connecté non trouvé');
        }
        this.loading = false;
      },
      error: err => {
        console.error('Erreur récupération utilisateur connecté:', err);
        this.loading = false;
      }
    });
  }

  logout(): void {
    const dialogRef = this.dialog.open(MessageDialogComponent, {
      width: '90vw',
      maxWidth: '400px',
      data: { message: 'Voulez-vous vraiment vous déconnecter ?', isError: false, isConfirmation: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authService.logout().subscribe(() => {
          this.router.navigate(['/auth/login']);
        });
      }
    });
  }


}
