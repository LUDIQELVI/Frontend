import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthServiceService } from '../../services/auth/auth-service.service';
import { Router } from '@angular/router';
import { RegisterRequest } from '../../models/user.models';
import { PLATFORM_ID } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { SuccessDialogComponent } from '../success-dialog-component/success-dialog-component.component';

interface FieldErrors {
  firstName?: string;
  email?: string;
  telephone?: string;
  dateNaiss?: string;
  password?: string;
}

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  @Output() closeModal = new EventEmitter<void>();
  firstName: string = '';
  email: string = '';
  telephone: string = '+237';
  dateNaiss: string = '';
  password: string = '';
  selectedPhoto: File | undefined = undefined;

  showPassword: boolean = false;
  submitting: boolean = false;
  photoUrl: string | null = null;
  fieldErrors: FieldErrors = {};
  errorMessage: string | null = null;

  constructor(
    private authService: AuthServiceService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<SigninComponent>,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.photoUrl = this.authService.getPhotoUrl();
  }

  ngOnInit(): void {
    this.telephone = '+237';
  }

  validateField(field: keyof FieldErrors): void {
    this.fieldErrors[field] = '';
    switch (field) {
      case 'firstName':
        if (!this.firstName || this.firstName.trim().length < 2) {
          this.fieldErrors[field] = 'Le prénom doit contenir au moins 2 caractères.';
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this.email || !emailRegex.test(this.email)) {
          this.fieldErrors[field] = 'Veuillez entrer un email valide.';
        }
        break;
      case 'telephone':
        const phoneRegex = /^\+237\d{9}$/;
        if (!this.telephone || !phoneRegex.test(this.telephone)) {
          this.fieldErrors[field] = 'Le numéro doit commencer par +237 suivi de 9 chiffres.';
        }
        break;
      case 'dateNaiss':
        if (!this.dateNaiss) {
          this.fieldErrors[field] = 'La date de naissance est requise.';
        } else {
          const birthDate = new Date(this.dateNaiss);
          const today = new Date();
          if (birthDate >= today) {
            this.fieldErrors[field] = 'La date de naissance doit être dans le passé.';
          }
        }
        break;
      case 'password':
        if (!this.password || this.password.length < 6) {
          this.fieldErrors[field] = 'Le mot de passe doit contenir au moins 6 caractères.';
        }
        break;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedPhoto = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoUrl = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedPhoto);
    } else {
      this.selectedPhoto = undefined;
      this.photoUrl = null;
      this.cdr.detectChanges();
    }
  }


onSubmit(): void {
  this.submitting = true;
  this.errorMessage = null;

  // Validate all fields
  ['firstName', 'email', 'telephone', 'dateNaiss', 'password'].forEach(field =>
    this.validateField(field as keyof FieldErrors)
  );

  if (Object.values(this.fieldErrors).some(error => error)) {
    this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
    this.submitting = false;
    return;
  }

  // Log selected photo for debugging
  if (!this.selectedPhoto) {
    console.warn('No photo selected');
  } else {
    console.log('Selected photo:', this.selectedPhoto.name, this.selectedPhoto.size);
  }

  const request: RegisterRequest = {
    firstName: this.firstName,
    email: this.email,
    telephone: this.telephone,
    dateNaiss: this.dateNaiss,
    password: this.password
  };

  this.authService.register(request, this.selectedPhoto).subscribe({
    next: (response) => {
      console.log('Registration response:', response);
      this.submitting = false;
      this.dialog.open(SuccessDialogComponent, {
        width: '300px',
        data: { message: 'Inscription réussie !' }
      });
      setTimeout(() => {
        this.dialogRef.close();
        this.closeModal.emit();
        this.cdr.detectChanges();
      }, 3000);
    },
    error: (err) => {
      console.error('Registration error:', err);
      this.submitting = false;
      this.errorMessage = err.message || 'Erreur lors de l\'inscription. Veuillez réessayer.';
      this.cdr.detectChanges();
    }
  });
}
  openLoginModal(): void {
    this.dialogRef.close();
    this.closeModal.emit();
    if (isPlatformBrowser(this.platformId)) {
      try {
        this.dialog.open(LoginComponent, {
          width: '400px',
          panelClass: 'custom-modal'
        });
      } catch (error) {
        console.error('Error opening login dialog:', error);
      }
    }
  }
}