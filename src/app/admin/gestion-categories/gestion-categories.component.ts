import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { TauxUsureService } from '../../services/taux-usure.service';
import { TauxUsure, TauxUsureDto, TypeEprunteur } from '../../models/taux-usure';
import { CategorieCredit as ImportedCategorieCredit } from '../../models/category';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { HttpErrorResponse } from '@angular/common/http';

// Interface locale pour le composant uniquement
interface LocalCategorieCredit {
  id?: number;
  nomCategorie: string;
  description: string;
  fraisObligatoire: string[];
  assurances: string[];
}

@Component({
  selector: 'app-categorie-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Modifier la catégorie' : 'Créer une catégorie' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nom de la catégorie</mat-label>
        <input matInput [(ngModel)]="category.nomCategorie" required>
        <mat-error *ngIf="!category.nomCategorie">Le nom est requis</mat-error>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea matInput [(ngModel)]="category.description" rows="4"></textarea>
      </mat-form-field>

      <!-- Frais Obligatoires -->
      <h3>Frais Obligatoires</h3>
      <div *ngFor="let frais of fraisObligatoire; let i = index" class="frais-item">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom du frais</mat-label>
          <input matInput [(ngModel)]="fraisObligatoire[i]" required>
          <mat-error *ngIf="!fraisObligatoire[i]">Le nom est requis</mat-error>
        </mat-form-field>
        <button mat-icon-button color="warn" (click)="removeFrais(i)" matTooltip="Supprimer le frais">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
      <button mat-button (click)="addFrais()">Ajouter un frais</button>

      <!-- Assurances -->
      <h3>Assurances</h3>
      <div *ngFor="let assurance of assurances; let i = index" class="assurance-item">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom de l'assurance</mat-label>
          <input matInput [(ngModel)]="assurances[i]" required>
          <mat-error *ngIf="!assurances[i]">Le nom est requis</mat-error>
        </mat-form-field>
        <button mat-icon-button color="warn" (click)="removeAssurance(i)" matTooltip="Supprimer l'assurance">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
      <button mat-button (click)="addAssurance()">Ajouter une assurance</button>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Annuler</button>
      <button mat-raised-button color="primary" (click)="saveCategory()" 
              [disabled]="!isValidCategory()">Enregistrer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 16px; }
    .frais-item, .assurance-item { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      margin-bottom: 12px; 
    }
    h3 { margin: 20px 0 10px; font-size: 18px; font-weight: 500; }
    button[mat-button] { margin-top: 12px; }
    mat-error { font-size: 12px; color: #d32f2f; }
  `]
})
export class CategorieDialogComponent {
  category: LocalCategorieCredit;
  fraisObligatoire: string[] = [];
  assurances: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<CategorieDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { category: LocalCategorieCredit; isEdit: boolean }
  ) {
    this.category = {
      id: data.category.id,
      nomCategorie: data.category.nomCategorie || '',
      description: data.category.description || '',
      fraisObligatoire: [],
      assurances: []
    };
    this.fraisObligatoire = [...(data.category.fraisObligatoire || [])];
    this.assurances = [...(data.category.assurances || [])];
  }

  addFrais(): void {
    this.fraisObligatoire.push('');
  }

  removeFrais(index: number): void {
    this.fraisObligatoire.splice(index, 1);
  }

  addAssurance(): void {
    this.assurances.push('');
  }

  removeAssurance(index: number): void {
    this.assurances.splice(index, 1);
  }

  isValidCategory(): boolean {
    return !!this.category.nomCategorie &&
           this.fraisObligatoire.every(f => !!f.trim()) &&
           this.assurances.every(a => !!a.trim());
  }

  saveCategory(): void {
    this.category.fraisObligatoire = this.fraisObligatoire.filter(f => !!f.trim());
    this.category.assurances = this.assurances.filter(a => !!a.trim());
    this.dialogRef.close(this.category);
  }
}

@Component({
  selector: 'app-taux-usure-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ getTitreDialog() }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Type d'emprunteur</mat-label>
        <mat-select [(ngModel)]="tauxUsure.typeEprunteur" name="typeEprunteur" required (ngModelChange)="onTypeEprunteurChange()">
          <mat-option *ngFor="let type of typeEprunteurOptions" [value]="type.key">
            {{ type.value }}
          </mat-option>
        </mat-select>
        <mat-error *ngIf="!tauxUsure.typeEprunteur">Le type est requis</mat-error>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Taux (%)</mat-label>
        <input matInput type="number" [(ngModel)]="tauxUsure.tauxUsure" required min="0" step="0.01" (ngModelChange)="onTauxChange()">
        <mat-error *ngIf="tauxUsure.tauxUsure == null || tauxUsure.tauxUsure < 0">Le taux doit être un nombre positif</mat-error>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Seuil (FCFA)</mat-label>
        <input matInput type="number" [(ngModel)]="tauxUsure.seuil" required min="0" (ngModelChange)="onSeuilChange()">
        <mat-error *ngIf="tauxUsure.seuil == null || tauxUsure.seuil < 0">Le seuil doit être un nombre positif</mat-error>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Année</mat-label>
        <input matInput type="number" [(ngModel)]="tauxUsure.annee" required min="2000" max="2100">
        <mat-error *ngIf="!tauxUsure.annee || tauxUsure.annee < 2000 || tauxUsure.annee > 2100">L'année doit être entre 2000 et 2100</mat-error>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Annuler</button>
      <button mat-raised-button color="primary" (click)="saveTauxUsure()" 
              [disabled]="!isValidTauxUsure()">Enregistrer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 16px; }
    mat-error { font-size: 12px; color: #d32f2f; }
    .mat-dialog-content { padding: 20px; }
    mat-form-field { width: 100%; }
  `]
})
export class TauxUsureDialogComponent {
  tauxUsure: TauxUsureDto;
  typeEprunteurOptions = [
    { key: TypeEprunteur.ADMINISTRATIONS_PUBLIQUES, value: 'Administrations publiques' },
    { key: TypeEprunteur.SOCIETES_NON_FINANCIERES_PUBLIQUES, value: 'Sociétés non financières publiques' },
    { key: TypeEprunteur.GRANDE_ENTREPRISE, value: 'Grande entreprise' },
    { key: TypeEprunteur.PME, value: 'PME' },
    { key: TypeEprunteur.SOCIETES_ASSURANCE, value: 'Sociétés d\'assurance' },
    { key: TypeEprunteur.AUTRES_SOCIETES_FINANCIERES, value: 'Autres sociétés financières' },
    { key: TypeEprunteur.MENAGES, value: 'Ménages (Entreprises individuelles)' },
    { key: TypeEprunteur.INSTITUTIONS_SANS_BUT_LUCRATIF, value: 'Institutions sans but lucratif' },
    { key: TypeEprunteur.PARTICULIER, value: 'Particulier' }
  ];

