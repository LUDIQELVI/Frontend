import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ValidatorFn, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CategoryService } from '../../services/category.service';
import { SimulationService } from '../../services/simulation/simulation.service';
import { TauxUsureService } from '../../services/taux-usure.service';
import { CategorieCredit } from '../../models/category';
import { TauxUsure } from '../../models/taux-usure';
import { SimulationDtoRequest, Simulation } from '../../models/simulation.models';
import { UserHeaderComponent } from '../user-header/user-header.component';
import { SimulationResultModalComponent } from '../simulation-result-modal/simulation-result-modal.component';
import { NotificationComponent } from '../notification/notification.component'; // Added import
import { NumberFormatDirective } from '../number-format.directive';
@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    UserHeaderComponent,
    NotificationComponent
    //  ,  NumberFormatDirective
  ],
  providers: [DecimalPipe, DatePipe]
})
export class SimulationComponent implements OnInit {
  simulationForm!: FormGroup;
  category: CategorieCredit | null = null;
  tauxUsure: TauxUsure[] = [];
  simulationResult: Simulation | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>; // Changed from fileInput: any
  destroy$ = new Subject<void>();

  frequenceOptions: string[] = ['MENSUELLE', 'TRIMESTRIALITE', 'ANNUELLE'];
 typeEmprunteurOptions: string[] = [
    'ADMINISTRATIONS_PUBLIQUES',
    'SOCIETES_NON_FINANCIERES_PUBLIQUES',
    'GRANDE_ENTREPRISE',
    'PME',
    'SOCIETES_ASSURANCE',
    'AUTRES_SOCIETES_FINANCIERES',
    'MENAGES',
    'INSTITUTIONS_SANS_BUT_LUCRATIF',
    'PARTICULIER'
];

  minDate: Date = new Date();

  constructor(
    private fb: FormBuilder,
    private simService: SimulationService,
    private categoryService: CategoryService,
    private tauxUsureService: TauxUsureService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategoryAndTauxUsure();
  }

  private initForm(): void {
    this.simulationForm = this.fb.group({
      montant: [null, [Validators.required, Validators.min(1)]],
      duree: [null, [Validators.required, Validators.min(1), Validators.max(100)]],
      dateDebut: [null, Validators.required],
      frequence: [null, Validators.required],
      tauxNominal: [null, [Validators.required, Validators.min(0.01)]],
      typeEmprunteur: [null, Validators.required],
      fraisObligatoires: this.fb.array([]),
      assurancesObligatoires: this.fb.array([]),
      deblocages: this.fb.array([
        this.fb.group({
          dateDeblocage: [null, Validators.required],
          montant: [null, [Validators.required, Validators.min(1)]]
        })
      ], { validators: this.deblocageValidator() })
    });

    this.simulationForm.get('typeEmprunteur')?.valueChanges.subscribe(type => {
      this.onTypeEmprunteurChange(type);
    });

    this.simulationForm.get('dateDebut')?.valueChanges.subscribe(() => {
      this.simulationForm.get('deblocages')?.updateValueAndValidity();
    });
  }

  get fraisObligatoires(): FormArray {
    return this.simulationForm.get('fraisObligatoires') as FormArray;
  }

  get assurancesObligatoires(): FormArray {
    return this.simulationForm.get('assurancesObligatoires') as FormArray;
  }

  get deblocages(): FormArray {
    return this.simulationForm.get('deblocages') as FormArray;
  }

  private deblocageValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const deblocages = control.value as any[];
      const dateDebut = this.simulationForm?.get('dateDebut')?.value;
      if (!dateDebut || !deblocages.length) return null;

