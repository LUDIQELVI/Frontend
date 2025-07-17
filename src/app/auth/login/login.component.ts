import { Component, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthServiceService } from '../../services/auth/auth-service.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SigninComponent } from '../signin/signin.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  submitting: boolean = false;

  constructor(
    private authService: AuthServiceService,
    private router: Router,
    private dialog: MatDialog,
    @Optional() private dialogRef?: MatDialogRef<LoginComponent>
  ) {}

  onSubmit(form: NgForm): void {
    if (this.submitting || !form.valid) return;
    this.submitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.successMessage = response.message;

        setTimeout(() => {
          const roles = this.authService.getRoles();

          // ✅ Fermer proprement le dialog avant redirection
          if (this.dialogRef) {
            this.dialogRef.close();
          }

          this.authService.redirectByRole(roles);
          this.submitting = false;
        }, 100);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Erreur lors de la connexion.';
        this.submitting = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  openSignupModal(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }

    this.dialog.open(SigninComponent, {
      width: '500px',
      maxWidth: '90%',
      disableClose: true
    });
  }
}