  constructor(
    public dialogRef: MatDialogRef<TauxUsureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categorieId: number; tauxUsure?: TauxUsure; isEdit: boolean }
  ) {
    this.tauxUsure = this.data.tauxUsure
      ? {
          ...this.data.tauxUsure,
          typeEprunteur: this.data.tauxUsure.typeEmprunteur
            ? TypeEprunteur[this.data.tauxUsure.typeEmprunteur.toUpperCase() as keyof typeof TypeEprunteur] || TypeEprunteur.PARTICULIER
            : TypeEprunteur.PARTICULIER,
          categorieId: this.data.categorieId
        }
      : {
          typeEprunteur: TypeEprunteur.PARTICULIER,
          tauxUsure: undefined,
          seuil: undefined,
          annee: new Date().getFullYear(),
          categorieId: this.data.categorieId
        };
  }

  getTitreDialog(): string {
    return this.data.isEdit ? 'Modifier le taux d\'usure' : 'Ajouter un taux d\'usure';
  }

  isValidTauxUsure(): boolean {
    return !!this.tauxUsure.typeEprunteur &&
           this.tauxUsure.tauxUsure != null && this.tauxUsure.tauxUsure >= 0 &&
           this.tauxUsure.seuil != null && this.tauxUsure.seuil >= 0 &&
           !!this.tauxUsure.annee && this.tauxUsure.annee >= 2000 && this.tauxUsure.annee <= 2100;
  }

  onTypeEprunteurChange(): void {}
  onTauxChange(): void {
    if (this.tauxUsure && (this.tauxUsure.tauxUsure == null || this.tauxUsure.tauxUsure < 0)) {
      this.tauxUsure.tauxUsure = 0;
    }
  }
  onSeuilChange(): void {
    if (this.tauxUsure && (this.tauxUsure.seuil == null || this.tauxUsure.seuil < 0)) {
      this.tauxUsure.seuil = 0;
    }
  }

  saveTauxUsure(): void {
    if (this.isValidTauxUsure()) {
      this.dialogRef.close(this.tauxUsure);
    }
  }
}

