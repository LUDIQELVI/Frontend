import {
  Component, OnInit, ChangeDetectorRef
} from '@angular/core';
import {
  FormBuilder, FormGroup, Validators, FormArray, ValidatorFn, AbstractControl
} from '@angular/forms';
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

import { forkJoin } from 'rxjs';

import { CategoryService } from '../../services/category.service';
import { SimulationService } from '../../services/simulation/simulation.service';
import { TauxUsureService } from '../../services/taux-usure.service';
import { CategorieCredit } from '../../models/category';
import { TauxUsure } from '../../models/taux-usure';
import { SimulationDtoRequest, Simulation } from '../../models/simulation.models';
import { HeaderComponent } from '../header/header.component';
import { SimulationResultDialogComponent } from '../simulation-result-dialog/simulation-result-dialog.component';

@Component({
  selector: 'app-simulation-non-connectee',
  templateUrl: './simulation-non-connectee.component.html',
  styleUrls: ['./simulation-non-connectee.component.css'],
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
    HeaderComponent
  ],
  providers: [DecimalPipe, DatePipe]
})
export class SimulationNonConnecteeComponent implements OnInit {
  simulationForm!: FormGroup;
  category: CategorieCredit | null = null;
  tauxUsure: TauxUsure[] = [];
  simulationResult: Simulation | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  frequenceOptions: string[] = ['MENSUELLE', 'TRIMESTRIALITE', 'ANNUELLE'];
  typeEmprunteurOptions: string[] = [
      'PARTICULIER',
   'GRANDE_ENTREPRISE',
    'PME',
    'ADMINISTRATIONS_PUBLIQUES',
    'SOCIETES_NON_FINANCIERES_PUBLIQUES',
    'SOCIETES_ASSURANCE',
    'AUTRES_SOCIETES_FINANCIERES',
    'MENAGES',
    'INSTITUTIONS_SANS_BUT_LUCRATIF',

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

    // Mise à jour dynamique des validations de déblocages lors du changement de dateDebut
    this.simulationForm.get('dateDebut')?.valueChanges.subscribe(() => {
      this.simulationForm.get('deblocages')?.updateValueAndValidity();
    });

    this.simulationForm.get('typeEmprunteur')?.valueChanges.subscribe(type => {
      this.onTypeEmprunteurChange(type);
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
  return (control: AbstractControl): { [key: string]: any } | null => {
    const deblocages = control.value as any[];
    const dateDebut = this.simulationForm?.get('dateDebut')?.value;
    if (!dateDebut || !Array.isArray(deblocages)) return null;

    const dateDebutTime = new Date(dateDebut).getTime();

    for (const d of deblocages) {
      if (!d.dateDeblocage || isNaN(new Date(d.dateDeblocage).getTime())) continue;
      const dTime = new Date(d.dateDeblocage).getTime();
      if (dTime >= dateDebutTime) {
        return { invalidDeblocageDate: true };
      }
    }

    return null;
  };
}


  formatNumber(value: number | null): string {
    return value !== null ? this.decimalPipe.transform(value, '1.0-0') || '' : '';
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
  if (this.deblocages.length > 1) {
    this.deblocages.removeAt(index);
  }
}


  onTypeEmprunteurChange(type: string): void {
    const taux = this.tauxUsure.find(tu => tu.typeEmprunteur === type);
    if (taux) {
      this.simulationForm.get('tauxNominal')?.setValue(taux.tauxUsure);
    }
  }

  simulateCredit(): void {
  this.simulationForm.markAllAsTouched();

  console.log('Form Value before submit:', this.simulationForm.value);

  if (this.simulationForm.invalid || this.simulationForm.get('deblocages')?.errors?.['invalidDeblocageDate']) {
    console.warn('Form invalid or deblocage error:', this.simulationForm.errors, this.simulationForm.get('deblocages')?.errors);
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
    case 'TRIMESTRIELLE':
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

  console.log('Request sent to backend:', request);

  this.simService.calculer(request).subscribe({
    next: (res) => {
      console.log('Response received:', res);
      this.simulationResult = res;
      this.openResultDialog(request);
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Error during simulation:', err);
      this.errorMessage = err.message || 'Erreur lors de la simulation.';
      this.isLoading = false;
    }
  });
}


  private openResultDialog(request: SimulationDtoRequest): void {
    this.dialog.open(SimulationResultDialogComponent, {
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
}
