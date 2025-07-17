import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-success-dialog',
  template: `
    <div class="p-6 text-center">
      <h3 class="text-xl font-semibold text-green-600 mb-4">Succès</h3>
      <p class="text-gray-600">{{ data.message }}</p>
      <button (click)="dialogRef.close()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
        Fermer
      </button>
    </div>
  `,
  styles: [
    `
      :host {
  display: block;
  max-width: 400px;
  width: 90%;
  margin: 1.5rem auto;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  font-family: 'Roboto', 'Arial', sans-serif;
  color: #333333;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

:host:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.15);
}

h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2e7d32; /* Deeper green for professionalism */
  margin-bottom: 1.5rem;
  line-height: 1.3;
}

p {
  font-size: 1rem;
  color: #555555;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

button {
  background-color: #1976d2; /* Professional blue */
  color: #ffffff;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

button:hover {
  background-color: #1565c0; /* Darker blue on hover */
  transform: translateY(-1px);
}

button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.3);
}
    `
  ]
})
export class SuccessDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}
}