      const dateDebutTime = new Date(dateDebut).getTime();
      for (const d of deblocages) {
        if (d.dateDeblocage) {
          const dTime = new Date(d.dateDeblocage).getTime();
          if (dTime >= dateDebutTime) {
            return { invalidDeblocageDate: true };
          }
        }
      }
      return null;
    };
  }


  formatNumber(value: number | null): string {
  return value !== null ? this.decimalPipe.transform(value, '1.0-0')?.replace(/\s/g, ' ') || '' : '';
}
  private loadCategoryAndTauxUsure(): void {
    this.isLoading = true;
    const categoryId = +this.route.snapshot.queryParams['categoryId'] || 2;

    forkJoin([
      this.categoryService.getCategoryById(categoryId),
      this.tauxUsureService.getListeByCategorieId(categoryId)
    ]).subscribe({
      next: ([category, tauxUsure]) => {
        this.category = category;
        this.tauxUsure = tauxUsure;
        this.populateMandatoryFields(category);
        this.cdr.detectChanges();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des données.';
        this.isLoading = false;
      }
    });
  }

  private populateMandatoryFields(category: CategorieCredit): void {
    this.fraisObligatoires.clear();
    this.assurancesObligatoires.clear();

    for (const frais of category.fraisObligatoire || []) {
      const nom = typeof frais === 'string' ? frais : frais.nom;
      const montant = typeof frais === 'object' && frais.montant != null ? frais.montant : null;
      this.fraisObligatoires.push(this.fb.group({
        nom: [nom],
        montant: [montant, [Validators.required, Validators.min(0)]]
      }));
    }

    for (const assurance of category.assurances || []) {
      const nom = typeof assurance === 'string' ? assurance : assurance.nom;
      const montant = typeof assurance === 'object' && assurance.montant != null ? assurance.montant : null;
      this.assurancesObligatoires.push(this.fb.group({
        nom: [nom],
        montant: [montant, [Validators.required, Validators.min(0)]]
      }));
    }
  }

  addDeblocage(): void {
    this.deblocages.push(this.fb.group({
      dateDeblocage: [null, Validators.required],
      montant: [null, [Validators.required, Validators.min(1)]]
    }));
  }

  removeDeblocage(index: number): void {
    this.deblocages.removeAt(index);
  }

  onTypeEmprunteurChange(type: string): void {
    const taux = this.tauxUsure.find(tu => tu.typeEmprunteur === type);
    if (taux) {
      this.simulationForm.get('tauxNominal')?.setValue(taux.tauxUsure);
    }
  }

  simulateCredit(): void {
    this.simulationForm.markAllAsTouched();

    if (this.simulationForm.invalid || this.simulationForm.get('deblocages')?.errors?.['invalidDeblocageDate']) {
      this.errorMessage = 'Entrez les bonnes informations dans votre simulateur. La date de déblocage doit être avant la date de première échéance.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const formValue = this.simulationForm.getRawValue();
    const categoryId = +this.route.snapshot.queryParams['categoryId'] || 2;

    let dureeReelle = formValue.duree;
    switch (formValue.frequence?.toUpperCase()) {
      case 'MENSUELLE':
        dureeReelle = formValue.duree / 12;
        break;
      case 'TRIMESTRIALITE':
        dureeReelle = formValue.duree / 4;
        break;
      case 'ANNUELLE':
      default:
        break;
    }

    const request: SimulationDtoRequest = {
      categorieCreditId: categoryId,
      montantEmprunte: formValue.montant,
      duree: dureeReelle,
      datePremiereEcheance: new Date(formValue.dateDebut).toISOString().split('T')[0],
      frequence: formValue.frequence.toUpperCase(),
      tauxInteretNominal: formValue.tauxNominal,
      typeEprunteur: formValue.typeEmprunteur,
      fraisList: formValue.fraisObligatoires,
      assuranceList: formValue.assurancesObligatoires,
      tableauDeblocages: formValue.deblocages.map((d: any, i: number) => ({
        dateDeblocage: new Date(d.dateDeblocage).toISOString().split('T')[0],
        montant: d.montant,
        numero: i + 1
      }))
    };

    this.simService.calculer(request).subscribe({
      next: (res) => {
        this.simulationResult = res;
        this.openResultDialog(request);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Erreur lors de la simulation.';
        this.isLoading = false;
      }
    });
  }

  private openResultDialog(request: SimulationDtoRequest): void {
    this.dialog.open(SimulationResultModalComponent, {
      width: '90%',
      maxWidth: '800px',
      data: {
        simulation: this.simulationResult!,
        category: this.category?.nomCategorie || '',
        request,
        dureeInitiale: this.simulationForm.get('duree')?.value,
        tauxNominalInitial: this.simulationForm.get('tauxNominal')?.value
      }
    });
  }

  triggerFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    } else {
      this.errorMessage = 'Erreur : Impossible d\'accéder au sélecteur de fichier.';
      console.error('File input reference not found.');
    }
  }

  disablePastDates = (d: Date | null): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d ? d >= today : false;
  };

  importSimulation(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.errorMessage = 'Aucun fichier sélectionné.';
      console.error('No file selected.');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const file = input.files[0];
    if (!file.name.endsWith('.xlsx')) {
      this.errorMessage = 'Seuls les fichiers .xlsx sont acceptés.';
      console.error('Invalid file type:', file.name);
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.simService
      .importExcel(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dto: SimulationDtoRequest) => {
          console.log('Imported DTO:', JSON.stringify(dto, null, 2));

          // Clear existing FormArrays
          this.fraisObligatoires.clear();
          this.assurancesObligatoires.clear();
          this.deblocages.clear();

          // Populate fraisObligatoires
          (dto.fraisList || []).forEach(frais => {
            this.fraisObligatoires.push(this.fb.group({
              nom: [frais.nom || '', Validators.required],
              montant: [frais.montant != null ? frais.montant : null, [Validators.required, Validators.min(0)]]
            }));
          });

          // Populate assurancesObligatoires
          (dto.assuranceList || []).forEach(assurance => {
            this.assurancesObligatoires.push(this.fb.group({
              nom: [assurance.nom || '', Validators.required],
              montant: [assurance.montant != null ? assurance.montant : null, [Validators.required, Validators.min(0)]]
            }));
          });

          // Populate deblocages
          (

dto.tableauDeblocages || []).forEach(deblocage => {
            this.deblocages.push(this.fb.group({
              dateDeblocage: [deblocage.dateDeblocage ? new Date(deblocage.dateDeblocage) : null, Validators.required],
              montant: [deblocage.montant != null ? deblocage.montant : null, [Validators.required, Validators.min(1)]]
            }));
          });

          // Patch scalar fields
          this.simulationForm.patchValue({
            montant: dto.montantEmprunte != null ? dto.montantEmprunte : null,
            duree: dto.duree != null ? dto.duree : null,
            dateDebut: dto.datePremiereEcheance ? new Date(dto.datePremiereEcheance) : null,
            frequence: dto.frequence || null,
            tauxNominal: dto.tauxInteretNominal != null ? dto.tauxInteretNominal : null,
            typeEmprunteur: dto.typeEprunteur || null
          });

          // Adjust duree based on frequence (reverse transformation from simulateCredit)
          if (dto.frequence && dto.duree != null) {
            let dureeInitiale = dto.duree;
            switch (dto.frequence.toUpperCase()) {
              case 'MENSUELLE':
                dureeInitiale = dto.duree * 12;
                break;
              case 'TRIMESTRIALITE':
                dureeInitiale = dto.duree * 4;
                break;
              case 'ANNUELLE':
              default:
                break;
            }
            this.simulationForm.patchValue({ duree: dureeInitiale });
          }

          // Validate form after patching
          this.simulationForm.updateValueAndValidity();
          if (this.simulationForm.invalid) {
            this.errorMessage = 'Les données importées sont incomplètes ou invalides.';
          } else {
            this.errorMessage = 'Fichier importé avec succès.';
          }

          this.simulationForm.markAsDirty();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Erreur lors de l\'importation du fichier Excel. Vérifiez le format du fichier.';
          console.error('Import Error:', err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}