import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TauxUsureService } from '../../services/taux-usure.service';
import { CategoryService } from '../../services/category.service';
import { AuthServiceService } from '../../services/auth/auth-service.service';
import { UserHeaderComponent } from '../user-header/user-header.component';
import { CategorieCredit } from '../../models/category';
import { TauxUsure } from '../../models/taux-usure';

@Component({
  selector: 'app-statistique-taux-usure',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    UserHeaderComponent
  ],
  templateUrl: './statistique-taux-usure.component.html',
  styleUrls: ['./statistique-taux-usure.component.css']
})
export class StatistiqueTauxUsureComponent implements OnInit, AfterViewInit {
  categories: CategorieCredit[] = [];
  selectedCategory: number | null = null;
  isLoading = false;
  chart: Chart | null = null;

  constructor(
    private tauxUsureService: TauxUsureService,
    private categoryService: CategoryService,
    private authService: AuthServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.loadCategories();
  }

  ngAfterViewInit(): void {}

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
         if (categories.length > 0) {
          this.selectedCategory = categories[0].id !== undefined ? categories[0].id : null; // Safe assignment
          if (this.selectedCategory) {
            this.onCategoryChange(); // Load chart only if category is valid
          }
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onCategoryChange(): void {
    if (this.selectedCategory) {
      this.isLoading = true;
      this.tauxUsureService.getListeByCategorieId(this.selectedCategory).subscribe({
        next: (tauxUsure: TauxUsure[]) => {
          this.renderChart(tauxUsure);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }

  renderChart(tauxUsure: TauxUsure[]): void {
    const canvas = document.getElementById('tauxUsureChart') as HTMLCanvasElement;
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: tauxUsure.map(t => t.annee.toString()),
        datasets: [{
          label: 'Taux d\'usure (%)',
          data: tauxUsure.map(t => t.tauxUsure),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Taux d\'usure (%)' }
          },
          x: {
            title: { display: true, text: 'Année' }
          }
        }
      }
    });
  }
}