import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-save-prompt-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './save-prompt-dialog.component.html',
  styleUrls: ['./save-prompt-dialog.component.css']
})
export class SavePromptDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SavePromptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}
}