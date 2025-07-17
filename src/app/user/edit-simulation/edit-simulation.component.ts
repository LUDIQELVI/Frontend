import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
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
import { Simulation, SimulationDtoRequest } from '../../models/simulation.models';
import { UserHeaderComponent } from '../user-header/user-header.component';
import { NotificationComponent } from '../notification/notification.component';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthServiceService } from '../../services/auth/auth-service.service';

@Component({
  selector: 'app-edit-simulation',
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
  ],
  templateUrl: './edit-simulation.component.html',
  styleUrls: ['./edit-simulation.component.css'],
  providers: [DecimalPipe, DatePipe]
})
export class EditSimulationComponent implements OnInit, OnDestroy {
  simulationForm!: FormGroup;
  category: CategorieCredit | null = null;
  tauxUsure: TauxUsure[] = [];
  simulationId: number | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  destroy$ = new Subject<void>();

  frequenceOptions: string[] = ['MENSUELLE', 'TRIMESTRIALITE', 'ANNUELLE', 'SEMESTRIELLE'];
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
    private cdr: ChangeDetectorRef,
    private auth: AuthServiceService
  ) {}

 ngOnInit(): void {
  this.initForm();
  this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
    this.simulationId = params['simulationId'] ? +params['simulationId'] : null;
    if (this.simulationId) {
      this.loadSimulation(this.simulationId);
    }
  });
}

  private initForm(): void {
    this.simulationForm = this.fb.group({
      montant: [null, [Validators.required, Validators.min(1)]],
      duree: [null, [Validators.required, Validators.min(1)]],
      dateDebut: [null, Validators.required],
      frequence: [null, Validators.required],
      tauxNominal: [null, [Validators.required, Validators.min(0.01)]],
      typeEmprunteur: [null, Validators.required],
      fraisObligatoires: this.fb.array([]),
      assurancesObligatoires: this.fb.array([]),
      deblocages: this.fb.array([], { validators: this.deblocageValidator() })
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

 private loadSimulation(simulationId: number): void {
  this.isLoading = true;
  const user = this.auth.getUser();
  if (!user?.id) {
    this.errorMessage = "Utilisateur non connecté";
    this.isLoading = false;
    return;
  }

  this.simService.getUserSimulations(user.id).pipe(takeUntil(this.destroy$)).subscribe({
    next: (simulations) => {
      const simulation = simulations.find(s => s.id === simulationId);
      if (simulation) {
        this.loadCategoryAndTauxUsure(simulation.categorieCredit?.id || 2);
        this.populateForm(simulation);
      } else {
        this.errorMessage = "Simulation non trouvée.";
      }
      this.isLoading = false;
    },
    error: (err) => {
      this.errorMessage = "Erreur lors du chargement des simulations.";
      this.isLoading = false;
      console.error(err);
    }
  });
}


  private loadCategoryAndTauxUsure(categoryId: number): void {
    forkJoin([
      this.categoryService.getCategoryById(categoryId),
      this.tauxUsureService.getListeByCategorieId(categoryId)
    ]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([category, tauxUsure]) => {
        this.category = category;
        this.tauxUsure = tauxUsure;
        this.populateMandatoryFields(category);
        this.cdr.detectChanges();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erreur lors du chargement des données de catégorie.';
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

  private populateForm(simulation: Simulation): void {
    this.deblocages.clear();
    (simulation.tableauDeblocages || []).forEach(deblocage => {
      this.deblocages.push(this.fb.group({
        dateDeblocage: [deblocage.dateDeblocage ? new Date(deblocage.dateDeblocage) : null, Validators.required],
        montant: [deblocage.montant != null ? deblocage.montant : null, [Validators.required, Validators.min(1)]]
      }));
    });

    if (!this.deblocages.length) {
      this.deblocages.push(this.fb.group({
        dateDeblocage: [simulation.datePremiereEcheance ? new Date(simulation.datePremiereEcheance) : null, Validators.required],
        montant: [simulation.montant || null, [Validators.required, Validators.min(1)]]
      }));
    }

    let dureeInitiale = simulation.duree;
    switch (simulation.frequence?.toUpperCase()) {
      case 'MENSUELLE':
        dureeInitiale = simulation.duree * 12;
        break;
      case 'TRIMESTRIALITE':
        dureeInitiale = simulation.duree * 4;
        break;
      case 'SEMESTRIELLE':
        dureeInitiale = simulation.duree * 2;
        break;
      case 'ANNUELLE':
      default:
        break;
    }

    this.simulationForm.patchValue({
      montant: simulation.montant,
      duree: dureeInitiale,
      dateDebut: simulation.datePremiereEcheance ? new Date(simulation.datePremiereEcheance) : null,
      frequence: simulation.frequence,
      tauxNominal: simulation.tauxNominal,
      typeEmprunteur: simulation.typeEmprunteur
    });

    this.fraisObligatoires.clear();
    (simulation.fraisJson || []).forEach(frais => {
      this.fraisObligatoires.push(this.fb.group({
        nom: [frais.nom, Validators.required],
        montant: [frais.montant, [Validators.required, Validators.min(0)]]
      }));
    });

    this.assurancesObligatoires.clear();
    (simulation.assuranceJson || []).forEach(assurance => {
      this.assurancesObligatoires.push(this.fb.group({
        nom: [assurance.nom, Validators.required],
        montant: [assurance.montant, [Validators.required, Validators.min(0)]]
      }));
    });

    this.simulationForm.updateValueAndValidity();
    this.cdr.detectChanges();
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

saveSimulation(): void {
  this.simulationForm.markAllAsTouched();

  if (this.simulationForm.invalid || this.simulationForm.get('deblocages')?.errors?.['invalidDeblocageDate']) {
    this.errorMessage = 'Entrez les bonnes informations dans votre simulateur. La date de déblocage doit être avant la date de première échéance.';
    return;
  }

  if (!this.simulationId) {
    this.errorMessage = 'ID de simulation manquant.';
    return;
  }

  this.isLoading = true;
  this.errorMessage = null;

  const formValue = this.simulationForm.getRawValue();

  let dureeReelle = formValue.duree;
  switch (formValue.frequence?.toUpperCase()) {
    case 'MENSUELLE':
      dureeReelle = formValue.duree / 12;
      break;
    case 'TRIMESTRIALITE':
      dureeReelle = formValue.duree / 4;
      break;
    case 'SEMESTRIELLE':
      dureeReelle = formValue.duree / 2;
      break;
    case 'ANNUELLE':
    default:
      break;
  }

  const request: SimulationDtoRequest = {
    categorieCreditId: this.category?.id || 2,
    montantEmprunte: formValue.montant,
    duree: dureeReelle,
    datePremiereEcheance: new Date(formValue.dateDebut).toISOString().split('T')[0],
    frequence: formValue.frequence.toUpperCase(),
    tauxInteretNominal: formValue.tauxNominal,
    typeEprunteur: formValue.typeEmprunteur,
    fraisList: formValue.fraisObligatoires.map((f: any) => ({ nom: f.nom, montant: f.montant })),
    assuranceList: formValue.assurancesObligatoires.map((a: any) => ({ nom: a.nom, montant: a.montant })),
    tableauDeblocages: formValue.deblocages.map((d: any, i: number) => ({
      dateDeblocage: new Date(d.dateDeblocage).toISOString().split('T')[0],
      montant: d.montant,
      numero: i + 1
    }))
  };

  this.simService.updateSimulation(this.simulationId, request).pipe(takeUntil(this.destroy$)).subscribe({
    next: () => {
      this.isLoading = false;
      this.router.navigate(['/user/list-simulations']);
    },
    error: (err: HttpErrorResponse) => {
      console.error('Erreur complète:', err);
      this.errorMessage = err.error?.message || err.message || 'Erreur lors de la mise à jour de la simulation.';
      this.isLoading = false;
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

    this.simService.importExcel(file).pipe(takeUntil(this.destroy$)).subscribe({
      next: (dto: SimulationDtoRequest) => {
        console.log('Imported DTO:', JSON.stringify(dto, null, 2));

        this.deblocages.clear();
        this.fraisObligatoires.clear();
        this.assurancesObligatoires.clear();

        (dto.fraisList || []).forEach(frais => {
          this.fraisObligatoires.push(this.fb.group({
            nom: [frais.nom || '', Validators.required],
            montant: [frais.montant != null ? frais.montant : null, [Validators.required, Validators.min(0)]]
          }));
        });

        (dto.assuranceList || []).forEach(assurance => {
          this.assurancesObligatoires.push(this.fb.group({
            nom: [assurance.nom || '', Validators.required],
            montant: [assurance.montant != null ? assurance.montant : null, [Validators.required, Validators.min(0)]]
          }));
        });

        (dto.tableauDeblocages || []).forEach(deblocage => {
          this.deblocages.push(this.fb.group({
            dateDeblocage: [deblocage.dateDeblocage ? new Date(deblocage.dateDeblocage) : null, Validators.required],
            montant: [deblocage.montant != null ? deblocage.montant : null, [Validators.required, Validators.min(1)]]
          }));
        });

        if (!this.deblocages.length) {
          this.deblocages.push(this.fb.group({
            dateDeblocage: [dto.datePremiereEcheance ? new Date(dto.datePremiereEcheance) : null, Validators.required],
            montant: [dto.montantEmprunte || null, [Validators.required, Validators.min(1)]]
          }));
        }

        this.simulationForm.patchValue({
          montant: dto.montantEmprunte != null ? dto.montantEmprunte : null,
          duree: dto.duree != null ? dto.duree : null,
          dateDebut: dto.datePremiereEcheance ? new Date(dto.datePremiereEcheance) : null,
          frequence: dto.frequence || null,
          tauxNominal: dto.tauxInteretNominal != null ? dto.tauxInteretNominal : null,
          typeEmprunteur: dto.typeEprunteur || null
        });

        if (dto.frequence && dto.duree != null) {
          let dureeInitiale = dto.duree;
          switch (dto.frequence.toUpperCase()) {
            case 'MENSUELLE':
              dureeInitiale = dto.duree * 12;
              break;
            case 'TRIMESTRIALITE':
              dureeInitiale = dto.duree * 4;
              break;
            case 'SEMESTRIELLE':
              dureeInitiale = dto.duree * 2;
              break;
            case 'ANNUELLE':
            default:
              break;
          }
          this.simulationForm.patchValue({ duree: dureeInitiale });
        }

        if (dto.categorieCreditId) {
          this.loadCategoryAndTauxUsure(dto.categorieCreditId);
        }

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

  cancel(): void {
    this.router.navigate(['/user/list-simulations']);
  }

  disablePastDates = (d: Date | null): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d ? d >= today : false;
  };

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}