@Component({
  selector: 'app-gestion-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    FormsModule,
    AdminHeaderComponent,
    MatSelectModule
  ],
  template: `
    <app-admin-header></app-admin-header>
    <div class="main-content">
      <div class="container">
        <h2>Gestion des catégories de crédit</h2>
        <p class="intro-text">Créez ou modifiez des catégories de crédit et leurs taux d'usure.</p>
        <div class="filters">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Filtrer par catégorie</mat-label>
            <mat-select [(ngModel)]="selectedCategoryFilter" (ngModelChange)="filterCategories(); onCategoryPageChange({ pageIndex: 0, pageSize: categoryPageSize, length: filteredCategories.length })">
              <mat-option value="">Toutes</mat-option>
              <mat-option *ngFor="let category of categories" [value]="category.nomCategorie">
                {{ category.nomCategorie }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div *ngIf="isLoading" class="text-center my-8">
          <mat-spinner></mat-spinner>
        </div>
        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <table mat-table [dataSource]="paginatedCategories" class="mat-elevation-z8" *ngIf="!isLoading && filteredCategories.length">
          <ng-container matColumnDef="nom">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let category">{{ category.nomCategorie }}</td>
          </ng-container>
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let category">{{ category.description || 'Aucune description' }}</td>
          </ng-container>
          <ng-container matColumnDef="frais">
            <th mat-header-cell *matHeaderCellDef>Frais</th>
            <td mat-cell *matCellDef="let category">{{ getFraisDisplay(category.fraisObligatoire) }}</td>
          </ng-container>
          <ng-container matColumnDef="assurances">
            <th mat-header-cell *matHeaderCellDef>Assurances</th>
            <td mat-cell *matCellDef="let category">{{ getAssurancesDisplay(category.assurances) }}</td>
          </ng-container>
          <ng-container matColumnDef="tauxUsure">
            <th mat-header-cell *matHeaderCellDef>Taux d'usure</th>
            <td mat-cell *matCellDef="let category">
              <div *ngIf="category.id !== undefined && tauxUsures[category.id]?.length">
                <table mat-table [dataSource]="getDisplayedTauxUsures(category.id)" class="mat-elevation-z2 inner-table">
                  <ng-container matColumnDef="typeEmprunteur">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let taux">{{ getTypeEmprunteurLabel(taux.typeEmprunteur) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="tauxUsure">
                    <th mat-header-cell *matHeaderCellDef>Taux (%)</th>
                    <td mat-cell *matCellDef="let taux">{{ taux.tauxUsure | number:'1.2-2' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="seuil">
                    <th mat-header-cell *matHeaderCellDef>Seuil (FCFA)</th>
                    <td mat-cell *matCellDef="let taux">{{ taux.seuil }}</td>
                  </ng-container>
                  <ng-container matColumnDef="annee">
                    <th mat-header-cell *matHeaderCellDef>Année</th>
                    <td mat-cell *matCellDef="let taux">{{ taux.annee }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let taux">
                      <button mat-icon-button color="primary" (click)="openEditTauxUsureDialog(taux, category.id!)" matTooltip="Modifier">
                        <mat-icon>edit</mat-icon>
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="tauxDisplayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: tauxDisplayedColumns;"></tr>
                </table>
                <mat-paginator
                  [length]="tauxUsures[category.id].length"
                  [pageSize]="tauxPageSize"
                  [pageIndex]="tauxPageIndex"
                  [pageSizeOptions]="[3]"
                  (page)="onTauxPageChange($event, category.id)"
                  showFirstLastButtons
                ></mat-paginator>
              </div>
              <span *ngIf="category.id === undefined || !tauxUsures[category.id]?.length">Aucun</span>
              <button mat-raised-button color="primary" (click)="category.id !== undefined && openTauxUsureDialog(category.id)" class="add-rate-btn" matTooltip="Ajouter un taux d'usure">
                <mat-icon>add</mat-icon> Ajouter taux
              </button>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let category">
              <button mat-icon-button color="primary" (click)="openEditDialog(category)" matTooltip="Modifier">
                <mat-icon>edit</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        <mat-paginator
          [length]="filteredCategories.length"
          [pageSize]="categoryPageSize"
          [pageIndex]="categoryPageIndex"
          [pageSizeOptions]="[5, 10, 25]"
          (page)="onCategoryPageChange($event)"
          showFirstLastButtons
        ></mat-paginator>
        <div *ngIf="!isLoading && !filteredCategories.length" class="no-data">
          Aucune catégorie trouvée. Cliquez sur le bouton "+" pour ajouter une catégorie !
        </div>
      </div>
      <!-- Floating Add Button -->
      <button mat-fab class="add-fab" (click)="openCreateDialog()" matTooltip="Ajouter une catégorie">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styleUrls: ['./gestion-categories.component.css']
})
export class GestionCategoriesComponent implements OnInit, OnDestroy {
  categories: LocalCategorieCredit[] = [];
  filteredCategories: LocalCategorieCredit[] = [];
  paginatedCategories: LocalCategorieCredit[] = [];
  tauxUsures: { [key: number]: TauxUsure[] } = {};
  displayedColumns: string[] = ['nom', 'description', 'frais', 'assurances', 'tauxUsure', 'actions'];
  tauxDisplayedColumns: string[] = ['typeEmprunteur', 'tauxUsure', 'seuil', 'annee', 'actions'];
  tauxPageIndex: number = 0;
  tauxPageSize: number = 3;
  categoryPageIndex: number = 0;
  categoryPageSize: number = 5;
  isLoading = false;
  errorMessage: string = '';
  selectedCategoryFilter: string = '';
  private destroy$ = new Subject<void>();

  // Define typeEprunteurOptions here to use in getTypeEmprunteurLabel
  typeEprunteurOptions = [
    { key: TypeEprunteur.ADMINISTRATIONS_PUBLIQUES, value: 'Administrations publiques' },
    { key: TypeEprunteur.SOCIETES_NON_FINANCIERES_PUBLIQUES, value: 'Sociétés non financières publiques' },
    { key: TypeEprunteur.GRANDE_ENTREPRISE, value: 'Grande entreprise' },
    { key: TypeEprunteur.PME, value: 'PME' },
    { key: TypeEprunteur.SOCIETES_ASSURANCE, value: 'Sociétés d\'assurance' },
    { key: TypeEprunteur.AUTRES_SOCIETES_FINANCIERES, value: 'Autres sociétés financières' },
    { key: TypeEprunteur.MENAGES, value: 'Ménages (Entreprises individuelles)' },
    { key: TypeEprunteur.INSTITUTIONS_SANS_BUT_LUCRATIF, value: 'Institutions sans but lucratif' },
    { key: TypeEprunteur.PARTICULIER, value: 'Particulier' }
  ];

  constructor(
    private categoryService: CategoryService,
    private tauxUsureService: TauxUsureService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.categoryService.getCategories().pipe(takeUntil(this.destroy$)).subscribe({
      next: (categories: ImportedCategorieCredit[]) => {
        this.categories = categories.map(cat => this.convertToLocalCategory(cat));
        this.filteredCategories = [...this.categories];
        this.updatePaginatedCategories();
        this.loadTauxUsures();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || 'Erreur lors du chargement des catégories.';
        this.isLoading = false;
      }
    });
  }

  private convertToLocalCategory(importedCategory: ImportedCategorieCredit): LocalCategorieCredit {
    return {
      id: importedCategory.id,
      nomCategorie: importedCategory.nomCategorie || '',
      description: importedCategory.description || '',
      fraisObligatoire: Array.isArray(importedCategory.fraisObligatoire) 
        ? importedCategory.fraisObligatoire.filter((item): item is string => typeof item === 'string')
        : [],
      assurances: Array.isArray(importedCategory.assurances) 
        ? importedCategory.assurances.filter((item): item is string => typeof item === 'string')
        : []
    };
  }

  private convertToImportedCategory(localCategory: LocalCategorieCredit): ImportedCategorieCredit {
    return {
      id: localCategory.id,
      nomCategorie: localCategory.nomCategorie,
      description: localCategory.description,
      fraisObligatoire: localCategory.fraisObligatoire,
      assurances: localCategory.assurances
    };
  }

  private loadTauxUsures(): void {
    this.categories.forEach(category => {
      if (category.id) {
        this.tauxUsureService.getListeByCategorieId(category.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (tauxUsures) => {
            this.tauxUsures[category.id!] = tauxUsures || [];
          },
          error: (err: HttpErrorResponse) => {
            this.errorMessage = err.error?.message || `Erreur lors du chargement des taux d'usure pour la catégorie ${category.nomCategorie}`;
          }
        });
      }
    });
  }

  filterCategories(): void {
    let filtered = [...this.categories];
    if (this.selectedCategoryFilter) {
      filtered = filtered.filter(category => category.nomCategorie === this.selectedCategoryFilter);
    }
    this.filteredCategories = filtered;
    this.updatePaginatedCategories();
  }

  updatePaginatedCategories(): void {
    const start = this.categoryPageIndex * this.categoryPageSize;
    const end = start + this.categoryPageSize;
    this.paginatedCategories = this.filteredCategories.slice(start, end);
  }

  onCategoryPageChange(event: PageEvent): void {
    this.categoryPageIndex = event.pageIndex;
    this.categoryPageSize = event.pageSize;
    this.updatePaginatedCategories();
  }

  getFraisDisplay(fraisList: string[]): string {
    return fraisList.length ? fraisList.join(', ') : 'Aucun';
  }

  getAssurancesDisplay(assuranceList: string[]): string {
    return assuranceList.length ? assuranceList.join(', ') : 'Aucune';
  }

  getDisplayedTauxUsures(categoryId: number): TauxUsure[] {
    const start = this.tauxPageIndex * this.tauxPageSize;
    const end = start + this.tauxPageSize;
    return this.tauxUsures[categoryId]?.slice(start, end) || [];
  }

  onTauxPageChange(event: PageEvent, categoryId: number): void {
    this.tauxPageIndex = event.pageIndex;
    this.tauxPageSize = event.pageSize;
  }

  getTypeEmprunteurLabel(type: TypeEprunteur): string {
    const option = this.typeEprunteurOptions.find((opt: { key: TypeEprunteur; value: string }) => opt.key === type);
    return option ? option.value : 'Non défini';
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CategorieDialogComponent, {
      width: '500px',
      data: { category: { nomCategorie: '', description: '', fraisObligatoire: [], assurances: [] }, isEdit: false }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.createCategory(result);
    });
  }

  private createCategory(category: LocalCategorieCredit): void {
    this.isLoading = true;
    this.categoryService.createCategory(this.convertToImportedCategory(category)).pipe(takeUntil(this.destroy$)).subscribe({
      next: (newCategory) => {
        this.categories.push(this.convertToLocalCategory(newCategory));
        this.filteredCategories = [...this.categories];
        this.updatePaginatedCategories();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la création de la catégorie.';
        this.isLoading = false;
      }
    });
  }

  openEditDialog(category: LocalCategorieCredit): void {
    const dialogRef = this.dialog.open(CategorieDialogComponent, {
      width: '500px',
      data: { category: { ...category }, isEdit: true }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.updateCategory(result);
    });
  }

  private updateCategory(category: LocalCategorieCredit): void {
    if (!category.id) return;
    this.isLoading = true;
    this.categoryService.updateCategory(category.id, this.convertToImportedCategory(category)).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedCategory) => {
        this.categories = this.categories.map(c => c.id === updatedCategory.id ? this.convertToLocalCategory(updatedCategory) : c);
        this.filteredCategories = [...this.categories];
        this.updatePaginatedCategories();
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour de la catégorie.';
        this.isLoading = false;
      }
    });
  }

  openTauxUsureDialog(categoryId: number): void {
    const dialogRef = this.dialog.open(TauxUsureDialogComponent, {
      width: '500px',
      data: { categorieId: categoryId, isEdit: false }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.createTauxUsure(result);
    });
  }

  openEditTauxUsureDialog(tauxUsure: TauxUsure, categoryId: number): void {
    const dialogRef = this.dialog.open(TauxUsureDialogComponent, {
      width: '500px',
      data: { categorieId: categoryId, tauxUsure, isEdit: true }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) this.updateTauxUsure(result);
    });
  }

  private createTauxUsure(tauxUsure: TauxUsureDto): void {
    this.isLoading = true;
    this.tauxUsureService.creerTauxUsure(tauxUsure).pipe(takeUntil(this.destroy$)).subscribe({
      next: (newTauxUsure) => {
        if (!this.tauxUsures[tauxUsure.categorieId]) this.tauxUsures[tauxUsure.categorieId] = [];
        this.tauxUsures[tauxUsure.categorieId].push(newTauxUsure);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la création du taux d\'usure.';
        this.isLoading = false;
      }
    });
  }

  private updateTauxUsure(tauxUsure: TauxUsureDto): void {
    this.isLoading = true;
    this.tauxUsureService.updateTauxUsure(tauxUsure.id!, tauxUsure).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedTauxUsure) => {
        this.tauxUsures[tauxUsure.categorieId] = this.tauxUsures[tauxUsure.categorieId].map(t => t.id === updatedTauxUsure.id ? updatedTauxUsure : t);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour du taux d\'usure.';
        this.isLoading = false;
      }
    });
  }
}