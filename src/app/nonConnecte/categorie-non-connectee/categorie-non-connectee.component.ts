import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

import { CategoryService } from '../../services/category.service';
import { CategorieCredit } from '../../models/category';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-categorie-non-connectee',
  templateUrl: './categorie-non-connectee.component.html',
  styleUrls: ['./categorie-non-connectee.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    HeaderComponent,
  ],
})
export class CategorieNonConnecteeComponent implements OnInit {
  categories$: Observable<CategorieCredit[]> = of([]);
  selectedCategoryId: number | null = null;
  errorMessage: string | null = null;
  isLoadingCategories = false;
  navbarFixed = false;
  sidenavOpened = false;

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.navbarFixed = window.scrollY > 100;
  }

  private loadCategories(): void {
    this.isLoadingCategories = true;
    this.errorMessage = null;
    this.categories$ = this.categoryService.getCategories().pipe(
      finalize(() => (this.isLoadingCategories = false)),
      catchError((err) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des catégories.';
        console.error('CategorieNonConnecteeComponent Error:', err);
        return of([]);
      })
    );
  }

  selectCategory(categoryId: number): void {
    this.selectedCategoryId = this.selectedCategoryId === categoryId ? null : categoryId;
  }

  goToSimulation(): void {
    if (!this.selectedCategoryId) {
      this.errorMessage = 'Veuillez sélectionner une catégorie avant de continuer.';
      return;
    }
    this.router.navigate(['/user/simulationNon'], {
      queryParams: { categoryId: this.selectedCategoryId },
    });
  }

 getCategoryIcon(nomCategorie: string): string {
  const iconMap: { [key: string]: string } = {
    'Crédit-bail': 'handshake',                // leasing / bail, handshake icon
    'Crédit immobilier': 'home',               // maison
    'Crédit à l’habitat': 'cottage',           // logement
    'Crédit à l’équipement': 'build',          // outils / équipement
    'Crédit d’investissement': 'engineering',  // industrie / projet
    'Crédit personnel amortissable': 'person',// personnel
    'Crédit hypothécaire': 'gavel',            // hypothèque = marteau de juge
    'Crédit auto': 'directions_car',           // voiture
    'Crédit à la trésorerie (MLT)': 'account_balance_wallet', // trésorerie = portefeuille
    'Crédit à l’exportation': 'local_shipping',// export = transport
    'Prêt syndiqué': 'group',                   // syndiqué = groupe
    'Crédit scolaire': 'school',                 // scolaire = école
    'Microcrédit amortissable': 'payments',      // microcrédit = paiements
    'Crédit agricole': 'agriculture',            // agricole = agriculture (custom icon)
    'Crédit professionnel (MLT)': 'business_center',  // professionnel
    'Crédit construction / rénovation': 'construction',// construction
    'Crédit conso amortissable': 'shopping_cart',     // consommation
  };
  
  // icône par défaut si non trouvé
  return iconMap[nomCategorie] || 'credit_card';
}

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }
}
