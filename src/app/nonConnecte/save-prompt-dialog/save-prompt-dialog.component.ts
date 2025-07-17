import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-save-prompt-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Connexion requise</h2>
    <mat-dialog-content>
      <p>Vous devez vous connecter pour enregistrer votre simulation.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary" (click)="onConnect()">Se connecter</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      margin-top: 8px;
      font-size: 15px;
    }
    mat-dialog-actions {
      margin-top: 16px;
    }
  `]
})
export class SavePromptDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<SavePromptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel(): void {
    this.dialogRef.close(); // rien ne se passe
  }

  onConnect(): void {
    this.dialogRef.close('connect'); // on retourne 'connect' pour déclencher le login
  }
}
